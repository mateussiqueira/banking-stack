# Template de Code Review Semanal - Banking Stack Pro

## Formato do Evento

| Item | Detalhes |
|------|----------|
| Frequência | Semanal (terça ou quinta) |
| Horário | 19h - 20h (horário de Brasília) |
| Duração | 60 minutos |
| Plataforma | Discord Voice + Screen Share |
| Gravação | Sim, disponibilizada para alunos |

---

## Para Participar

### Como Submeter seu Código

1. **Preencha o formulário até segunda 23h59**:
   - Link do PR no GitHub
   - Breve descrição do que está fazendo
   - Dúvidas específicas que gostaria de ajuda

2. **Requisitos do PR**:
   - Código funcional (não precisa estar completo)
   - README com instruções para rodar
   - Testes quando aplicável

3. **Limite**: 4 PRs por sessão (first come, first served)

### Exemplo de Submissão

```
**Módulo**: Módulo 3 - API Gateway
**Descrição**: Implementei rate limiting em Go usando Redis
**PR**: https://github.com/meu-usuario/banking-stack/pull/12
**Dúvidas**: 
- A abordagem com token bucket está correta?
- Como lidar com race conditions?
```

---

## Fluxo da Sessão

### 1. Abertura (5 min)
- Apresentação dos participantes
- Regras da sessão
- Tema do dia (se houver)

### 2. Review dos PRs (45 min)

Para cada PR:

#### a) Contexto (2 min)
- Autor explica o problema que está resolvendo
- Stack e decisões arquiteturais

#### b) Análise ao Vivo (10 min)
- Mentor navega pelo código
- Comentários em tempo real
- Sugestões práticas

#### c) Discussão (3 min)
- Autor pode fazer perguntas
- Outros participantes contribuem

### 3. Wrap-up (10 min)
- Resumo dos pontos principais
- Lições aprendidas
- Ações para a próxima semana

---

## Feedback Estruturado

### Formato de Review

Para cada ponto de feedback, use esta estrutura:

```
**Tipo**: [Positivo | Sugestão | Pergunta]
**Linha**: `arquivo.go:42`
**Comentário**: Descrição clara do ponto
**Ação**: O que fazer (se aplicável)
```

### Exemplo

```
**Tipo**: Sugestão
**Linha**: `handler/transfer.go:87`
**Comentário**: Esta função está fazendo muita coisa. 
   Extrair validação para uma função separada facilita testes.
**Ação**: Criar `validateTransfer()` e usar aqui
```

---

## Checklist de Review

### Funcionalidade
- [ ] Código resolve o problema proposto?
- [ ] Edge cases foram considerados?
- [ ] Validações de entrada implementadas?

### Qualidade de Código
- [ ] Código é legível e claro?
- [ ] Funções têm responsabilidade única?
- [ ] Nomes são descritivos?
- [ ] Não há code duplication?

### Performance
- [ ] Queries otimizadas?
- [ ] Concorrência tratada corretamente?
- [ ] Memory leaks evitados?

### Segurança
- [ ] Input sanitization?
- [ ] Autenticação/autorização?
- [ ] Secrets não expostos?

### Testes
- [ ] Testes unitários presentes?
- [ ] Cenários principais cobertos?
- [ ] Testes são claros e maintainables?

### Documentação
- [ ] README atualizado?
- [ ] Decisões documentadas?
- [ ] APIs documentadas?

---

## Métricas

### Para o Participante

| Métrica | Como Medir |
|---------|-----------|
| Tempo de implementação | Horas gastas no PR |
| Qualidade percebida | Nota 1-5 do mentor |
| Aprendizado | 3 lições aprendidas |
| Próximos passos | Ações para melhorar |

### Para o Programa

| Métrica | Meta |
|---------|------|
| Participantes por sessão | 8-12 |
| PRs reviewados por sessão | 3-4 |
| Satisfação (pesquisa) | >4.5/5 |
| Retorno de participantes | >70% |

---

## Boas Práticas para o Mentor

### Antes da Sessão
- [ ] Review PRs rapidamente antes do evento
- [ ] Identifique pontos positivos e de melhoria
- [ ] Prepare exemplos de código quando relevante

### Durante a Sessão
- Comece sempre pelo positivo
- Seja específico em sugestões
- Mostre código alternativo quando fizer sentido
- Inclua outros participantes na discussão

### Depois da Sessão
- [ ] Deixe comentários no GitHub
- [ ] Compilação das lições aprendidas
- [ ] Feedback para organizadores

---

## Template de Notas da Sessão

```markdown
# Code Review - [DATA]

## Participantes
- Mentor: [nome]
- Alunos: [lista]

## PRs Reviewados

### PR 1: [título]
- **Autor**: [nome]
- **Link**: [url]
- **Pontos positivos**: 
- **Melhorias**: 
- **Ações**: 

### PR 2: [título]
- **Autor**: [nome]
- **Link**: [url]
- **Pontos positivos**: 
- **Melhorias**: 
- **Ações**: 

## Lições Aprendidas
1. 
2. 
3. 

## Próximo Tema
[Sugestão para próxima sessão]
```

---

## Recursos

- [Guia de Code Review do Google](https://google.github.io/eng-practices/review/)
- Padroes de Codigo do Banking Stack
- Como escrever bons PRs

---

*Última atualização: Janeiro 2026*
