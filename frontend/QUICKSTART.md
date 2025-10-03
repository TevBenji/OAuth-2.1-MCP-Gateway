# 🚀 5-Minute Quick Start Guide

Your environment is **READY TO GO!** All credentials are configured.

## ✅ What's Already Done

- ✅ Clerk authentication configured
- ✅ Neon database connected
- ✅ Environment variables set up

## 📋 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up database
pnpm prisma generate
pnpm prisma db push

# 3. Start the app
pnpm dev
```

Then open: **http://localhost:3000**

## 🔧 One-Time Database Setup

Before running the commands above, you need to configure Neon database permissions:

### Option 1: Via Neon Console (Recommended)

1. Go to https://console.neon.tech
2. Select project: **rapid-bread-86570441**
3. Click **SQL Editor** in the left sidebar
4. Copy and paste the contents of `scripts/setup-neon-db.sql`
5. Click **Run** to execute
6. Go to **Data API** → Click **Refresh schema cache**

### Option 2: One-Line Command

```bash
# Run the SQL setup script
psql "$DATABASE_URL" -f scripts/setup-neon-db.sql
```

## 🎯 What You'll Get

1. **Landing Page** with Wise-inspired design
   - Pricing plans
   - Feature showcase
   - Clean, professional UI

2. **Authentication**
   - Sign up / Sign in with Clerk
   - Email or social login (Google, GitHub)
   - Secure session management

3. **Dashboard**
   - Analytics and usage stats
   - API key management (full CRUD)
   - Organization settings
   - Billing (Stripe integration ready)
   - Team management
   - File uploads
   - Data export tools

## 🔍 Verify Setup

Test your configuration:

```bash
# Check Clerk auth
curl https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer sk_test_bO06BHC6fRmXgVK03K08LC9u4SKxw2Bw2r0jOyoUFF"

# Check Neon database
pnpm prisma studio
# Opens database browser at http://localhost:5555

# Check Next.js build
pnpm build
```

## 🐛 Troubleshooting

### Issue: "Clerk keys not found"
**Solution:** Restart dev server after changing `.env.local`
```bash
# Stop server (Ctrl+C), then:
pnpm dev
```

### Issue: "Cannot connect to database"
**Solution:** Verify DATABASE_URL is correct
```bash
# Test connection
pnpm prisma db pull
```

### Issue: "Port 3000 already in use"
**Solution:** Use a different port
```bash
pnpm dev -- -p 3001
```

### Issue: "Prisma schema not found"
**Solution:** Make sure you're in the frontend directory
```bash
cd frontend
pnpm prisma generate
```

## 📊 Your Configuration

**Clerk Project:** blessed-lion-68.clerk.accounts.dev
**Neon Project:** rapid-bread-86570441 (eastus2.azure)
**Frontend URL:** http://localhost:3000
**Backend URL:** http://localhost:8787 (when running MCP Gateway)

## 🎨 Features Available

### Working Out of the Box:
- ✅ Authentication (Clerk)
- ✅ Database (Neon PostgreSQL)
- ✅ API Key Management
- ✅ Organization Settings
- ✅ Team Management
- ✅ Usage Analytics
- ✅ Dark Mode
- ✅ Responsive Design

### Optional (Configure Later):
- ⏳ Stripe Payments (set STRIPE_SECRET_KEY)
- ⏳ Email Notifications (set RESEND_API_KEY)
- ⏳ Analytics (PostHog, Sentry)

## 📖 Next Steps

1. **Explore the UI:**
   - Visit http://localhost:3000
   - Click "Get Started" to sign up
   - Explore the dashboard sections

2. **Test API Keys:**
   - Go to Organization → API Keys
   - Create a new API key
   - Copy and test it

3. **Customize Branding:**
   - Edit `src/app/layout.tsx` for app name
   - Update `tailwind.config.ts` for colors
   - Add your logo to `public/` folder

4. **Connect Backend:**
   - Start the MCP Gateway backend
   - Update `NEXT_PUBLIC_MCP_GATEWAY_URL` if needed
   - Test OAuth flows

## 🆘 Need Help?

- **Clerk Docs:** https://clerk.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Project Issues:** Check `/docs` folder or GitHub Issues

## 🎉 You're All Set!

Everything is configured and ready. Just run the 3 commands above and you're live!

```bash
pnpm install && pnpm prisma generate && pnpm prisma db push && pnpm dev
```

**Happy coding! 🚀**
