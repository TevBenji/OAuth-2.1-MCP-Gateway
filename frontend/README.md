# OAuth 2.1 MCP Gateway Frontend

A modern, secure, and scalable frontend for the OAuth 2.1 MCP (Model Context Protocol) Gateway. Built with Next.js 15, TypeScript, and Tailwind CSS, featuring a Wise-inspired design system.

![OAuth 2.1 MCP Gateway](https://img.shields.io/badge/OAuth%202.1-MCP%20Gateway-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC)

## 🚀 Features

### Authentication & Security
- **Clerk Authentication**: Enterprise-grade authentication with social logins
- **OAuth 2.1 Compliance**: Full implementation with PKCE, DPoP, and token binding
- **Zero Trust Architecture**: Every request verified and encrypted
- **Multi-Factor Authentication**: Enhanced security with 2FA support

### Dashboard & Management
- **Project Management**: Create and manage multiple MCP projects
- **API Key Management**: Generate, rotate, and manage API keys with scopes
- **Team Collaboration**: Invite team members with role-based access control
- **Usage Analytics**: Real-time monitoring and detailed usage statistics

### Billing & Subscriptions
- **Stripe Integration**: Secure payment processing and subscription management
- **Flexible Plans**: Free, Starter, Professional, and Enterprise tiers
- **Usage-Based Billing**: Pay for what you use with transparent pricing
- **Invoice Management**: Automated invoicing and billing history

### Design & User Experience
- **Wise-Inspired Design**: Clean, modern interface following Wise design principles
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## 🛠 Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom Wise design system
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📦 Installation

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (we recommend [Neon](https://neon.tech/))
- Clerk account for authentication
- Stripe account for payments (optional)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/oauth-mcp-gateway.git
cd oauth-mcp-gateway/frontend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database - Neon PostgreSQL (Required)
DATABASE_URL=postgresql://username:password@host.neon.tech:5432/database?sslmode=require
DIRECT_URL=postgresql://username:password@host.neon.tech:5432/database?sslmode=require

# Stripe Payments (Optional)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MCP Gateway API
NEXT_PUBLIC_MCP_GATEWAY_URL=http://localhost:8787
```

4. **Set up the database**

Create a new database on [Neon](https://neon.tech/):
- Sign up for a free account
- Create a new project
- Copy the connection strings to your `.env.local`

Run database migrations:
```bash
pnpm prisma generate
pnpm prisma db push
```

Optionally, seed the database with sample data:
```bash
pnpm prisma db seed
```

5. **Start the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── dashboard/          # Protected dashboard pages
│   │   │   ├── organization/   # Organization management
│   │   │   ├── billing/        # Billing and subscriptions
│   │   │   └── ...
│   │   ├── api/                # API routes
│   │   └── layout.tsx          # Root layout with providers
│   │
│   ├── components/             # Reusable React components
│   │   ├── ui/                # Base UI components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   └── marketing/         # Marketing site components
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── prisma.ts         # Prisma client
│   │   ├── stripe.ts         # Stripe configuration
│   │   └── utils.ts          # Helper functions
│   │
│   ├── hooks/                # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── middleware.ts        # Next.js middleware for auth
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts             # Database seeding script
│
├── public/                  # Static assets
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm prisma studio     # Open Prisma Studio
pnpm prisma generate   # Generate Prisma client
pnpm prisma db push    # Push schema changes
pnpm prisma migrate dev # Create migration

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm type-check   # TypeScript type checking
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ |
| `DATABASE_URL` | PostgreSQL connection URL | ✅ |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ❌ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | ❌ |
| `NEXT_PUBLIC_MCP_GATEWAY_URL` | MCP Gateway API URL | ✅ |

## 📊 Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **User**: Managed by Clerk, extended with custom fields
- **Organization**: Team/company accounts
- **Project**: Individual MCP projects
- **ApiKey**: API keys for authentication
- **Subscription**: Billing and plan information
- **UsageRecord**: API usage tracking
- **OAuthConfig**: OAuth provider configurations

## 💳 Billing & Monetization

### Subscription Tiers

1. **Free**: 1,000 API calls/month, 1 project
2. **Starter** ($29/month): 10,000 API calls, 5 projects
3. **Professional** ($99/month): 100,000 API calls, unlimited projects
4. **Enterprise** (Custom): Unlimited usage, dedicated support

### Payment Integration

- Stripe Checkout for subscriptions
- Webhook handling for payment events
- Usage-based billing with metered pricing
- Invoice generation and management

## 🎨 Design System

The frontend implements a Wise-inspired design system with:

- **Colors**: Green primary (#9FE870), Navy secondary, Gray scale
- **Typography**: Inter font family with custom scale
- **Spacing**: 4px base unit system
- **Components**: Consistent, accessible UI components
- **Animations**: Smooth, purposeful transitions

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t mcp-gateway-frontend .
docker run -p 3000:3000 mcp-gateway-frontend
```

### Manual Deployment

```bash
pnpm build
pnpm start
```

## 🔒 Security

- All API routes protected with authentication
- Environment variables for sensitive data
- Content Security Policy headers
- HTTPS enforced in production
- Regular dependency updates

## 🧪 Testing

```bash
pnpm test          # Run all tests
pnpm test:unit     # Unit tests
pnpm test:e2e      # End-to-end tests
pnpm test:coverage # Generate coverage report
```

## 📚 Documentation

- [API Documentation](/docs/api)
- [Architecture Guide](/docs/architecture)
- [Contributing Guide](/CONTRIBUTING.md)
- [Security Policy](/SECURITY.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Documentation](https://docs.mcp-gateway.dev)
- [Discord Community](https://discord.gg/mcp-gateway)
- [GitHub Issues](https://github.com/yourusername/oauth-mcp-gateway/issues)
- Email: support@mcp-gateway.dev

## 🙏 Acknowledgments

- [Wise Design System](https://wise.design/) for design inspiration
- [Clerk](https://clerk.com/) for authentication
- [Neon](https://neon.tech/) for database hosting
- [Vercel](https://vercel.com/) for hosting and deployment

---

Built with ❤️ by the MCP Gateway Team