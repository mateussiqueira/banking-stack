use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq)]
pub enum Side {
    Bid,
    Ask,
}

#[derive(Debug, Clone)]
pub struct Order {
    pub id: String,
    pub side: Side,
    pub price: f64,
    pub quantity: f64,
}

#[derive(Debug, Clone)]
pub struct Trade {
    pub id: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub price: f64,
    pub quantity: f64,
}

pub struct OrderBook {
    bids: Vec<Order>,
    asks: Vec<Order>,
    trades: Vec<Trade>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            bids: Vec::new(),
            asks: Vec::new(),
            trades: Vec::new(),
        }
    }

    pub fn add_order(&mut self, order: Order) -> Vec<Trade> {
        let mut trades = Vec::new();

        match order.side {
            Side::Bid => {
                let mut remaining = order.quantity;
                let mut matched_indices = Vec::new();

                for (i, ask) in self.asks.iter().enumerate() {
                    if remaining <= 0.0 || ask.price > order.price {
                        break;
                    }

                    let trade_qty = remaining.min(ask.quantity);
                    let trade = Trade {
                        id: format!("T-{}", self.trades.len() + 1),
                        buy_order_id: order.id.clone(),
                        sell_order_id: ask.id.clone(),
                        price: ask.price,
                        quantity: trade_qty,
                    };

                    trades.push(trade.clone());
                    self.trades.push(trade);
                    remaining -= trade_qty;

                    if (ask.quantity - trade_qty).abs() < f64::EPSILON {
                        matched_indices.push(i);
                    }
                }

                for (i, _) in matched_indices.iter().enumerate() {
                    self.asks.remove(i - matched_indices.iter().take_while(|&&x| x < i).count());
                }

                if remaining > 0.0 {
                    self.bids.push(Order {
                        quantity: remaining,
                        ..order
                    });
                }
            }
            Side::Ask => {
                let mut remaining = order.quantity;
                let mut matched_indices = Vec::new();

                for (i, bid) in self.bids.iter().enumerate() {
                    if remaining <= 0.0 || bid.price < order.price {
                        break;
                    }

                    let trade_qty = remaining.min(bid.quantity);
                    let trade = Trade {
                        id: format!("T-{}", self.trades.len() + 1),
                        buy_order_id: bid.id.clone(),
                        sell_order_id: order.id.clone(),
                        price: bid.price,
                        quantity: trade_qty,
                    };

                    trades.push(trade.clone());
                    self.trades.push(trade);
                    remaining -= trade_qty;

                    if (bid.quantity - trade_qty).abs() < f64::EPSILON {
                        matched_indices.push(i);
                    }
                }

                for (i, _) in matched_indices.iter().enumerate() {
                    self.bids.remove(i - matched_indices.iter().take_while(|&&x| x < i).count());
                }

                if remaining > 0.0 {
                    self.asks.push(Order {
                        quantity: remaining,
                        ..order
                    });
                }
            }
        }

        trades
    }

    pub fn get_best_bid(&self) -> Option<&Order> {
        self.bids.iter().max_by(|a, b| a.price.partial_cmp(&b.price).unwrap())
    }

    pub fn get_best_ask(&self) -> Option<&Order> {
        self.asks.iter().min_by(|a, b| a.price.partial_cmp(&b.price).unwrap())
    }

    pub fn get_spread(&self) -> Option<f64> {
        let bid = self.get_best_bid()?;
        let ask = self.get_best_ask()?;
        Some(ask.price - bid.price)
    }

    pub fn display(&self) {
        println!("\n=== ORDER BOOK ===");
        println!("ASKS (sellers):");
        for ask in self.asks.iter().rev() {
            println!("  {:.2} x {:.2} ({})", ask.price, ask.quantity, ask.id);
        }
        println!("--- SPREAD: {:?} ---", self.get_spread());
        println!("BIDS (buyers):");
        for bid in &self.bids {
            println!("  {:.2} x {:.2} ({})", bid.price, bid.quantity, bid.id);
        }
        println!("Total trades: {}", self.trades.len());
    }
}

#[tokio::main]
async fn main() {
    println!("=== Order Book Engine (Rust) ===\n");

    let order_book = Arc::new(RwLock::new(OrderBook::new()));

    // Simular ordens concorrentes
    let mut handles = vec![];

    for i in 0..5 {
        let ob = order_book.clone();
        handles.push(tokio::spawn(async move {
            let order = Order {
                id: format!("BUY-{}", i),
                side: Side::Bid,
                price: 100.0 + (i as f64 * 0.5),
                quantity: 10.0,
            };
            let mut book = ob.write().await;
            let trades = book.add_order(order);
            println!("Buy {} -> {} trades", i, trades.len());
        }));
    }

    for i in 0..5 {
        let ob = order_book.clone();
        handles.push(tokio::spawn(async move {
            let order = Order {
                id: format!("SELL-{}", i),
                side: Side::Ask,
                price: 99.5 + (i as f64 * 0.5),
                quantity: 10.0,
            };
            let mut book = ob.write().await;
            let trades = book.add_order(order);
            println!("Sell {} -> {} trades", i, trades.len());
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }

    let book = order_book.read().await;
    book.display();

    println!("\n=== Order Book OK! ===");
}
