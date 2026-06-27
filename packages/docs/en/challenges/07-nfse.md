# Challenge 07 — NFS-e Integration

**🇧🇷** Integração com Nota Fiscal Eletrônica  
**🇬🇧** Electronic Invoice Integration

---

In Brazil, every service company must issue NFS-e — the Electronic Service Invoice. Each city has its own system, its own XML, its own SOAP. There are 5,570 municipalities, each with a different implementation of the ABRASF standard.

The challenge isn't issuing one invoice. It's issuing an invoice in any municipality without losing your mind.

This simulator implements the ABRASF 3.0 standard: XML generation, digital signing, SOAP submission, query, and cancellation.

---

## Architecture

```mermaid
sequenceDiagram
    participant Company
    participant NFS-e
    participant Certificate
    participant CityHall

    Company->>NFS-e: Invoice data
    NFS-e->>NFS-e: Generates ABRASF XML
    NFS-e->>Certificate: Signs XML
    Certificate-->>NFS-e: Signed XML
    NFS-e->>CityHall: Sends SOAP
    CityHall-->>NFS-e: Protocol
    NFS-e-->>Company: Invoice issued
```

---

## TypeScript Implementation

### ABRASF XML Generation

```typescript
function buildNFSexml(data: NFSData): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<GerarNfseEnvio xmlns="http://www.abrasf.org.br/nfse">
  <Prestador>
    <Cnpj>${data.provider.cnpj}</Cnpj>
    <InscricaoMunicipal>${data.provider.municipalReg}</InscricaoMunicipal>
  </Prestador>
  <Servico>
    <Valores>
      <ValorServicos>${data.amount.toFixed(2)}</ValorServicos>
      <ValorIss>${calculateISS(data.amount, data.cityCode)}</ValorIss>
    </Valores>
    <ItemListaServico>${data.serviceCode}</ItemListaServico>
    <Discriminacao>${data.description}</Discriminacao>
    <CodigoMunicipio>${data.cityCode}</CodigoMunicipio>
  </Servico>
  <Tomador>
    <CpfCnpj>
      <Cnpj>${data.taker.cnpj}</Cnpj>
    </CpfCnpj>
    <RazaoSocial>${data.taker.name}</RazaoSocial>
  </Tomador>
</GerarNfseEnvio>`;
}
```

### SOAP Submission

```typescript
import { createClientAsync } from 'soap';

async function emitNFS(data: NFSData): Promise<string> {
  const xml = buildNFSexml(data);
  const signedXml = await signXML(xml, certificate);
  
  const client = await createClientAsync(data.cityWsdl);
  
  const result = await client.GerarNfseAsync({ xml: signedXml });
  
  return result.NumeroNfse;
}
```

### Tax Calculation

```typescript
function calculateTaxes(amount: number, cityCode: string) {
  const issAliquota = getCityAliquota(cityCode); // 2-5%
  
  return {
    iss: amount * (issAliquota / 100),
    pis: amount * 0.015,       // 1.5% simplified
    cofins: amount * 0.069,    // 6.9% simplified
    ir: amount * 0.015,        // 1.5% simplified
    csll: amount * 0.01,       // 1% simplified
    totalTaxes: amount * (issAliquota / 100 + 0.015 + 0.069 + 0.015 + 0.01),
  };
}
```

---

## Go Implementation

```go
package main

import (
    "crypto"
    "crypto/rand"
    "crypto/rsa"
    "crypto/sha256"
    "crypto/x509"
    "encoding/pem"
    "encoding/xml"
    "fmt"
    "net/http"
)

// ABRASF XML structure
type GerarNfseEnvio struct {
    XMLName  xml.Name `xml:"GerarNfseEnvio"`
    Prestador struct {
        Cnpj             string `xml:"Cnpj"`
        InscricaoMunicipal string `xml:"InscricaoMunicipal"`
    } `xml:"Prestador"`
    Servico struct {
        Valores struct {
            ValorServicos string `xml:"ValorServicos"`
            ValorIss      string `xml:"ValorIss"`
        } `xml:"Valores"`
        ItemListaServico string `xml:"ItemListaServico"`
        Discriminacao    string `xml:"Discriminacao"`
    } `xml:"Servico"`
}

func generateNFSXML(data NFSData) string {
    env := GerarNfseEnvio{}
    env.Prestador.Cnpj = data.Provider.CNPJ
    env.Prestador.InscricaoMunicipal = data.Provider.MunicipalReg
    env.Servico.Valores.ValorServicos = fmt.Sprintf("%.2f", data.Amount)
    env.Servico.Valores.ValorIss = fmt.Sprintf("%.2f", data.Amount*0.05)
    env.Servico.ItemListaServico = data.ServiceCode
    env.Servico.Discriminacao = data.Description
    
    xmlBytes, _ := xml.MarshalIndent(env, "", "  ")
    return string(xmlBytes)
}

func signXML(xmlContent string, privateKey *rsa.PrivateKey) (string, error) {
    hash := sha256.Sum256([]byte(xmlContent))
    signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hash[:])
    if err != nil {
        return "", err
    }
    
    // Wrap in XML signature
    signedXML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<SignedXml>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <SignatureValue>%x</SignatureValue>
    </SignedInfo>
  </Signature>
  <XmlContent>%s</XmlContent>
</SignedXml>`, signature, xmlContent)
    
    return signedXML, nil
}
```

---

## Testing

```bash
pnpm --filter @banking/nfse dev

curl -X POST http://localhost:3007/api/v1/nfse/emitter \
  -H "Content-Type: application/json" \
  -d '{"provider":{"cnpj":"12345678000195","municipalReg":"12345"},
       "amount":1500,"description":"Software development","cityCode":"3550308",
       "taker":{"cnpj":"98765432000195","name":"Empresa Ltda"}}'
```

---

## Lessons Learned

1. **XML isn't dead** — In the Brazilian government, XML is king. SOAP, digital certificates, complex schemas. Anyone who thinks "just use REST" has never integrated with a city hall.
2. **Every municipality is its own world** — São Paulo has one API. Rio has another. Belo Horizonte has another. The ABRASF standard tries to unify, but each city implements it their own way.
3. **Digital certificate is mandatory** — Without A1 or A3, nothing works. The XML signature must be valid for the city hall to accept it.
4. **ISS tax varies by city** — 2% in some municipalities, 5% in others. A wrong calculation generates an invalid invoice.
