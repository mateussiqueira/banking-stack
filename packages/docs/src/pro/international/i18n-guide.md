# Internationalization Guide

Phase 6 — Global Expansion and Enterprise (Months 19-24)

## Translation Workflow

### Portuguese → English Pipeline

1. **Source Content** — All content authored in Brazilian Portuguese (pt-BR)
2. **Translation Phase** — Professional banking/fintech translators
3. **Technical Review** — Verify financial terminology accuracy
4. **Locale Adaptation** — Adjust for US/UK conventions
5. **QA Validation** — Native speakers verify readability

### Content Categories

| Category | Priority | Notes |
|----------|----------|-------|
| Core Banking Concepts | High | Universal, minimal adaptation |
| Brazilian Market Content | Low | Requires US/EU equivalents |
| Regulatory Compliance | High | Jurisdiction-specific review |
| Code Examples | Medium | US dates, currency formats |

## Content Adaptation for US/Europe Markets

### United States

- Currency: USD ($), no BRL (R$) references
- Date format: MM/DD/YYYY
- Number format: 1,234.56 (comma separator)
- Payment systems: ACH, FedNow, RTP
- Regulatory: OCC, FDIC, CFPB references

### European Union

- Currency: EUR (€), no BRL references
- Date format: DD/MM/YYYY or DD.MM.YYYY
- Number format: 1.234,56 (period separator)
- Payment systems: SEPA, STEP2, RT1
- Regulatory: ECB, EBA, PSD2/PSD3 references

### UK

- Currency: GBP (£)
- Date format: DD/MM/YYYY
- Payment systems: Bacs, CHAPS, Faster Payments
- Regulatory: FCA, PRA references

## Technical Terms Glossary

| Portuguese | English (US) | English (UK) | Description |
|------------|--------------|--------------|-------------|
| Conta corrente | Checking account | Current account | Standard bank account |
| Pix | Instant payment | Instant payment | Brazil's instant payment (no direct equivalent) |
| TED | Wire transfer | Wire transfer | Electronic fund transfer |
| DOC | Bank transfer | BACS transfer | Scheduled bank transfer |
| Boleto | Bank slip | Bank slip / Invoice | Brazilian payment method |
| Chave Pix | Pix key | Pix key | Unique identifier for Pix transactions |
| Saldo | Balance | Balance | Account balance |
| Extrato | Statement | Bank statement | Transaction history |
| Consórcio | Consortium | Consortium | Group purchasing arrangement |
| CDB | Certificate of Deposit | Certificate of Deposit | Fixed-income investment |

## Localization Checklist

- [ ] Replace BRL currency references with target currency
- [ ] Update date/time formats for target locale
- [ ] Convert number formatting conventions
- [ ] Replace Brazilian payment methods with local equivalents
- [ ] Update regulatory body references
- [ ] Verify banking terminology for target market
- [ ] Test date pickers and calendar components
- [ ] Validate i18n strings in all supported locales
- [ ] Review accessibility labels in translated content
- [ ] Test RTL layout for Arabic/Hebrew if applicable
