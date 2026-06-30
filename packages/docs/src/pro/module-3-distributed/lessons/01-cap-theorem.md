# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 01: CAP Theorem Applied to Banking

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Compreender o CAP theorem (Consistency, Availability, Partition Tolerance)
- Analisar tradeoffs entre CP e AP em sistemas financeiros
- Projetar sistemas bancarios com garantias apropriadas para cada subsistema

### Teoria

O CAP theorem, formulado por Eric Brewer em 2000, afirma que um sistema distribuido so pode garantir duas das tres propriedades simultaneamente: Consistency (todos os nos veem os mesmos dados ao mesmo tempo), Availability (toda requisicao recebe resposta) e Partition Tolerance (o sistema continua operando apesar de falhas de rede).

Em fintechs, partitions sao inevitaveis — links entre datacenters caem, cloud providers tem outages regionais. Portanto, P nao e negociável. A escolha real e entre C e A durante uma particao.

**Consistencia Forte (CP):** O saldo deve refletir exatamente a realidade. Se um PIX e debitado, o saldo precisa mostrar o debito antes de permitir outra operacao. Bancos centrais exigem isso para reservas bancarias e liquidacao bruta em tempo real (LBTR). Um sistema CP sacrifica disponibilidade durante particoes: se o no primario perder conexao, as transacoes bloqueiam ate a reconciliacao.

```go
// Exemplo: operacao CP com quorum write
func DebitWithQuorum(ctx context.Context, accountID string, amount int64) error {
    nodes := []string{"node-1", "node-2", "node-3"}
    quorum := (len(nodes) / 2) + 1

    success := 0
    for _, node := range nodes {
        if err := writeToNode(node, accountID, amount); err == nil {
            success++
        }
    }

    if success < quorum {
        return ErrInsufficientQuorum // rollback, nao prossegue
    }
    return nil
}
```

**Disponibilidade (AP):** Extratos e consultas de historico toleram dados ligeiramente desatualizados. Nao ha risco financeiro em mostrar um saldo de 5 segundos atras. Sistemas AP usam eventual consistency com versionamento:

```typescript
// Eventual consistency com version vector
interface BalanceEvent {
  accountId: string;
  version: number;
  balance: number;
  timestamp: number;
}

async function reconcileBalance(
  local: BalanceEvent,
  remote: BalanceEvent
): Promise<BalanceEvent> {
  return remote.version > local.version ? remote : local;
}
```

**Particionamento pragmatico em bancos:**
- **Core ledger (CP):** CockroachDB ou Spanner com transacoes distribuidas
- **Extrato/historico (AP):** Cassandra ou DynamoDB com eventual consistency
- **Anti-fraude (CP):** Precisa de visao consistente para detectar double-spending
- **Notificacoes push (AP):** Eventual consistency aceitavel

O Banco Central do Brasil adota o conceito de *dual balance*: o saldo disponivel e fortemente consistente, enquanto projecoes (como "gastos por categoria") sao eventualmente consistentes.

### Exercicio

Modele o sistema de PIX com dois subsistemas: (1) o motor de liquidacao que move dinheiro entre contas e (2) o feed de notificacoes que avisa usuarios. Para cada um, justifique se deve ser CP ou AP. Implemente em pseudo-Go uma funcao `transferPIX()` que decide o quorum baseado no valor da transacao — 1-no para valores abaixo de R$200, quorum majority para valores acima.

### Proximo
[02-consensus-raft.md](02-consensus-raft.md)
