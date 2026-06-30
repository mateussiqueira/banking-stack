# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 02: Raft Consensus for Distributed Ledger and Transaction Ordering

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Entender o algoritmo Raft: leader election, log replication, safety
- Aplicar Raft para ordenacao total de transacoes financeiras
- Implementar um mini-ledger com consenso distribuido

### Teoria

Raft e um algoritmo de consenso projetado para ser compreensivel, ao contrario do Paxos. Ele divide o consenso em tres subproblemas: **leader election**, **log replication** e **safety**. Em fintechs, Raft e o coracao de sistemas como CockroachDB, etcd e TigBe — todos usados em infraestrutura bancaria.

**Leader Election:** Um no torna-se leader e gerencia o log replicado. Os seguidores aceitam entradas apenas do leader. Se o leader falha, um novo election ocorre com randomizacao de timeouts. Em sistemas bancarios, o termo do leader e crucial: cada transacao carrega o `term` para detectar leaders depostos que tentam escrever.

**Log Replication:** O leader recebe uma transacao, acrescenta ao seu log local e envia `AppendEntries` para os seguidores. A transacao so e *committed* quando a maioria (quorum) confirma. Isso garante que, mesmo com falha de minoria, a transacao sobrevive.

```go
type RaftLog struct {
    Entries    []TransactionEntry
    Committed  int64
    LastApplied int64
}

type TransactionEntry struct {
    Term    int64
    Index   int64
    Payload Transaction // PIX, TED, compra, etc
}

func (r *RaftNode) ProposeTransaction(tx Transaction) error {
    if r.State != Leader {
        return ErrNotLeader
    }

    entry := TransactionEntry{
        Term:    r.CurrentTerm,
        Index:   r.LastLogIndex + 1,
        Payload: tx,
    }

    r.Log.Entries = append(r.Log.Entries, entry)
    r.LastLogIndex++

    // Replica para seguidores
    acks := 0
    for _, peer := range r.Peers {
        go func(p Peer) {
            if err := p.AppendEntries(r.CurrentTerm, entry); err == nil {
                acks++
            }
        }(peer)
    }

    // Espera quorum
    deadline := time.After(2 * time.Second)
    for acks < len(r.Peers)/2+1 {
        select {
        case <-deadline:
            return ErrConsensusTimeout
        default:
            time.Sleep(10 * time.Millisecond)
        }
    }

    r.Log.Committed = entry.Index
    return nil
}
```

**Ordering guarantees em pagamentos:** A ordem das transacoes e critica. Se dois PIX chegam simultaneamente e o saldo e R$100, a ordem determina qual transacao sera rejeitada por saldo insuficiente. Raft garante *total order*: todos os nos veem a mesma sequencia. O indice do log Raft torna-se o numero sequencial universal da transacao (similar ao NSI no SPI/PIX).

**Compaction e snapshots:** Logs infinitos sao inviaveis. Periodicamente, o sistema tira snapshot do estado (ex: saldos de todas as contas no indice 1.000.000) e descarta entradas anteriores.

### Exercicio

Implemente um Raft simplificado com 3 nos em Go. Cada no deve: (1) iniciar election se nao ouvir heartbeat, (2) replicar `Transaction{ID, From, To, Amount}` via AppendEntries, (3) commitar apenas com quorum de 2/3. Teste: mate o leader apos enviar 5 transacoes e verifique se o novo leader tem os dados.

### Proximo
[03-distributed-transactions.md](03-distributed-transactions.md)
