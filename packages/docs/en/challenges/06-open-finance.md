# Challenge 06 — Open Finance Simulator

**🇧🇷** Simulador Open Finance Brasil  
**🇬🇧** Open Finance Brasil Simulator

---

In Open Finance, a bank can share your data with another bank — with your authorization. Sounds simple, but behind it there's OAuth 2.0 FAPI, explicit consent, digital certificates, and a 300-page spec.

The problem is that each institution implements it their own way. Testing integration with 20 different banks is a nightmare. This simulator solves that: you run it locally, test the full consent and data flow, without needing a real bank.

---

## Architecture

```mermaid
sequenceDiagram
    participant User
    participant Consumer
    participant Simulator
    participant Directory

    User->>Consumer: Wants to share data
    Consumer->>Directory: Discovers resource server
    Directory-->>Consumer: Simulator URL
    Consumer->>User: Redirects to authorize
    User->>Simulator: Authorizes consent
    Simulator-->>Consumer: Authorization code
    Consumer->>Simulator: Exchanges for token
    Simulator-->>Consumer: Access token
    Consumer->>Simulator: Requests data
    Simulator-->>Consumer: Accounts, transactions
```

---

## TypeScript Implementation

### OAuth 2.0 FAPI Flow

```typescript
import jwt from 'jsonwebtoken';

// 1. Authorization request
app.post('/auth/authorize', async (req, reply) => {
  const { client_id, redirect_uri, scope, code_challenge } = req.body;
  
  const authCode = crypto.randomUUID();
  
  // Saves code with challenge for later verification
  await redis.set(`auth:${authCode}`, JSON.stringify({
    client_id, redirect_uri, scope, code_challenge,
    expiresAt: Date.now() + 300000 // 5 min
  }), { PX: 300000 });
  
  return reply.send({ authorization_code: authCode });
});

// 2. Token exchange
app.post('/auth/token', async (req, reply) => {
  const { code, code_verifier, client_assertion } = req.body;
  
  const session = await redis.get(`auth:${code}`);
  if (!session) return reply.status(401).send({ error: 'Invalid code' });
  
  const { code_challenge } = JSON.parse(session);
  
  // PKCE verification (S256)
  const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
  if (hash !== code_challenge) {
    return reply.status(401).send({ error: 'PKCE verification failed' });
  }
  
  // Generates JWT access token with RS256
  const token = jwt.sign(
    { 
      sub: session.client_id,
      scope: session.scope,
      consent_id: session.consent_id
    },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h', issuer: 'https://auth.simulator.com' }
  );
  
  return reply.send({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
});
```

### Data Endpoints

```typescript
// Lists user accounts
app.get('/accounts', async (req, reply) => {
  const token = validateToken(req.headers.authorization!);
  
  const consent = await getConsent(token.consent_id);
  if (!consent.scope.includes('accounts:read')) {
    return reply.status(403).send({ error: 'Scope not authorized' });
  }
  
  return reply.send({
    data: [{
      accountId: 'acc_001',
      type: 'CONTA_DEPOSITO_AVISTA',
      currency: 'BRL',
      balances: [{ type: 'AVAILABLE', amount: '15000.00' }]
    }]
  });
});
```

---

## Go Implementation

```go
package main

import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "net/http"
    "time"
    "github.com/golang-jwt/jwt/v5"
    "github.com/redis/go-redis/v9"
)

type AuthSession struct {
    ClientID      string `json:"client_id"`
    RedirectURI   string `json:"redirect_uri"`
    Scope         string `json:"scope"`
    CodeChallenge string `json:"code_challenge"`
    ExpiresAt     int64  `json:"expires_at"`
}

var rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

// Authorization endpoint
func authorizeHandler(w http.ResponseWriter, r *http.Request) {
    clientID := r.FormValue("client_id")
    codeChallenge := r.FormValue("code_challenge")
    
    // Generate authorization code
    buf := make([]byte, 32)
    rand.Read(buf)
    authCode := base64.URLEncoding.EncodeToString(buf)
    
    session := AuthSession{
        ClientID:      clientID,
        Scope:         r.FormValue("scope"),
        CodeChallenge: codeChallenge,
        ExpiresAt:     time.Now().Add(5 * time.Minute).Unix(),
    }
    
    sessionJSON, _ := json.Marshal(session)
    rdb.Set(r.Context(), "auth:"+authCode, sessionJSON, 5*time.Minute)
    
    json.NewEncoder(w).Encode(map[string]string{
        "authorization_code": authCode,
    })
}

// Token exchange
func tokenHandler(w http.ResponseWriter, r *http.Request) {
    code := r.FormValue("code")
    verifier := r.FormValue("code_verifier")
    
    sessionJSON, err := rdb.Get(r.Context(), "auth:"+code).Bytes()
    if err != nil {
        http.Error(w, "Invalid code", http.StatusUnauthorized)
        return
    }
    
    var session AuthSession
    json.Unmarshal(sessionJSON, &session)
    
    // PKCE verification
    hash := sha256.Sum256([]byte(verifier))
    challenge := base64.RawURLEncoding.EncodeToString(hash[:])
    
    if challenge != session.CodeChallenge {
        http.Error(w, "PKCE failed", http.StatusUnauthorized)
        return
    }
    
    // Generate JWT
    claims := jwt.MapClaims{
        "sub":        session.ClientID,
        "scope":      session.Scope,
        "exp":        time.Now().Add(1 * time.Hour).Unix(),
        "iss":        "https://auth.simulator.com",
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    tokenString, _ := token.SignedString(privateKey)
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "access_token": tokenString,
        "token_type":   "Bearer",
        "expires_in":   3600,
    })
}
```

---

## Testing

```bash
# 1. Start the simulator
pnpm --filter @banking/open-finance dev

# 2. Request authorization
curl -X POST http://localhost:3006/auth/authorize \
  -d "client_id=app123&scope=accounts:read&code_challenge=E9Melhoa2Owv..."

# 3. Exchange code for token
curl -X POST http://localhost:3006/auth/token \
  -d "code=authcode123&code_verifier=dBjftJeZ4CVP..."

# 4. Request data
curl -H "Authorization: Bearer TOKEN" http://localhost:3006/accounts
```

---

## Lessons Learned

1. **FAPI is OAuth 2.0 on steroids** — Mandatory PKCE, JWT with RS256, explicit consent.
2. **Consent is not a token** — The user authorizes a scope, and the token carries that authorization. One without the other doesn't work.
3. **Open Finance isn't just API** — It's an ecosystem: directory, certificates, consent, webhooks. Every piece depends on another.
4. **Testing integration is the real challenge** — The easy part is implementing the endpoint. The hard part is ensuring 20 different banks can consume it.
