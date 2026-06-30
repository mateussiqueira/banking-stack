package graphql

import (
	"github.com/mateussiqueira/banking-stack/ledger-go/internal/models"
	"github.com/graphql-go/graphql"
)

func NewSchema(store *models.Store) (graphql.Schema, error) {
	// Types
	accountType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Account",
		Fields: graphql.Fields{
			"id":        &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"name":      &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"document":  &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"balance":   &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
			"version":   &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
			"createdAt": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"updatedAt": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	transactionType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Transaction",
		Fields: graphql.Fields{
			"id":                &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"senderAccountId":   &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"receiverAccountId": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"amount":            &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
			"description":       &graphql.Field{Type: graphql.String},
			"type":              &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"status":            &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"idempotencyKey":    &graphql.Field{Type: graphql.String},
			"createdAt":         &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	// Queries
	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"accounts": &graphql.Field{
				Type: graphql.NewList(accountType),
				Args: graphql.FieldConfigArgument{
					"page":  &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 1},
					"limit": &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					page := p.Args["page"].(int)
					limit := p.Args["limit"].(int)
					accounts, _ := store.ListAccounts(page, limit)
					return accounts, nil
				},
			},
			"account": &graphql.Field{
				Type: accountType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					id := p.Args["id"].(string)
					acc, ok := store.GetAccount(id)
					if !ok {
						return nil, nil
					}
					return acc, nil
				},
			},
			"transactions": &graphql.Field{
				Type: graphql.NewList(transactionType),
				Args: graphql.FieldConfigArgument{
					"page":      &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 1},
					"limit":     &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
					"accountId": &graphql.ArgumentConfig{Type: graphql.String},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					page := p.Args["page"].(int)
					limit := p.Args["limit"].(int)
					accountID := ""
					if v, ok := p.Args["accountId"].(string); ok {
						accountID = v
					}
					transactions, _ := store.ListTransactions(page, limit, accountID)
					return transactions, nil
				},
			},
			"transaction": &graphql.Field{
				Type: transactionType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					id := p.Args["id"].(string)
					tx, ok := store.GetTransaction(id)
					if !ok {
						return nil, nil
					}
					return tx, nil
				},
			},
		},
	})

	// Mutations
	mutationType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"createAccount": &graphql.Field{
				Type: accountType,
				Args: graphql.FieldConfigArgument{
					"name":           &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"document":       &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"initialBalance": &graphql.ArgumentConfig{Type: graphql.Float, DefaultValue: 0.0},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					name := p.Args["name"].(string)
					document := p.Args["document"].(string)
					balance := p.Args["initialBalance"].(float64)
					return store.CreateAccount(name, document, balance)
				},
			},
			"createTransaction": &graphql.Field{
				Type: transactionType,
				Args: graphql.FieldConfigArgument{
					"senderAccountId":   &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"receiverAccountId": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"amount":            &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.Float)},
					"description":       &graphql.ArgumentConfig{Type: graphql.String, DefaultValue: ""},
					"type":              &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"idempotencyKey":    &graphql.ArgumentConfig{Type: graphql.String},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					senderID := p.Args["senderAccountId"].(string)
					receiverID := p.Args["receiverAccountId"].(string)
					amount := p.Args["amount"].(float64)
					description := p.Args["description"].(string)
					txType := models.TransactionType(p.Args["type"].(string))
					idempotencyKey := ""
					if v, ok := p.Args["idempotencyKey"].(string); ok {
						idempotencyKey = v
					}
					return store.CreateTransaction(senderID, receiverID, amount, description, txType, idempotencyKey)
				},
			},
		},
	})

	return graphql.NewSchema(graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	})
}
