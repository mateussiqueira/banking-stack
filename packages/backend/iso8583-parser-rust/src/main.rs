use std::fmt;

#[derive(Debug, Clone)]
pub struct ISO8583Message {
    pub mti: String,
    pub bitmap: [u8; 16],
    pub fields: Vec<Option<FieldData>>,
}

#[derive(Debug, Clone)]
pub struct FieldData {
    pub data: Vec<u8>,
}

#[derive(Debug, thiserror::Error)]
pub enum ISO8583Error {
    InvalidMTI(String),
    InvalidBitmap(String),
    InsufficientData { expected: usize, available: usize },
}

impl fmt::Display for ISO8583Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidMTI(mti) => write!(f, "Invalid MTI: {}", mti),
            Self::InvalidBitmap(msg) => write!(f, "Invalid bitmap: {}", msg),
            Self::InsufficientData { expected, available } => {
                write!(f, "Insufficient data: need {} bytes, have {}", expected, available)
            }
        }
    }
}

impl ISO8583Message {
    pub fn new(mti: &str) -> Self {
        Self {
            mti: mti.to_string(),
            bitmap: [0u8; 16],
            fields: vec![None; 128],
        }
    }

    pub fn set_field(&mut self, field_num: usize, data: &[u8]) {
        if field_num >= 1 && field_num <= 128 {
            let idx = field_num - 1;
            self.fields[idx] = Some(FieldData {
                data: data.to_vec(),
            });
            self.bitmap[idx / 8] |= 1 << (7 - (idx % 8));
        }
    }

    pub fn get_field(&self, field_num: usize) -> Option<&[u8]> {
        if field_num >= 1 && field_num <= 128 {
            let idx = field_num - 1;
            self.fields[idx].as_ref().map(|f| f.data.as_slice())
        } else {
            None
        }
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut result = Vec::new();
        result.extend_from_slice(self.mti.as_bytes());
        result.extend_from_slice(&self.bitmap);

        for field in &self.fields {
            if let Some(f) = field {
                result.extend_from_slice(&(f.data.len() as u16).to_be_bytes());
                result.extend_from_slice(&f.data);
            }
        }

        result
    }

    pub fn from_bytes(data: &[u8]) -> Result<Self, ISO8583Error> {
        if data.len() < 20 {
            return Err(ISO8583Error::InsufficientData {
                expected: 20,
                available: data.len(),
            });
        }

        let mti = String::from_utf8_lossy(&data[0..4]).to_string();
        let mut bitmap = [0u8; 16];
        bitmap.copy_from_slice(&data[4..20]);

        let mut msg = Self::new(&mti);
        msg.bitmap = bitmap;

        let mut offset = 20;
        for i in 0..128 {
            if bitmap[i / 8] & (1 << (7 - (i % 8))) != 0 {
                if offset + 2 > data.len() {
                    break;
                }
                let len = u16::from_be_bytes([data[offset], data[offset + 1]]) as usize;
                offset += 2;

                if offset + len > data.len() {
                    break;
                }

                msg.fields[i] = Some(FieldData {
                    data: data[offset..offset + len].to_vec(),
                });
                offset += len;
            }
        }

        Ok(msg)
    }
}

impl fmt::Display for ISO8583Message {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "ISO 8583 Message")?;
        writeln!(f, "MTI: {}", self.mti)?;
        writeln!(f, "Bitmap: {:02X?}", self.bitmap)?;
        for (i, field) in self.fields.iter().enumerate() {
            if let Some(f) = field {
                writeln!(f, "Field {}: {:?}", i + 1, String::from_utf8_lossy(&f.data))?;
            }
        }
        Ok(())
    }
}

fn main() {
    println!("=== ISO 8583 Parser (Rust) ===\n");

    let mut msg = ISO8583Message::new("0100");

    msg.set_field(2, b"4761739001010119");
    msg.set_field(3, b"000000");
    msg.set_field(4, b"000000010000");
    msg.set_field(7, b"0630123456");
    msg.set_field(11, b"000001");
    msg.set_field(12, b"123456");
    msg.set_field(13, b"0630");
    msg.set_field(37, b"000000000001");
    msg.set_field(41, b"TERM0001");
    msg.set_field(42, b"BANK0000000001");
    msg.set_field(43, b"Banco Example");
    msg.set_field(49, b"840");

    println!("Original message:");
    println!("{}", msg);

    let bytes = msg.to_bytes();
    println!("Serialized: {} bytes", bytes.len());

    let parsed = ISO8583Message::from_bytes(&bytes).unwrap();
    println!("\nParsed message:");
    println!("{}", parsed);

    println!("=== Parser OK! ===");
}
