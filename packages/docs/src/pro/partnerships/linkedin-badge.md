# Badge de Verificação LinkedIn — Banking Stack Pro

**Objetivo:** Criar um sistema de credenciamento técnico visível no LinkedIn que comprove competência em engenharia fintech.

---

## Design do Badge (SVG)

### Badge Principal — Certificado

```svg
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="200" rx="20" fill="#0F172A"/>
  
  <!-- Shield shape -->
  <path d="M100 20 L160 50 L160 110 Q160 160 100 180 Q40 160 40 110 L40 50 Z" 
        fill="none" stroke="#F59E0B" stroke-width="3"/>
  
  <!-- Inner shield -->
  <path d="M100 35 L148 60 L148 108 Q148 150 100 168 Q52 150 52 108 L52 60 Z" 
        fill="#1E293B"/>
  
  <!-- Go gopher icon (simplified) -->
  <circle cx="100" cy="90" r="25" fill="#00ADD8"/>
  <circle cx="92" cy="85" r="4" fill="#0F172A"/>
  <circle cx="108" cy="85" r="4" fill="#0F172A"/>
  <path d="M92 100 Q100 108 108 100" stroke="#0F172A" stroke-width="2" fill="none"/>
  
  <!-- Rust crab icon (simplified) -->
  <circle cx="70" cy="120" r="15" fill="#CE422B"/>
  <path d="M65 115 L75 115 M65 125 L75 125" stroke="#0F172A" stroke-width="2"/>
  
  <!-- Text -->
  <text x="100" y="155" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="11" fill="#F59E0B" font-weight="bold">BANKING STACK</text>
  <text x="100" y="170" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="10" fill="#94A3B8">PRO CERTIFIED</text>
  
  <!-- Verification checkmark -->
  <circle cx="150" cy="50" r="18" fill="#22C55E"/>
  <path d="M142 50 L148 56 L160 44" stroke="white" stroke-width="3" fill="none"/>
</svg>
```

### Badge — Nível Avançado

```svg
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="200" rx="20" fill="#0F172A"/>
  
  <!-- Diamond shape -->
  <polygon points="100,15 180,100 100,185 20,100" fill="none" stroke="#EAB308" stroke-width="3"/>
  <polygon points="100,30 165,100 100,170 35,100" fill="#1E293B"/>
  
  <!-- Icons -->
  <text x="100" y="85" text-anchor="middle" font-size="24">🦀</text>
  <text x="100" y="115" text-anchor="middle" font-size="24">🐹</text>
  
  <!-- Text -->
  <text x="100" y="145" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="10" fill="#EAB308" font-weight="bold">ADVANCED</text>
  <text x="100" y="160" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="9" fill="#94A3B8">DISTRIBUTED SYS</text>
</svg>
```

---

## Critérios de Verificação

### Nível Básico — Banking Stack Certified

| Critério | Requisito |
|----------|-----------|
| Módulo 1 (Go) | 100% completo |
| Desafios | 3/5 finalizados |
| Quiz | Nota ≥ 80% |
| Projeto | 1 projeto funcional no GitHub |
| Código | Review aprovado por mentor |

### Nível Avançado — Banking Stack Advanced

| Critério | Requisito |
|----------|-----------|
| Módulos 1-3 | 100% completos |
| Desafios | 5/7 finalizados |
| Projeto Final | Sistema completo de pagamentos |
| Code Review | 2 reviews comunitários aprovados |
| Contribuição | 1 contribuição open source relevante |

### Nível Expert — Banking Stack Expert

| Critério | Requisito |
|----------|-----------|
| Todos os módulos | 100% completos |
| Todos os desafios | 7/7 finalizados |
| Projeto Enterprise | Sistema em produção ou equivalente |
| Mentoria | 50h de mentoria comunitária |
| Reconhecimento | Indicação de 3 engenheiros parceiros |

---

## Como Adicionar ao LinkedIn

### Passo 1: Baixe o Badge

1. Acesse: `bankingstack.pro/certificados/[SEU-ID]`
2. Clique em "Baixar Badge"
3. Salve o arquivo SVG ou PNG

### Passo 2: Adicione ao Perfil

1. Va para seu perfil LinkedIn
2. Clique em "Adicionar seção"
3. Selecione "Certificações"
4. Preencha:
   - **Nome:** Banking Stack Pro Certified
   - **Organização:** Banking Stack Pro
   - **Data:** [DATA DE CONCLUSÃO]
   - **URL:** bankingstack.pro/certificados/[SEU-ID]

### Passo 3: Verificação QR Code

1. Acesse: `bankingstack.pro/verificar/[SEU-ID]`
2. Escaneie o QR Code
3. Valide o status da certificação

---

## Template de Post LinkedIn

```
🎉 Orgulhoso em compartilhar minha certificação Banking Stack Pro!

Após [N] meses de estudo intensivo em:
✅ Go para sistemas financeiros
✅ Rust para performance e segurança
✅ Sistemas distribuídos (Kafka, Event Sourcing)

O programa me preparou para:
→ Construir motores de transações de alta performance
→ Arquitetar sistemas com garantias ACID
→ Implementar processamento idempotente em escala

Agradeço à equipe Banking Stack Pro e aos mentores que me
acompanharam nessa jornada.

#fintech #golang #rust #distributedsystems #bankingstackpro
```

---

## QR Code de Verificação

### Geração do QR Code

```python
import qrcode

def generate_verification_qr(user_id: str) -> str:
    url = f"https://bankingstack.pro/verificar/{user_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#F59E0B", back_color="#0F172A")
    img.save(f"badge_{user_id}.png")
    
    return url
```

### URL de Verificação

```
https://bankingstack.pro/verificar/{CERTIFICADO_ID}

Status retornados:
- ✅ Válido — Certificação ativa
- ⚠️ Expirado — Necessária recertificação
- ❌ Inválido — Certificação não encontrada
```

---

## Checklist de Implementação

- [ ] Gerar SVGs dos badges (básico, avançado, expert)
- [ ] Criar endpoint de verificação `/verificar/{id}`
- [ ] Integrar com sistema de certificação existente
- [ ] Criar landing page para download de badges
- [ ] Adicionar QR Code em cada certificado
- [ ] Criar template de post LinkedIn
- [ ] Configurar analytics de downloads
- [ ] Comunicar novidade para alunos certificados

---

**Última atualização:** 2026-06-30
**Responsável:** Equipe Banking Stack Pro
