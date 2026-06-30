use std::collections::HashMap;

#[derive(Debug)]
struct Iso8583Message {
    mti: String,
    bitmap: [u8; 8],
    fields: HashMap<u32, Vec<u8>>,
}

impl Iso8583Message {
    fn parse(data: &[u8]) -> Result<Self, String> {
        if data.len() < 16 {
            return Err("Message too short".to_string());
        }

        let mti = String::from_utf8_lossy(&data[0..4]).to_string();
        let mut bitmap = [0u8; 8];
        bitmap.copy_from_slice(&data[4..12]);

        let mut fields = HashMap::new();
        let mut pos = 12;

        for i in 0..64u32 {
            let byte_idx = (i / 8) as usize;
            let bit_idx = 7 - (i % 8);
            if bitmap[byte_idx] & (1 << bit_idx) != 0 {
                let field_num = i + 1;
                let (value, consumed) = parse_field(data, pos)?;
                fields.insert(field_num, value);
                pos += consumed;
            }
        }

        Ok(Self { mti, bitmap, fields })
    }

    fn get_field(&self, num: u32) -> Option<&[u8]> {
        self.fields.get(&num).map(|v| v.as_slice())
    }

    fn bitmap_hex(&self) -> String {
        self.bitmap.iter().map(|b| format!("{:02X}", b)).collect()
    }
}

fn parse_field(data: &[u8], start: usize) -> Result<(Vec<u8>, usize), String> {
    if start >= data.len() {
        return Err("Unexpected end of message".to_string());
    }

    // Variable length fields (LLVAR): first 2 bytes = length
    let len_str = String::from_utf8_lossy(&data[start..start + 2]).to_string();
    let len: usize = len_str.parse().map_err(|_| "Invalid length".to_string())?;
    let value = data[start + 2..start + 2 + len].to_vec();
    Ok((value, 2 + len))
}

#[allow(dead_code)]
fn hex_to_bytes(hex: &str) -> Vec<u8> {
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
        .collect()
}

fn main() {
    // Build a sample ISO 8583 message:
    // MTI: 0100, bitmap with fields 2, 3, 4
    let mut bitmap = [0u8; 8];
    bitmap[0] = 0x40; // bit 2 set
    bitmap[0] |= 0x20; // bit 3 set
    bitmap[0] |= 0x10; // bit 4 set

    let mut msg = Vec::new();
    msg.extend_from_slice(b"0100");
    msg.extend_from_slice(&bitmap);

    // Field 2 (PAN): length 16, value "4111111111111111"
    msg.extend_from_slice(b"16");
    msg.extend_from_slice(b"4111111111111111");
    // Field 3 (Processing Code): length 6, value "000000"
    msg.extend_from_slice(b"06");
    msg.extend_from_slice(b"000000");
    // Field 4 (Amount): length 12, value "000000010000"
    msg.extend_from_slice(b"12");
    msg.extend_from_slice(b"000000010000");

    let parsed = Iso8583Message::parse(&msg).expect("parse failed");

    println!("MTI: {}", parsed.mti);
    println!("Bitmap: {}", parsed.bitmap_hex());
    println!("Fields present: {:?}", parsed.fields.keys().collect::<Vec<_>>());
    println!("Field 2 (PAN): {}", String::from_utf8_lossy(parsed.get_field(2).unwrap()));
    println!("Field 3 (Proc Code): {}", String::from_utf8_lossy(parsed.get_field(3).unwrap()));
    println!("Field 4 (Amount): {}", String::from_utf8_lossy(parsed.get_field(4).unwrap()));
}
