# Módulo 2 — Rust para Fintechs
## Aula 20: FFI e Integração com Bibliotecas C

**Duração:** 45 min
**Nível:** Avançado

### Objetivos
- Entender a Interface de Função Forânea (FFI) do Rust e seu uso em sistemas financeiros
- Declarar e chamar funções C usando `extern "C"` e blocos `unsafe`
- Utilizar bindgen para gerar bindings automaticamente de headers C
- Integrar bibliotecas C existentes (OpenSSL, zlib) em projetos Rust

### Teoria

Muitos sistemas financeiros legados usam bibliotecas C para criptografia, compressão ou comunicação de baixo nível. O FFI do Rust permite reutilizar esse código sem reescrever, mantendo a segurança do Rust na camada superior.

**O contrato ABI.** Rust e C compartilham a mesma convenção de chamada na plataforma (C ABI). Para chamar C de Rust, declare a função com `extern "C"`:

```rust
// Declaração de função C externa
extern "C" {
    fn abs(input: i32) -> i32;
    fn sqrt(input: f64) -> f64;
}

fn call_c_math() {
    let x = -42;
    let result = unsafe { abs(x) };
    println!("abs({}) = {}", x, result);

    let y = 2.0;
    let root = unsafe { sqrt(y) };
    println!("sqrt({}) = {}", y, root);
}
```

Toda chamada a código C é `unsafe` porque o Rust não pode verificar as garantias de memória do lado C.

**Passando strings entre Rust e C.** C usa ponteiros nulos terminados, Rust usa `String`/`&str`. Converta cuidadosamente:

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

extern "C" {
    fn strlen(s: *const c_char) -> usize;
}

fn ruststrlen(s: &str) -> Result<usize, std::ffi::NulError> {
    let c_str = CString::new(s)?;
    let len = unsafe { strlen(c_str.as_ptr()) };
    Ok(len)
}

fn c_to_rust(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }
    unsafe { CStr::from_ptr(ptr) }
        .to_str()
        .ok()
        .map(|s| s.to_string())
}
```

`CString` garante terminação nula e posse da memória. `CStr` é uma referência emprestada — cuidado com lifetime.

**Trabalhando com ponteiros e structs C.** Para bibliotecas que passam structs:

```rust
#[repr(C)]
struct SpiMessage {
    message_type: u32,
    payload: [u8; 256],
    length: usize,
}

extern "C" {
    fn spi_send_message(msg: *const SpiMessage) -> i32;
}

fn send_spi_message(msg_type: u32, data: &[u8]) -> Result<(), i32> {
    let mut msg = SpiMessage {
        message_type: msg_type,
        payload: [0; 256],
        length: data.len(),
    };
    msg.payload[..data.len()].copy_from_slice(data);

    let result = unsafe { spi_send_message(&msg) };
    if result == 0 {
        Ok(())
    } else {
        Err(result)
    }
}
```

`#[repr(C)]` garante que o layout da struct corresponda ao esperado por C.

**Bindgen para automação.** Em vez de declarar manualmente, use bindgen para gerar bindings a partir de headers C:

```rust
// build.rs
fn main() {
    println!("cargo:rerun-if-changed=wrapper.h");
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Falha ao gerar bindings");

    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Falha ao escrever bindings");
}
```

No `src/lib.rs`:
```rust
#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

Agora todas as funções e structs do header estão disponíveis com tipos Rust seguros.

**Integrando OpenSSL para TLS.** Em financeiro, TLS é obrigatório. O crate `openssl` encapsula a biblioteca C:

```rust
use openssl::ssl::{SslMethod, SslConnector};
use std::net::TcpStream;

fn connect_tls(host: &str, port: u16) -> Result<TcpStream, Box<dyn std::error::Error>> {
    let builder = SslConnector::builder(SslMethod::tls())?;
    let ssl = builder.build();
    let stream = TcpStream::connect(format!("{}:{}", host, port))?;
    let stream = ssl.connect(host, stream)?;
    Ok(stream)
}
```

Por baixo, o crate `openssl` usa FFI para chamar a biblioteca C OpenSSL — abstraindo a complexidade de memória e ponteiros.

**Gerenciamento de memória com Drop.** Quando a biblioteca C aloca memória, crie um wrapper Rust com `Drop` para liberar:

```rust
struct CBuffer {
    ptr: *mut u8,
    len: usize,
}

extern "C" {
    fn c_buffer_alloc(size: usize) -> *mut u8;
    fn c_buffer_free(ptr: *mut u8);
}

impl CBuffer {
    fn new(size: usize) -> Option<Self> {
        let ptr = unsafe { c_buffer_alloc(size) };
        if ptr.is_null() {
            None
        } else {
            Some(CBuffer { ptr, len: size })
        }
    }
}

impl Drop for CBuffer {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe { c_buffer_free(self.ptr) };
        }
    }
}
```

O `Drop` é chamado automaticamente quando `CBuffer` sai de escopo, evitando memory leaks.

### Exercício

Crie um módulo Rust que integre com a biblioteca C `libcrypto` (parte do OpenSSL) para:
1. Usar bindgen para gerar bindings a partir do header `openssl/crypto.h`
2. Chame `CRYPTO_num_locks()` para obter o número de locks e `OPENSSL_version_text()` para a versão
3. Implemente um wrapper seguro `OpenSSLContext` que chame `OPENSSL_init_ssl()` na criação e `OPENSSL_cleanup()` no Drop
4. Escreva testes que verifiquem a inicialização e limpeza correta
5. Documente os blocos unsafe com justificativas

### Próximo
[21 — Deploy de Serviços Rust — Docker, systemd, performance](./21-deploy-production.md)