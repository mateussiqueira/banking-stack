trait PaymentProcessor {
    fn authorize(&self, amount: f64) -> Result<String, String>;
    fn process(&self, amount: f64) -> Result<String, String>;
    fn name(&self) -> &str;
}

struct CreditCard {
    card_number: String,
}

impl PaymentProcessor for CreditCard {
    fn authorize(&self, amount: f64) -> Result<String, String> {
        if amount > 10000.0 {
            return Err("Credit card limit exceeded".to_string());
        }
        println!("Authorizing credit card {} for ${:.2}", self.card_number, amount);
        Ok("authorized".to_string())
    }

    fn process(&self, amount: f64) -> Result<String, String> {
        self.authorize(amount)?;
        println!("Processing credit card payment: ${:.2}", amount);
        Ok(format!("Credit card payment ${:.2} completed", amount))
    }

    fn name(&self) -> &str {
        "CreditCard"
    }
}

struct BankTransfer {
    routing_number: String,
    account_number: String,
}

impl PaymentProcessor for BankTransfer {
    fn authorize(&self, amount: f64) -> Result<String, String> {
        if amount > 50000.0 {
            return Err("Bank transfer limit exceeded".to_string());
        }
        Ok("authorized".to_string())
    }

    fn process(&self, amount: f64) -> Result<String, String> {
        self.authorize(amount)?;
        println!("Processing bank transfer from {}: ${:.2}", self.account_number, amount);
        Ok(format!("Bank transfer ${:.2} completed", amount))
    }

    fn name(&self) -> &str {
        "BankTransfer"
    }
}

fn execute_payment<T: PaymentProcessor>(processor: &T, amount: f64) -> Result<String, String> {
    println!("--- Using {} processor ---", processor.name());
    processor.process(amount)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let visa = CreditCard { card_number: "4111-1111-1111-1111".to_string() };
    let wire = BankTransfer { routing_number: "021000021".to_string(), account_number: "123456789".to_string() };

    let r1 = execute_payment(&visa, 99.99)?;
    println!("{}", r1);

    let r2 = execute_payment(&wire, 5000.00)?;
    println!("{}", r2);

    match execute_payment(&visa, 50000.0) {
        Ok(msg) => println!("{}", msg),
        Err(e) => println!("Failed: {}", e),
    }

    Ok(())
}
