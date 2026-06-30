use std::fmt;

#[derive(Debug)]
enum TransactionError {
    InsufficientFunds { available: f64, requested: f64 },
    InvalidAccount(u64),
    NetworkTimeout,
}

impl fmt::Display for TransactionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TransactionError::InsufficientFunds { available, requested } => {
                write!(f, "Insufficient funds: have ${:.2}, need ${:.2}", available, requested)
            }
            TransactionError::InvalidAccount(id) => write!(f, "Invalid account: {}", id),
            TransactionError::NetworkTimeout => write!(f, "Network timeout"),
        }
    }
}

struct Account {
    id: u64,
    balance: f64,
}

impl Account {
    fn new(id: u64, balance: f64) -> Self {
        Self { id, balance }
    }

    fn transfer(&mut self, to: &mut Self, amount: f64) -> Result<(), TransactionError> {
        if self.balance < amount {
            return Err(TransactionError::InsufficientFunds {
                available: self.balance,
                requested: amount,
            });
        }
        self.balance -= amount;
        to.balance += amount;
        Ok(())
    }
}

fn process_payment(amount: f64) -> Result<String, TransactionError> {
    if amount <= 0.0 {
        return Err(TransactionError::InvalidAccount(0));
    }
    Ok(format!("Payment of ${:.2} processed", amount))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut alice = Account::new(1, 500.0);
    let mut bob = Account::new(2, 200.0);

    // Successful transfer
    match alice.transfer(&mut bob, 150.0) {
        Ok(()) => println!("Transfer succeeded"),
        Err(e) => println!("Transfer failed: {}", e),
    }

    // Failed transfer - insufficient funds
    match alice.transfer(&mut bob, 1000.0) {
        Ok(()) => println!("Transfer succeeded"),
        Err(e) => println!("Transfer failed: {}", e),
    }

    // ? operator usage
    let result = process_payment(99.99)?;
    println!("{}", result);

    println!("Alice: ${:.2}, Bob: ${:.2}", alice.balance, bob.balance);
    Ok(())
}
