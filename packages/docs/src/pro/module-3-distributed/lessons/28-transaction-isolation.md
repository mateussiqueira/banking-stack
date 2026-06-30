# Aula 28: Transaction Isolation Levels

**Duração:** 50 minutos

## Objetivos
- Entender os níveis de isolamento em transações bancárias
- Implementar controle de concorrência com pessimistic locking
- Utilizar optimistic locking para operações de alto volume
- Escolher o nível de isolamento adequado para cada caso

## Tópicos
1. **Isolation Levels**: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
2. **Pessimistic Locking**: Bloqueio antecipado de recursos
3. **Optimistic Locking**: Verificação de conflitos apenas na gravação
4. **Deadlocks**: Prevenção e detecção

## Caso de uso: Controle de concorrência em transferências
Em sistemas bancários, múltiplas transferências podem ocorrer simultaneamente na mesma conta. Precisamos garantir que o saldo nunca fique negativo.

## Níveis de Isolamento

### 1. READ UNCOMMITTED
- Mais rápido, menos seguro
- Possível leitura suja (dirty reads)
- Adequado para relatórios não críticos

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT balance FROM accounts WHERE id = 123;
```

### 2. READ COMMITTED (Padrão PostgreSQL)
- Previne leitura suja
- Pode causar leitura não repetível
- Bom para maioria das operações

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
SELECT balance FROM accounts WHERE id = 123; -- Lê saldo atual
-- Outra transação pode modificar o saldo aqui
SELECT balance FROM accounts WHERE id = 123; -- Pode retornar valor diferente
COMMIT;
```

### 3. REPEATABLE READ
- Garante leitura repetível
- Previne phantom reads em bancos que suportam
- Adequado para operações que precisam de consistência

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE id = 123; -- Bloqueia para leitura
-- Outra transação pode modificar o saldo, mas não será visível
SELECT balance FROM accounts WHERE id = 123; -- Mesmo valor
COMMIT;
```

### 4. SERIALIZABLE
- Mais seguro, mais lento
- Simula execução serial
- Adequado para operações críticas

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
-- Operações complexas garantidas como serializáveis
COMMIT;
```

## Pessimistic Locking

### 1. Row-level locking
```sql
-- Bloquear linha específica para atualização
BEGIN;
SELECT balance FROM accounts WHERE id = 123 FOR UPDATE;
-- Agora ninguém pode modificar esta conta até COMMIT
UPDATE accounts SET balance = balance - 100 WHERE id = 123;
COMMIT;
```

### 2. Lock com timeout
```sql
-- Evitar espera infinita
BEGIN;
-- Tentar obter lock com timeout de 5 segundos
SELECT * FROM accounts WHERE id = 123 FOR UPDATE SKIP LOCKED;
-- Se não conseguir, retorna em vez de esperar
COMMIT;
```

### 3. Implementação em código
```typescript
async function transferWithPessimisticLock(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Bloquear contas na ordem consistente (evita deadlocks)
    const [first, second] = [fromAccountId, toAccountId].sort();
    
    await client.query(
      'SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE',
      [first]
    );
    
    await client.query(
      'SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE',
      [second]
    );
    
    // Verificar saldo
    const result = await client.query(
      'SELECT balance FROM accounts WHERE id = $1',
      [fromAccountId]
    );
    
    if (result.rows[0].balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // Realizar transferência
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromAccountId]
    );
    
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toAccountId]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Optimistic Locking

### 1. Usando versão
```sql
-- Schema com coluna de versão
CREATE TABLE accounts (
  id VARCHAR(36) PRIMARY KEY,
  balance DECIMAL(10,2),
  version INTEGER DEFAULT 0
);

-- Atualização com verificação de versão
UPDATE accounts 
SET balance = balance - 100, version = version + 1 
WHERE id = 123 AND version = 5;

-- Se retornar 0 linhas afetadas, houve conflito
```

### 2. Implementação em código
```typescript
async function transferWithOptimisticLock(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<void> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ler contas com versão
      const fromResult = await client.query(
        'SELECT id, balance, version FROM accounts WHERE id = $1',
        [fromAccountId]
      );
      
      const toResult = await client.query(
        'SELECT id, balance, version FROM accounts WHERE id = $1',
        [toAccountId]
      );
      
      if (fromResult.rows.length === 0 || toResult.rows.length === 0) {
        throw new Error('Account not found');
      }
      
      const fromAccount = fromResult.rows[0];
      const toAccount = toResult.rows[0];
      
      // Verificar saldo
      if (fromAccount.balance < amount) {
        throw new Error('Insufficient funds');
      }
      
      // Atualizar com verificação de versão
      const fromUpdate = await client.query(
        'UPDATE accounts SET balance = balance - $1, version = version + 1 WHERE id = $2 AND version = $3',
        [amount, fromAccountId, fromAccount.version]
      );
      
      const toUpdate = await client.query(
        'UPDATE accounts SET balance = balance + $1, version = version + 1 WHERE id = $2 AND version = $3',
        [amount, toAccountId, toAccount.version]
      );
      
      if (fromUpdate.rowCount === 0 || toUpdate.rowCount === 0) {
        await client.query('ROLLBACK');
        console.log(`Attempt ${attempt} failed, retrying...`);
        continue; // Retry
      }
      
      await client.query('COMMIT');
      return; // Sucesso
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  throw new Error('Transfer failed after maximum retries');
}
```

## Deadlocks

### 1. O que são deadlocks?
Quando duas transações esperam uma pela outra:
- Transação A bloqueiaConta1, espera Conta2
- Transação B bloqueiaConta2, espera Conta1

### 2. Prevenção
```typescript
// Sempre bloquear na mesma ordem
const accounts = [fromAccountId, toAccountId].sort();
await client.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [accounts[0]]);
await client.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [accounts[1]]);
```

### 3. Detecção e timeout
```typescript
// Configurar deadlock_timeout
await client.query('SET deadlock_timeout = 5s');

// Usar SKIP LOCKED para evitar espera
await client.query(
  'SELECT * FROM accounts WHERE id = $1 FOR UPDATE SKIP LOCKED',
  [accountId]
);
```

## Exercícios

### Exercício 1: Comparar Isolation Levels
1. Execute a mesma operação com cada isolation level
2. Meça performance e consistência
3. Analise quando usar cada um

### Exercício 2: Implementar Pessimistic Locking
1. Crie transferência com FOR UPDATE
2. Teste com múltiplas transações simultâneas
3. Implemente timeout e retry

### Exercício 3: Implementar Optimistic Locking
1. Adicione coluna de versão
2. Implemente retry em caso de conflito
3. Meça throughput vs pessimistic locking

## Próximos passos
- Próxima aula: CockroachDB e distribuição de dados
- Veremos como escalar transações distribuídas

## Material de referência
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Pessimistic vs Optimistic Locking](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
- [Deadlock Prevention](https://en.wikipedia.org/wiki/Deadlock_prevention)