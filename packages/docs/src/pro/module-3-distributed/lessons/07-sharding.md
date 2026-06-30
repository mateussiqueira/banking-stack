# Modulo 3 — Sistemas Distribuidos para Fintechs
## Aula 07: Database Sharding Strategies for High-Volume Transaction Systems

**Duracao:** 45 min  
**Nivel:** Avancado

### Objetivos
- Dominar estrategias de sharding: range-based, hash-based, directory-based
- Projetar sharding para sistemas de pagamento com milhoes de TPS
- Lidar com cross-shard queries e rebalancing

### Teoria

Sharding e a particao horizontal de dados entre multiplos bancos. Um unico PostgreSQL pode suportar ~10k transacoes por segundo — insuficiente para um sistema como o PIX (200M+ transacoes/dia, ~2.3k TPS medio, picos muito maiores). Sharding distribui carga e armazenamento entre dezenas ou centenas de instancias.

**Range-Based Sharding:** Dados sao distribuidos por faixas de ID. Ex: shard 0 = contas 000000-333333, shard 1 = 333334-666666, shard 2 = 666667-999999. Simples de implementar, mas causa hotspots — contas novas sempre caem no ultimo shard.

**Hash-Based Sharding:** Aplica funcao hash consistente sobre a chave de particao (ex: `account_id`). Distribuicao uniforme, sem hotspots, porem cross-shard queries (ex: relatorio de todas as transacoes do dia) tornam-se scatter-gather complexas.

```go
type ShardRouter struct {
    shards     []*sql.DB
    hashRing   *consistent.Consistent // consistent hashing ring
}

func (r *ShardRouter) GetShard(accountID string) *sql.DB {
    shardName, _ := r.hashRing.Get(accountID)
    // shardName mapeia para conexao
    return r.shards[shardIdx[shardName]]
}

func (r *ShardRouter) TransferMoney(from, to string, amount int64) error {
    fromShard := r.GetShard(from)
    toShard := r.GetShard(to)

    if fromShard == toShard {
        // Single shard — transacao local, ACID completo
        tx, _ := fromShard.Begin()
        fromShard.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
        fromShard.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
        return tx.Commit()
    }

    // Cross-shard — precisa de two-phase commit ou saga
    return r.executeCrossShardTransfer(from, to, amount)
}
```

**Cross-Shard Transacoes:** O maior desafio do sharding. Transferencias entre contas em shards diferentes perdem a garantia ACID local. Solucoes:
- **Two-Phase Commit (2PC):** Sobre os dois shards, com coordenador externo
- **Saga distribuida:** Debitar no shard A, creditar no shard B, com compensacao
- **Replicacao inteligente:** Manter conta origem e destino no mesmo shard (ex: ambas no shard do banco)

**Directory-Based Sharding:** Um servico separado mapeia chave → shard. Flexivel para rebalancing — move-se a conta entre shards atualizando o diretorio. O DICT do PIX funciona parcialmente assim: consulta o diretorio para descobrir em qual instituicao (shard logico) a conta destino reside.

**Consistent Hashing e Rebalancing:** Adicionar ou remover shards com hash consistente minimiza redistribuicao — apenas ~1/N dos dados migram. Ferramentas como Vitess (usado no YouTube, GitHub) e Citus implementam sharding transparente para PostgreSQL.

### Exercicio

Projete um sistema de sharding para 10 milhoes de contas com 3 shards PostgreSQL. Implemente a funcao `RouteTransaction(tx)` que: (1) escolhe shard via `hash(account_id) % 3`, (2) se origem e destino estao no mesmo shard, executa transacao ACID, (3) se cross-shard, loga evento `CROSS_SHARD_TX` no outbox para processamento assincrono. Simule 1000 transferencias aleatorias e meca percentual de cross-shard.

### Proximo
[08-caching.md](08-caching.md)
