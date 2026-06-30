# Corporate Plan

Phase 6 — Global Expansion and Enterprise (Months 19-24)

## Pricing Tiers

### Starter (5 Seats)

| Component | Details |
|-----------|---------|
| Price | $499/month or $4,990/year |
| Seats | Up to 5 learners |
| Content Access | Core modules only |
| Support | Email (48h response) |
| Reporting | Basic analytics |

### Growth (10 Seats)

| Component | Details |
|-----------|---------|
| Price | $899/month or $8,990/year |
| Seats | Up to 10 learners |
| Content Access | Full library + custom paths |
| Support | Priority email (24h response) |
| Reporting | Advanced analytics + exports |
| Admin Dashboard | Full access |

### Enterprise (20+ Seats)

| Component | Details |
|-----------|---------|
| Price | Custom pricing (contact sales) |
| Seats | Unlimited (20+ minimum) |
| Content Access | Full library + custom content upload |
| Support | Dedicated success manager |
| Reporting | Real-time analytics + API access |
| Admin Dashboard | Full access + API |
| SSO | SAML 2.0 / OIDC integration |

---

## Features Per Tier

| Feature | Starter | Growth | Enterprise |
|---------|---------|--------|------------|
| Core Banking Modules | ✓ | ✓ | ✓ |
| Advanced Analytics | — | ✓ | ✓ |
| Custom Learning Paths | — | ✓ | ✓ |
| Team Progress Tracking | ✓ | ✓ | ✓ |
| Individual Metrics | — | ✓ | ✓ |
| Certificate Generation | — | ✓ | ✓ |
| API Access | — | — | ✓ |
| SSO Integration | — | — | ✓ |
| Custom Content Upload | — | — | ✓ |
| Dedicated Account Manager | — | — | ✓ |
| SLA Guarantee | — | — | ✓ |
| Invoice Billing | — | — | ✓ |

---

## Admin Dashboard Requirements

### Team Management

- Add/remove team members via email invitation
- Assign learning paths to individuals or groups
- Set completion deadlines and reminders
- View team-wide progress overview

### Content Management

- Assign existing modules to team members
- Create custom learning paths (Growth+)
- Upload internal training documents (Enterprise)
- Track completion rates by module

### Reporting

- Export progress reports (CSV, PDF)
- Schedule automated reports
- Real-time completion tracking
- Individual vs team performance comparison

---

## SSO Integration

### Supported Providers

- **SAML 2.0** — Okta, Azure AD, OneLogin, Ping Identity
- **OIDC** — Auth0, Google Workspace, Keycloak
- **LDAP** — Enterprise directory services

### Configuration

```typescript
interface SSOConfig {
  provider: 'saml' | 'oidc' | 'ldap';
  metadataUrl?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    department?: string;
    role?: string;
  };
  jitProvisioning: boolean;   // Auto-create accounts
  defaultRole: 'learner' | 'admin';
}
```

### Implementation Steps

1. Admin enables SSO in dashboard settings
2. Upload IdP metadata or configure OIDC endpoints
3. Map user attributes from IdP to platform
4. Test with a pilot group
5. Roll out to full organization
6. Optionally disable password-based login

---

## Custom Learning Paths

### Path Builder Interface

- **Module Selection** — Drag-and-drop from content library
- **Prerequisites** — Define required prior modules
- **Assessments** — Insert quizzes between modules
- **Certificates** — Auto-generate on completion
- **Deadlines** — Set completion targets per path

### Path Configuration

```typescript
interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: PathModule[];
  assessments: Assessment[];
  certificate?: CertificateConfig;
  deadlines: {
    startDate?: Date;
    endDate?: Date;
    moduleTimeoutDays?: number;
  };
  notifications: {
    reminderFrequency: 'daily' | 'weekly';
    escalateTo?: string[];  // Manager emails
  };
}

interface PathModule {
  moduleId: string;
  order: number;
  required: boolean;
  estimatedHours: number;
}
```

### Analytics

- Overall path completion rate
- Average time to complete
- Drop-off points by module
- Assessment score distribution
- Individual progress vs team average
