# 🚀 OAuth 2.1 MCP Gateway - Quick Setup Guide

This guide will help you get the OAuth 2.1 MCP Gateway frontend running in under 5 minutes.

## Prerequisites

- Node.js 18+ and pnpm installed
- A web browser
- Text editor for editing configuration files

## Step-by-Step Setup

### 1️⃣ Install Dependencies

Open your terminal in the `frontend` directory and run:

```bash
pnpm install
```

### 2️⃣ Set Up Clerk Authentication (Required)

1. **Create a Clerk Account** (if you don't have one):
   - Go to https://clerk.com
   - Click "Get Started"
   - Sign up with GitHub, Google, or email

2. **Create Your Clerk Application**:
   - Go to https://dashboard.clerk.com
   - Click "Create application"
   - Name it: `oauth-mcp-gateway`
   - Select authentication methods:
     - ✅ Email
     - ✅ Google (optional)
     - ✅ GitHub (optional)
   - Click "Create application"

3. **Get Your API Keys**:
   - In Clerk Dashboard, go to **"API Keys"** (left sidebar)
   - Copy these two keys:
     - **Publishable Key** (starts with `pk_`)
     - **Secret Key** (starts with `sk_`)

4. **Update Your Environment File**:
   - Open `frontend/.env.local`
   - Replace the placeholder values:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_YOUR_ACTUAL_KEY_HERE
   CLERK_SECRET_KEY=sk_YOUR_ACTUAL_SECRET_KEY_HERE
   ```

### 3️⃣ Set Up Database with Neon (Optional but Recommended)

**Option A: Use Neon (Free PostgreSQL) - RECOMMENDED**

1. **Create Neon Account**:
   - Go to https://neon.tech
   - Sign up with GitHub or email
   - It's free for small projects!

2. **Create Database**:
   - Click "Create a project"
   - Name it: `mcp-gateway`
   - Select region closest to you
   - Click "Create project"

3. **Get Connection String**:
   - In Neon console, copy the connection string
   - It looks like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb`

4. **Update Environment**:
   ```env
   DATABASE_URL=your_neon_connection_string_here
   DIRECT_URL=same_connection_string_here
   ```

5. **Initialize Database**:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

**Option B: Run Without Database (Limited Functionality)**
- The app will run but some features won't work
- Good for just viewing the UI

### 4️⃣ Configure Stripe Payments (Optional)

Skip this for now - the app will run without it. You can add it later if you want to test payment features.

### 5️⃣ Start the Application

```bash
pnpm dev
```

The app will start at http://localhost:3000

## 🎉 You're Done!

### What You Can Do Now:

1. **Visit the Homepage**: http://localhost:3000
   - See the landing page with Wise-inspired design
   - View pricing plans
   - Explore features

2. **Sign Up / Sign In**:
   - Click "Get Started" or "Sign In"
   - Create an account using email or social login
   - You'll be redirected to the dashboard

3. **Explore the Dashboard**:
   - View analytics and usage stats
   - Navigate through all the sections:
     - Organization settings
     - Projects
     - API Keys (with full CRUD operations)
     - Usage Limits
     - Billing sections
     - Files
     - Export Records

4. **Test API Key Management**:
   - Go to Organization → API Keys
   - View sample API keys
   - Toggle visibility
   - Copy keys to clipboard
   - Search and filter keys

## 🔧 Troubleshooting

### Common Issues and Solutions:

**1. "Missing publishable key" error**
- Make sure you copied the correct keys from Clerk
- Check that the keys are in `.env.local` (not `.env`)
- Restart the development server after changing environment variables

**2. "Cannot connect to database" error**
- If using Neon, make sure your connection string is correct
- Check that your Neon project is active
- You can run without a database for UI testing

**3. Build errors**
- Make sure you're using Node.js 18 or higher
- Delete `node_modules` and `.next` folders, then run `pnpm install` again
- Check that all dependencies installed correctly

**4. Port 3000 already in use**
- Kill the process using port 3000, or
- Run on a different port: `pnpm dev -- -p 3001`

**5. Clerk authentication not working**
- Double-check your Clerk keys
- Make sure you're using the correct environment (development/production)
- Clear browser cookies and try again

## 📚 Next Steps

### Essential Configuration:
1. **Set up Neon database** for data persistence
2. **Configure OAuth providers** in the MCP Gateway backend
3. **Set up Stripe** for payment processing (when ready for production)

### Customization:
1. **Update branding** in `src/app/layout.tsx`
2. **Modify color scheme** in `tailwind.config.ts`
3. **Add your logo** in public folder
4. **Customize pricing** in `src/app/page.tsx`

### Development:
1. **Read the main README.md** for architecture details
2. **Check the API documentation** in `/docs`
3. **Join our Discord** for support (link in README)

## 🆘 Need Help?

- **Documentation**: Check the `/docs` folder
- **GitHub Issues**: Report bugs or request features
- **Environment Setup**: See `.env.local.example` for all options
- **Database Issues**: Neon has great docs at https://neon.tech/docs

## 🎨 Features to Explore

- **Wise-Inspired Design**: Clean, modern, and professional
- **Dark Mode**: Automatically follows system preference
- **Responsive**: Works on desktop, tablet, and mobile
- **Real Charts**: Interactive analytics with Recharts
- **API Key Management**: Full CRUD with search and filters
- **Billing Dashboard**: Subscription management ready
- **Team Features**: Invite and manage team members
- **Export Tools**: Data export for compliance

---

**Quick Commands Reference:**

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Run production build

# Database
pnpm prisma studio    # Visual database editor
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema to database

# Code Quality
pnpm lint         # Check for issues
pnpm format       # Format code
```

---

🎉 **Congratulations!** You now have a fully functional OAuth 2.1 MCP Gateway frontend running locally!