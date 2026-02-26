# PayFlown - Digital Wallet App

A full-featured digital wallet application similar to GCash, built with Next.js, Supabase, and TypeScript.

## Features

### Core Functionality
- **Phone Number Authentication** - SMS OTP-based signup and login
- **Digital Wallet** - View balance, wallet information, and account details
- **Send Money** - Transfer funds to other users by phone number
- **Request Money** - Send payment requests to other users
- **Transaction History** - View all incoming and outgoing transactions
- **Top-up Wallet** - Add funds via Stripe payment integration
- **Cash Out** - Withdraw funds to bank account (simulated in demo)
- **Contacts Management** - Save frequently used contacts for quick transfers
- **Settings** - Profile management and notification preferences

### Security Features
- Supabase Authentication with phone OTP
- Row-Level Security (RLS) on all database tables
- Secure session management with HTTP-only cookies
- Protected API routes with authentication checks

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase PostgreSQL with RLS policies
- **Authentication**: Supabase Auth (Phone OTP)
- **Payments**: Stripe integration (for top-ups)
- **Icons**: Lucide React

## Project Structure

```
app/
├── (dashboard)/              # Protected dashboard routes
│   ├── page.tsx             # Dashboard home
│   ├── send/               # Send money page
│   ├── request/            # Request money page
│   ├── history/            # Transaction history
│   ├── contacts/           # Contacts management
│   ├── topup/              # Top-up wallet
│   ├── cashout/            # Cash out
│   ├── settings/           # User settings
│   └── layout.tsx          # Dashboard layout
├── auth/
│   ├── login/              # Phone OTP login
│   ├── signup/             # Phone OTP signup
│   └── error/              # Auth error page
├── api/
│   ├── contacts/
│   │   └── search/         # Search users by phone
│   └── transactions/
│       ├── send/           # Send money API
│       └── request/        # Request money API
└── page.tsx                # Root redirect page

components/
├── dashboard-header.tsx     # Dashboard header with user info
├── dashboard-nav.tsx        # Navigation sidebar
├── protected-route.tsx      # Auth guard component
├── wallet-card.tsx          # Wallet balance display
└── recent-transactions.tsx  # Recent transactions widget

hooks/
├── useAuth.ts              # Authentication hook
└── useWallet.ts            # Wallet data hook

lib/
├── supabase/
│   ├── client.ts           # Browser client setup
│   ├── server.ts           # Server client setup
│   └── proxy.ts            # Session proxy for middleware
└── utils.ts                # Utility functions
```

## Database Schema

### Tables

#### `auth.users` (Supabase built-in)
- User authentication data
- Email, phone, metadata storage

#### `profiles`
- `id` (UUID, FK to auth.users)
- `phone_number` (VARCHAR)
- `display_name` (VARCHAR)
- `avatar_url` (TEXT, optional)
- `created_at`, `updated_at` (TIMESTAMP)

#### `wallets`
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `balance` (NUMERIC)
- `currency` (VARCHAR, default: 'PHP')
- `created_at`, `updated_at` (TIMESTAMP)

#### `transactions`
- `id` (UUID, PK)
- `wallet_id` (UUID, FK to wallets)
- `from_user_id` (UUID, FK to profiles)
- `to_user_id` (UUID, FK to profiles)
- `amount` (NUMERIC)
- `type` (VARCHAR: transfer_in, transfer_out, topup, cashout)
- `status` (VARCHAR: completed, pending, failed)
- `description` (TEXT, optional)
- `payment_intent_id` (VARCHAR, for Stripe)
- `reference_code` (VARCHAR, unique)
- `created_at`, `updated_at` (TIMESTAMP)

#### `payment_requests`
- `id` (UUID, PK)
- `from_user_id` (UUID, FK to profiles)
- `to_user_id` (UUID, FK to profiles)
- `amount` (NUMERIC)
- `reason` (TEXT, optional)
- `status` (VARCHAR: pending, accepted, rejected)
- `created_at`, `updated_at` (TIMESTAMP)

#### `contacts`
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `contact_user_id` (UUID, FK to profiles)
- `nickname` (VARCHAR)
- `created_at` (TIMESTAMP)

All tables have Row-Level Security (RLS) policies enabled to ensure users can only access their own data.

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Stripe account (for payments)

### Installation

1. **Clone and setup**
```bash
npm install
# or
pnpm install
```

2. **Environment Variables**
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

3. **Run migrations**
```bash
# The database schema is created via the setup-schema.sql script
```

4. **Start development server**
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see the app.

## Usage

### Sign Up
1. Go to `/auth/signup`
2. Enter your full name and phone number
3. Receive OTP via SMS
4. Verify OTP to create account
5. Wallet auto-creates with 0 balance

### Send Money
1. Go to Send Money from dashboard
2. Enter recipient's phone number and search
3. Enter amount and optional message
4. Confirm and send
5. Both wallets are updated instantly

### Request Money
1. Go to Request Money
2. Enter payer's phone number
3. Specify amount and reason
4. Payer receives notification

### Top-up
1. Go to Top-up Wallet
2. Enter amount or select quick amount
3. Click "Proceed to Payment"
4. Complete Stripe payment
5. Balance updated upon success

## API Routes

### POST `/api/contacts/search`
Search for user by phone number
```json
Request: { "phone": "+63 9XX XXX XXXX" }
Response: { "profile": { "id", "display_name", "phone_number" } }
```

### POST `/api/transactions/send`
Send money to another user
```json
Request: { "recipientPhone", "amount", "message" }
Response: { "success": true, "message": "..." }
```

### POST `/api/transactions/request`
Create payment request
```json
Request: { "recipientPhone", "amount", "reason" }
Response: { "success": true, "paymentRequest": {...} }
```

## Authentication Flow

1. **Signup**: User enters phone → OTP sent → Verified → Profile & Wallet created
2. **Login**: User enters phone → OTP sent → Verified → Session established
3. **Protected Routes**: Middleware checks auth state → Redirects to login if needed

## Security Considerations

- All data is protected by Supabase RLS policies
- Sensitive operations require authentication via middleware
- Passwords/PINs not implemented (phone OTP is primary auth)
- All transactions are immutable and logged
- CSRF protection via Next.js built-in mechanisms

## Future Enhancements

- [ ] Biometric authentication (fingerprint, face)
- [ ] QR code generation for wallet address sharing
- [ ] Push notifications for transactions
- [ ] Bill payments integration
- [ ] Loan/credit services
- [ ] Investment features
- [ ] Multi-currency support
- [ ] Admin dashboard for KYC verification
- [ ] Advanced fraud detection
- [ ] Transaction receipts/PDF export

## Demo Mode

The app runs in demo mode by default:
- Top-up adds funds directly to wallet (no real Stripe charges)
- All transactions are recorded in database
- Use any phone number with country code to create accounts

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## License

MIT License - Feel free to use this project for personal or commercial purposes.
