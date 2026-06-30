#[derive(Debug, Clone)]
struct Transaction {
    id: u64,
    merchant: String,
    amount: f64,
    is_debit: bool,
}

struct TransactionList {
    transactions: Vec<Transaction>,
}

impl TransactionList {
    fn new(transactions: Vec<Transaction>) -> Self {
        Self { transactions }
    }

    fn iter(&self) -> impl Iterator<Item = &Transaction> {
        self.transactions.iter()
    }
}

impl IntoIterator for TransactionList {
    type Item = Transaction;
    type IntoIter = std::vec::IntoIter<Transaction>;

    fn into_iter(self) -> Self::IntoIter {
        self.transactions.into_iter()
    }
}

impl<'a> IntoIterator for &'a TransactionList {
    type Item = &'a Transaction;
    type IntoIter = std::slice::Iter<'a, Transaction>;

    fn into_iter(self) -> Self::IntoIter {
        self.transactions.iter()
    }
}

fn main() {
    let txns = TransactionList::new(vec![
        Transaction { id: 1, merchant: "Coffee Shop".into(), amount: 5.50, is_debit: true },
        Transaction { id: 2, merchant: "Employer".into(), amount: 3000.00, is_debit: false },
        Transaction { id: 3, merchant: "Grocery".into(), amount: 150.00, is_debit: true },
        Transaction { id: 4, merchant: "Freelance".into(), amount: 800.00, is_debit: false },
        Transaction { id: 5, merchant: "Gas Station".into(), amount: 45.00, is_debit: true },
    ]);

    // For loop with iterator
    println!("--- All Transactions ---");
    for tx in &txns {
        let kind = if tx.is_debit { "DEBIT" } else { "CREDIT" };
        println!("#{} [{}] {}: ${:.2}", tx.id, kind, tx.merchant, tx.amount);
    }

    // Filter: only debits
    let debits: Vec<&Transaction> = txns.iter().filter(|tx| tx.is_debit).collect();
    let total_debits: f64 = debits.iter().map(|tx| tx.amount).sum();
    println!("\nTotal debits: ${:.2}", total_debits);

    // Filter: only credits
    let credits: Vec<&Transaction> = txns.iter().filter(|tx| !tx.is_debit).collect();
    let total_credits: f64 = credits.iter().map(|tx| tx.amount).sum();
    println!("Total credits: ${:.2}", total_credits);

    // Map: merchant names
    let merchant_names: Vec<&str> = txns.iter().map(|tx| tx.merchant.as_str()).collect();
    println!("\nMerchants: {:?}", merchant_names);

    // Compose: sum of all debit transactions over $20
    let large_debits: f64 = txns.iter()
        .filter(|tx| tx.is_debit && tx.amount > 20.0)
        .map(|tx| tx.amount)
        .sum();
    println!("Large debits (>$20): ${:.2}", large_debits);

    // Any credit over $1000?
    let has_large_credit = txns.iter().any(|tx| !tx.is_debit && tx.amount > 1000.0);
    println!("\nHas large credit (>$1000): {}", has_large_credit);
}
