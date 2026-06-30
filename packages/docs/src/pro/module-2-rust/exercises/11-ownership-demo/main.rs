#[derive(Debug, Clone)]
struct Account {
    id: u64,
    balance: f64,
}

fn main() {
    // Move semantics
    let alice = Account { id: 1, balance: 1000.0 };
    println!("Alice: {:?}", alice);
    let bob = alice; // alice is moved
    // println!("Alice: {:?}", alice); // ERROR: value used after move
    println!("Bob: {:?}", bob);

    // Clone for independent copies
    let carol = Account { id: 2, balance: 500.0 };
    let dave = carol.clone();
    println!("Carol: {:?}, Dave: {:?}", carol, dave);

    // Borrowing
    print_account(&bob);
    print_account(&dave);

    // Mutable borrowing
    let mut eve = Account { id: 3, balance: 200.0 };
    deposit(&mut eve, 150.0);
    println!("Eve after deposit: {:?}", eve);

    // Ownership into function
    let frank = Account { id: 4, balance: 0.0 };
    let frank_id = get_id(frank); // frank moved into function
    // println!("{:?}", frank); // ERROR: value used after move
    println!("Frank's ID: {}", frank_id);
}

fn print_account(acc: &Account) {
    println!("Account {} balance: ${:.2}", acc.id, acc.balance);
}

fn deposit(acc: &mut Account, amount: f64) {
    acc.balance += amount;
}

fn get_id(acc: Account) -> u64 {
    acc.id
}
