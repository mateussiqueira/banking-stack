# Aula 22: Event Sourcing — Logs imutáveis vs State-based

**Duração:** 60 minutos

## Objetivos
- Compreender a diferença entre armazenamento baseado em estado e Event Sourcing
- Implementar um Event Store simples
- Criar projeções a partir de eventos
- Utilizar Event Sourcing para auditoria em sistemas financeiros

## Tópicos
1. **Event Store**: Armazenamento imutável de eventos
2. **State Projections**: Como reconstruir estado a partir de eventos
3. **Event Replay**: Reexecutar eventos para auditoria e correção de bugs
4. **Audit Trail**: Trilha de auditoria completa e imutável

## Caso de uso financeiro: Ledger com eventos imutáveis
Em sistemas bancários, cada transação deve ser registrada de forma imutável para garantir rastreabilidade e conformidade regulatória. Event Sourcing fornece um log completo de todas as mudanças de estado.

## Conceitos fundamentais

### State-based vs Event Sourcing
- **State-based**: Armazena apenas o estado atual (ex: saldo = 1000)
- **Event Sourcing**: Armazena todos os eventos que levaram ao estado atual (ex: [Depósito 500, Saque 100, Depósito 600])

### Vantagens do Event Sourcing
- Histórico completo de mudanças
- Capacidade de reconstruir estado em qualquer ponto no tempo
- Audit trail imutável
- Facilidade para debugging e auditoria

## Implementação básica

### 1. Definindo eventos
```typescript
interface Event {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
}

// Exemplo de eventos bancários
const events: Event[] = [
  { id: '1', type: 'AccountCreated', timestamp: new Date(), data: { accountId: '123', initialBalance: 0 } },
  { id: '2', type: 'Deposit', timestamp: new Date(), data: { amount: 1000 } },
  { id: '3', type: 'Withdrawal', timestamp: new Date(), data: { amount: 200 } }
];
```

### 2. Event Store simples
```typescript
class EventStore {
  private events: Event[] = [];

  append(event: Event): void {
    this.events.push(event);
  }

  getEvents(accountId: string): Event[] {
    return this.events.filter(e => e.data.accountId === accountId);
  }

  // Projeção para obter estado atual
  getAccountState(accountId: string): number {
    const events = this.getEvents(accountId);
    return events.reduce((balance, event) => {
      if (event.type === 'Deposit') return balance + event.data.amount;
      if (event.type === 'Withdrawal') return balance - event.data.amount;
      return balance;
    }, 0);
  }
}
```

### 3. Projeções e queries
```typescript
// Projeção para relatório de transações
function getTransactionReport(events: Event[]): any[] {
  return events
    .filter(e => ['Deposit', 'Withdrawal'].includes(e.type))
    .map(e => ({
      date: e.timestamp,
      type: e.type,
      amount: e.data.amount,
      balance: calculateBalanceAtTime(events, e.timestamp)
    }));
}

function calculateBalanceAtTime(events: Event[], timestamp: Date): number {
  return events
    .filter(e => e.timestamp <= timestamp)
    .reduce((balance, event) => {
      if (event.type === 'Deposit') return balance + event.data.amount;
      if (event.type === 'Withdrawal') return balance - event.data.amount;
      return balance;
    }, 0);
}
```

## Exercícios

### Exercício 1: Implementar Event Store básico
Crie uma classe EventStore que suporte:
- Armazenar eventos
- Recuperar eventos por ID de conta
- Reconstruir saldo atual

### Exercício 2: Criar projeção para relatório
Implemente uma função que gere um relatório mensal de transações com saldo acumulado.

### Exercício 3: Event replay para correção de bug
Simule um bug no cálculo de saldo e use event replay para corrigir e recalcular todos os saldos.

## Próximos passos
- Na próxima aula, veremos como separar leitura e escrita com CQRS
- Discutiremos trade-offs e quando usar Event Sourcing

## Material de referência
- [Event Sourcing by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [EventStoreDB Documentation](https://developers.eventstore.com/)