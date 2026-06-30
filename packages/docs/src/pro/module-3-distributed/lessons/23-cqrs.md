# Aula 23: CQRS — Separando leitura e escrita

**Duração:** 55 minutos

## Objetivos
- Entender o padrão CQRS (Command Query Responsibility Segregation)
- Separar modelos de leitura e escrita
- Implementar consistência eventual entre write e read models
- Aplicar CQRS em sistemas financeiros

## Tópicos
1. **Command vs Query**: Separação de responsabilidades
2. **Read Models**: Modelos otimizados para consultas
3. **Write Models**: Modelos otimizados para operações de escrita
4. **Eventual Consistency**: Consistência entre modelos

## Caso de uso financeiro: Separar leitura de saldo de escrita de transações
Em sistemas bancários, as operações de leitura (consultar saldo) e escrita (realizar transferência) têm requisitos muito diferentes. CQRS permite otimizar cada lado separadamente.

## Fundamentos do CQRS

### O que é CQRS?
CQRS separa os modelos de comando (escrita) e consulta (leitura):
- **Command Model**: Otimizado para validação e processamento de transações
- **Query Model**: Otimizado para consultas rápidas e relatórios

### Por que separar?
- **Performance**: Reads podem ser cacheados, writes precisam de transações
- **Escalabilidade**: Read e write podem escalar independentemente
- **Flexibilidade**: Schemas diferentes para cada operação

## Implementação com Event Sourcing

### 1. Write Model (Command Side)
```typescript
// Comandos
interface Command {
  type: string;
  payload: any;
}

// Handler de comandos
class AccountCommandHandler {
  constructor(private eventStore: EventStore) {}

  handleDeposit(command: Command): void {
    // Validações
    if (command.payload.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Cria evento
    const event: Event = {
      id: generateId(),
      type: 'Deposit',
      timestamp: new Date(),
      data: command.payload
    };

    // Persiste evento
    this.eventStore.append(event);
  }

  handleWithdrawal(command: Command): void {
    // Verifica saldo
    const balance = this.eventStore.getAccountState(command.payload.accountId);
    if (balance < command.payload.amount) {
      throw new Error('Insufficient funds');
    }

    const event: Event = {
      id: generateId(),
      type: 'Withdrawal',
      timestamp: new Date(),
      data: command.payload
    };

    this.eventStore.append(event);
  }
}
```

### 2. Read Model (Query Side)
```typescript
// Projeção para consulta de saldo
class BalanceProjection {
  private balances: Map<string, number> = new Map();

  // Processa eventos para atualizar projeção
  handleEvent(event: Event): void {
    const accountId = event.data.accountId;
    const currentBalance = this.balances.get(accountId) || 0;

    switch (event.type) {
      case 'Deposit':
        this.balances.set(accountId, currentBalance + event.data.amount);
        break;
      case 'Withdrawal':
        this.balances.set(accountId, currentBalance - event.data.amount);
        break;
    }
  }

  getBalance(accountId: string): number {
    return this.balances.get(accountId) || 0;
  }
}

// Projeção para relatório de transações
class TransactionReportProjection {
  private transactions: Map<string, any[]> = new Map();

  handleEvent(event: Event): void {
    if (['Deposit', 'Withdrawal'].includes(event.type)) {
      const accountId = event.data.accountId;
      const transactions = this.transactions.get(accountId) || [];
      transactions.push({
        date: event.timestamp,
        type: event.type,
        amount: event.data.amount
      });
      this.transactions.set(accountId, transactions);
    }
  }

  getTransactions(accountId: string, startDate: Date, endDate: Date): any[] {
    const transactions = this.transactions.get(accountId) || [];
    return transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
  }
}
```

### 3. Sincronização entre modelos
```typescript
// Serviço de projeção que sincroniza read models
class ProjectionService {
  private projections: Projection[] = [];

  constructor(private eventStore: EventStore) {
    // Registra projeções
    this.projections.push(new BalanceProjection());
    this.projections.push(new TransactionReportProjection());
  }

  // Processa novos eventos
  processNewEvents(): void {
    const newEvents = this.eventStore.getNewEvents();
    newEvents.forEach(event => {
      this.projections.forEach(projection => projection.handleEvent(event));
    });
  }
}
```

## Consistência Eventual

### O problema da consistência
Com CQRS, os read models podem estar temporariamente desatualizados:
1. Usuário faz um depósito (command)
2. Evento é persistido
3. Read model ainda não processou o evento
4. Consulta retorna saldo antigo

### Soluções
1. **Polling**: Read model periodicamente busca novos eventos
2. **Event Handlers**: Read models escutam eventos via message broker
3. **Read-your-writes**: Após command, retorna dados do write model temporariamente

## Caso prático: Transferência entre contas

### 1. Command de transferência
```typescript
interface TransferCommand {
  type: 'Transfer';
  payload: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
  };
}

class TransferCommandHandler {
  handle(command: TransferCommand): void {
    // Cria eventos de débito e crédito
    const debitEvent: Event = {
      id: generateId(),
      type: 'Withdrawal',
      timestamp: new Date(),
      data: { accountId: command.payload.fromAccountId, amount: command.payload.amount }
    };

    const creditEvent: Event = {
      id: generateId(),
      type: 'Deposit',
      timestamp: new Date(),
      data: { accountId: command.payload.toAccountId, amount: command.payload.amount }
    };

    // Persiste eventos atomicamente
    this.eventStore.appendBatch([debitEvent, creditEvent]);
  }
}
```

### 2. Consulta de saldo atualizado
```typescript
// Após transferência, usuário consulta saldo
const balance = balanceProjection.getBalance('123');
// Pode estar desatualizado por alguns milissegundos
```

## Exercícios

### Exercício 1: Implementar CQRS básico
Crie uma aplicação com:
- Write model para processar depósitos e saques
- Read model para consultar saldos
- Sincronização entre modelos

### Exercício 2: Tratar consistência eventual
Implemente mecanismo para que, após um command, a consulta retorne o estado mais recente (read-your-writes).

### Exercício 3: Criar projeção para relatório
Crie uma projeção que gere relatório mensal de transações com gráficos.

## Próximos passos
- Na próxima aula, implementaremos com EventStoreDB e Kafka
- Veremos como escalar read e write models separadamente

## Material de referência
- [CQRS by Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Axon Framework Documentation](https://docs.axoniq.io/)