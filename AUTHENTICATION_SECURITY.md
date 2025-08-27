# Authentication Security Implementation

This document outlines the comprehensive JWT authentication system implemented for the Idlewood Capital investor portal, designed with enterprise-grade security standards.

## 🔐 Security Features Implemented

### 1. JWT Token Management
- **Access Tokens**: 30-minute expiration with automatic refresh
- **Refresh Tokens**: 7-day expiration (30 days for "remember me")
- **Token Rotation**: Refresh tokens are invalidated and replaced on each use
- **Blacklisting**: Logout immediately invalidates refresh tokens
- **Secure Storage**: HTTP-only, secure, SameSite cookies

### 2. Password Security
- **Bcrypt Hashing**: 12 salt rounds (2024 security standard)
- **Password Policy**: Minimum 12 characters with complexity requirements
- **Rehashing**: Automatic password rehashing when salt rounds increase
- **Timing Attack Protection**: Constant-time comparison functions

### 3. Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes per IP/email
- **Progressive Blocking**: 30-minute lockout after limit exceeded
- **Suspicious Activity Detection**: Multiple email attempts from single IP
- **Memory-based Storage**: Production should use Redis

### 4. Role-Based Access Control (RBAC)
- **Three Roles**: Admin, Investor, User
- **Route Protection**: Middleware-based authorization
- **Component-level Security**: Protected components for UI elements
- **API Endpoint Protection**: Role-specific API access

### 5. Security Logging & Auditing
- **Authentication Events**: Login attempts, successes, failures
- **Token Events**: Refresh, revocation, expiration
- **Rate Limiting**: Blocked attempts and suspicious activity
- **Database Storage**: All events stored with IP, user agent, timestamps

### 6. Input Validation & Sanitization
- **Email Validation**: Format and existence checking
- **Password Strength**: Real-time validation with user feedback
- **SQL Injection Prevention**: Parameterized queries with Vercel Postgres
- **XSS Protection**: Next.js built-in protections

## 🏗️ Architecture Overview

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Rate limiting check (IP + email combination)
3. User lookup and account status verification
4. Password verification with bcrypt
5. JWT token pair generation (access + refresh)
6. Secure cookie setting with HTTP-only flags
7. Audit log entry creation

### Token Refresh Flow
1. Client automatically requests refresh before expiration
2. Refresh token validation and blacklist checking
3. User account status verification
4. Old refresh token blacklisting
5. New token pair generation
6. Secure cookie update

### Logout Flow
1. Refresh token extraction from cookies
2. Token blacklisting for immediate invalidation
3. Cookie clearing with expired dates
4. Audit log entry creation

## 🔧 Configuration

### Required Environment Variables
```bash
# JWT Secrets (minimum 32 characters each)
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-different-refresh-token-secret"

# Application URLs
NEXTAUTH_URL="https://yourdomain.com"
ALLOWED_ORIGIN="https://yourdomain.com"
COOKIE_DOMAIN="yourdomain.com"

# Security Settings
NODE_ENV="production"
HTTPS_ONLY="true"
```

### Security Headers (Recommended for Production)
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 📁 File Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── context.tsx          # React auth context
│   │   ├── jwt.ts               # JWT utilities
│   │   ├── middleware.ts        # Route protection
│   │   ├── password.ts          # Password security
│   │   ├── rate-limit.ts        # Rate limiting
│   │   └── service.ts           # Authentication service
│   └── types/
│       └── auth.ts              # TypeScript definitions
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx   # Route protection components
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts   # Login endpoint
│   │       ├── logout/route.ts  # Logout endpoint
│   │       ├── refresh/route.ts # Token refresh
│   │       └── me/route.ts      # Current user info
│   ├── investor-portal/         # Login page
│   └── dashboard/               # Protected dashboard
└── middleware.ts                # Next.js middleware
```

## 🛡️ Security Best Practices Implemented

### 1. Token Security
- Separate secrets for access and refresh tokens
- Short-lived access tokens (30 minutes)
- Automatic token refresh before expiration
- Immediate token revocation on logout
- Blacklist tracking for revoked tokens

### 2. Cookie Security
- `HttpOnly`: Prevents XSS token theft
- `Secure`: HTTPS-only transmission
- `SameSite=Strict`: CSRF protection
- Domain-specific: Prevents subdomain attacks
- Proper expiration: Automatic cleanup

### 3. Rate Limiting
- IP-based and email-based tracking
- Exponential backoff for repeated attempts
- Suspicious activity detection
- Memory-efficient storage with automatic cleanup

### 4. Password Security
- Industry-standard bcrypt with 12 rounds
- Comprehensive password policy enforcement
- Automatic rehashing for security updates
- Timing attack prevention

### 5. Database Security
- Parameterized queries prevent SQL injection
- User status checking prevents disabled account access
- Audit trail for all authentication events
- Secure user data handling

## 🚀 Usage Examples

### Protected Route Component
```tsx
import { InvestorRoute } from '@/components/auth/ProtectedRoute'

export default function MyProtectedPage() {
  return (
    <InvestorRoute>
      <div>This content is only visible to investors and admins</div>
    </InvestorRoute>
  )
}
```

### Authentication Hook
```tsx
import { useAuth } from '@/lib/auth/context'

export default function MyComponent() {
  const { user, login, logout, hasRole } = useAuth()
  
  const handleLogin = async () => {
    const result = await login(email, password, remember)
    if (result.success) {
      // Handle success
    }
  }
  
  return (
    <div>
      {user ? (
        <div>Welcome, {user.email}!</div>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  )
}
```

### API Route Protection
```tsx
import { requireInvestorApi } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireInvestorApi(request)
  if (authResult) return authResult // Return error if not authorized
  
  // User is authenticated and authorized
  return NextResponse.json({ data: 'sensitive data' })
}
```

## 🔍 Security Testing Recommendations

### 1. Authentication Testing
- [ ] Test invalid credentials
- [ ] Test disabled account access
- [ ] Test rate limiting enforcement
- [ ] Test token expiration handling
- [ ] Test logout token invalidation

### 2. Authorization Testing
- [ ] Test role-based access control
- [ ] Test protected route access
- [ ] Test API endpoint permissions
- [ ] Test privilege escalation attempts

### 3. Security Testing
- [ ] Test password policy enforcement
- [ ] Test timing attack resistance
- [ ] Test CSRF protection
- [ ] Test XSS prevention
- [ ] Test cookie security settings

## 📊 Monitoring & Alerting

### Key Metrics to Monitor
- Failed login attempts per hour
- Rate limiting triggers per hour
- Token refresh failures
- Suspicious activity detections
- Account lockouts

### Security Alerts
- Multiple failed login attempts from single IP
- High volume of authentication requests
- Unusual login patterns or locations
- Token validation failures
- System security errors

## 🔄 Maintenance Tasks

### Daily
- Monitor authentication logs for anomalies
- Check rate limiting effectiveness
- Review failed authentication attempts

### Weekly
- Clean up expired rate limiting entries
- Review user account statuses
- Analyze authentication patterns

### Monthly
- Review and update security policies
- Update dependencies for security patches
- Audit user roles and permissions

### Quarterly
- Security penetration testing
- Review and update JWT secrets
- Audit system access logs

## 🚨 Incident Response

### Security Breach Detection
1. Immediately revoke all refresh tokens
2. Force password reset for all users
3. Review audit logs for compromise scope
4. Update JWT secrets
5. Implement additional security measures

### Suspicious Activity Response
1. Investigate authentication logs
2. Block suspicious IP addresses
3. Review user account activities
4. Implement additional monitoring
5. Document incident and response

## 📝 Compliance Considerations

### SOC 2 Type II
- Comprehensive audit logging
- Access control management
- Security incident response
- Regular security assessments

### GDPR
- User consent for data processing
- Right to data deletion
- Secure data transmission
- Data breach notification procedures

This authentication system provides enterprise-grade security suitable for financial services and investor portals, with comprehensive protection against common attack vectors while maintaining excellent user experience.