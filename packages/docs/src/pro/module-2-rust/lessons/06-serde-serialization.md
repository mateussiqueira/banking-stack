# Módulo 2 — Rust para Fintechs
## Aula 06: Serde para ISO 20022, JSON APIs e Protocolos Binários

**Duração:** 45 min
**Nível:** Intermediário/Avançado

### Objetivos
- Serializar e desserializar mensagens financeiras ISO 20022 (XML) com serde
- Definir APIs REST JSON tipadas e validadas para pagamentos
- Implementar serialização binária compacta para mensagens de alta frequência (FIX, SPB)
- Customizar serialization com `#[serde(rename)]`, `serialize_with` e `deserialize_with`

### Teoria

Sistemas financeiros falam dezenas de protocolos: ISO 20022 (XML), FIX (tag-value binário), SPB (binary), JSON APIs REST, mensageria Avro/Protobuf. O serde é o ecossistema de serialização do Rust — o mesmo struct pode ser desserializado de múltiplos formatos sem código adicional.

**API REST JSON com validação forte.** Use serde com tipagem rica — nunca `serde_json::Value` para dados de domínio:

```rust
use serde::{Deserialize, Serialize};
use serde_valid::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct PixPaymentRequest {
    #[validate(min_length = 1, max_length = 35)]
    pub end_to_end_id: String,

    #[serde(rename = "txid")]
    pub transaction_id: String,

    pub payer: PixParticipant,
    pub payee: PixParticipant,

    #[validate(minimum = 1)]
    pub amount_cents: i64,

    pub currency: Option<String>, // Default: BRL
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PixParticipant {
    pub ispb: String,
    pub account_branch: String,
    pub account_number: String,
    pub account_type: AccountType,
    pub document: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AccountType {
    Checking,
    Savings,
    Payment,
}
```

O `#[serde(rename_all)]` converte automaticamente para `CHECKING`, `SAVINGS` e `PAYMENT` no JSON. O `#[serde(rename = "txid")]` mapeia o nome canônico do Pix para um campo mais idiomático em Rust.

**ISO 20022 XML com serde-xml-rs e quick-xml.** O padrão global de mensageria bancária é XML. Use `quick-xml` para performance:

```rust
use serde::{Deserialize, Serialize};
use quick_xml::de::from_str;
use quick_xml::se::to_string;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename = "FIToFICstmrCdtTrf")]
pub struct CustomerCreditTransfer {
    #[serde(rename = "GrpHdr")]
    pub group_header: GroupHeader,

    #[serde(rename = "CdtTrfTxInf")]
    pub credit_transfers: Vec<CreditTransferTransaction>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GroupHeader {
    #[serde(rename = "MsgId")]
    pub message_id: String,

    #[serde(rename = "CreDtTm")]
    pub creation_date_time: String,

    #[serde(rename = "NbOfTxs")]
    pub number_of_transactions: u32,
}

fn parse_pacs_008(xml: &str) -> Result<CustomerCreditTransfer, quick_xml::DeError> {
    from_str(xml)
}
```

**Serialização de enums para códigos bancários.** Erros e status frequentemente são números em protocolos legados. Customize com `#[serde(rename)]` em enums:

```rust
#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PaymentApiResponse {
    Success {
        settlement_id: String,
        #[serde(serialize_with = "serialize_iso8601")]
        processed_at: DateTime<Utc>,
    },
    Pending {
        correlation_id: String,
    },
    Failed {
        #[serde(rename = "errorCode")]
        error_code: String,
        description: String,
    },
}

fn serialize_iso8601<S>(dt: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str(&dt.to_rfc3339())
}
```

**JSON canônico com ordenação determinística.** Para assinaturas digitais e hashing de payloads, o JSON precisa ser determinístico. Serde JSON oferece isso nativamente:

```rust
use serde_json::{to_string, to_string_pretty};
use std::collections::BTreeMap;

fn canonical_signature_payload(tx: &Transaction) -> Result<String, serde_json::Error> {
    let mut map = BTreeMap::new();
    map.insert("amount", tx.amount_cents);
    map.insert("payer", tx.payer_id);
    map.insert("payee", tx.payee_id);
    map.insert("id", &tx.id);

    let mut buf = Vec::new();
    let formatter = serde_json::ser::CompactFormatter {};
    let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
    map.serialize(&mut ser)?;
    Ok(String::from_utf8(buf).unwrap())
}
```

`BTreeMap` garante ordenação lexicográfica das chaves. Serialize sem espaços para hashing consistente.

**Protocolos binários com bincode.** Comunicação entre serviços internos de alta frequência (SPB, mensageria propietária) exige formato binário compacto. `bincode` lê structs do serde:

```rust
fn encode_spb_message(msg: &SettlementInstruction) -> Vec<u8> {
    bincode::serialize(msg).expect("Falha ao codificar mensagem SPB")
}

fn decode_spb_message(bytes: &[u8]) -> Result<SettlementInstruction, bincode::Error> {
    bincode::deserialize(bytes)
}
```

**Custom deserializer para CNAB 240.** Formatos brasileiros como CNAB exigem parsing posicional. Serde permite implementar `Deserializer` customizado:

```rust
use serde::de::{self, Visitor, MapAccess};
use std::fmt;

struct Cnab240Deserializer<'a> {
    line: &'a str,
    position: usize,
}

impl<'de, 'a> de::Deserializer<'de> for &'a mut Cnab240Deserializer<'a> {
    type Error = CnabError;
    // Implementação de deserialize_struct, deserialize_u64, etc.
    // Extrai campos por posição fixa (ex: bytes 0-3 = código do banco)
}
```

### Exercício

Defina um struct `SpiPaymentInstruction` com os campos exigidos pelo SPI (de acordo com a especificação do Banco Central). Serialize-o para JSON seguindo o formato canônico do arranjo Pix. Implemente um custom deserializer que lê o mesmo struct a partir de um formato de texto posicional (posições fixas). Escreva testes que validam round-trip: serialize → desserialize → compare com original.

### Próximo
[07 — SQLx com PostgreSQL para Ledger Persistente](./07-sqlx-postgres.md)
