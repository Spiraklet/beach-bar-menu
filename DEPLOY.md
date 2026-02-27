# Beach Bar Menu — Production Deployment Guide

Welcome! This guide walks you through putting your Beach Bar Menu app live on the internet so your customers can actually use it from anywhere. We will use free services for everything except your custom domain name.

**What you will end up with after following this guide:**
- Your app running live at a real URL (like `https://yourbar.com`)
- A cloud database storing all your orders and menu items
- QR codes that customers can scan to order from their phones
- A secure admin and staff portal accessible from anywhere

**What you will need:** A computer, a credit card (only for the custom domain — about $10–15/year), and the GitHub account where your code is stored.

---

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Step 1: Create Your Free Cloud Database (Neon.tech)](#step-1-create-your-free-cloud-database-neontech)
3. [Step 2: Prepare Your Secret Keys](#step-2-prepare-your-secret-keys)
4. [Step 3: Get Your Anthropic API Key (for Menu Scanning)](#step-3-get-your-anthropic-api-key-for-menu-scanning)
5. [Step 4: Push Your Code to GitHub](#step-4-push-your-code-to-github)
6. [Step 5: Deploy on Vercel](#step-5-deploy-on-vercel)
7. [Step 6: Set Up the Production Database Tables](#step-6-set-up-the-production-database-tables)
8. [Step 7: Create Your Admin Account (Seed the Database)](#step-7-create-your-admin-account-seed-the-database)
9. [Step 8: Purchase and Connect a Custom Domain](#step-8-purchase-and-connect-a-custom-domain)
10. [Step 9: Update Your App URL and Redeploy](#step-9-update-your-app-url-and-redeploy)
11. [Step 10: Smoke Test — Is Everything Working?](#step-10-smoke-test--is-everything-working)
12. [Step 11: Set Up Stripe Payments (Optional)](#step-11-set-up-stripe-payments-optional)
13. [Updating the App in the Future](#updating-the-app-in-the-future)
14. [Troubleshooting Deployment Problems](#troubleshooting-deployment-problems)
15. [Quick Reference](#quick-reference)

---

## Before You Start

Before we begin, make sure you have these things ready. Don't skip this — it will save you time later!

### Things you need

- [x] Your code is working locally (you can run `npm run dev` and see the app at `http://localhost:3000`)
- [x] You have a GitHub account and your project is pushed there
- [x] You have a web browser open (Chrome or Firefox recommended)

### Accounts you will create during this guide

| Service | What it does | Cost |
|---------|-------------|------|
| Neon.tech | Hosts your database in the cloud | Free |
| Vercel | Hosts your app and makes it live | Free |
| Anthropic | Powers the "Scan Menu" OCR feature | Pay-as-you-go (~$0.01–0.03 per scan) |
| Domain Registrar | Gives you a custom URL (yourbar.com) | ~$10–15/year |

> **Good to know:** Vercel and Neon are free for small businesses. You only pay if you grow to thousands of customers per day. The Anthropic API is extremely cheap for occasional menu scanning — $5 covers hundreds of scans.

---

## Step 1: Create Your Free Cloud Database (Neon.tech)

Your app stores everything — menu items, orders, accounts — in a database. Right now that database lives only on your computer. We need to move it to the cloud so the live app can use it.

### 1.1 Create a Neon account

1. Open your browser and go to: **https://neon.tech**
2. Click **"Sign Up"** (top right corner)
3. Sign up using your GitHub account — click **"Continue with GitHub"**
4. Follow the prompts to authorize Neon

### 1.2 Create a new project

1. Once logged in, click the big **"New Project"** button
2. Fill in the form:
   - **Project name:** `beach-bar-menu`
   - **Database name:** `beach_bar_menu`
   - **Region:** Choose the region closest to where your bar is located (e.g., "EU West" for Greece/Europe, "US East" for Americas)
   - **PostgreSQL version:** Leave the default
3. Click **"Create Project"**

### 1.3 Copy your database connection string

This is the most important step. After creating the project, Neon will show you a **"Connection Details"** screen.

1. Look for the section called **"Connection string"**
2. In the dropdown above the connection string, make sure **"Prisma"** is selected (not "psql" or "Node.js") — this gives you the exact format our app needs
3. Click the **copy icon** next to the connection string
4. It will look something like this:
   ```
   postgresql://username:password@ep-something-12345.eu-west-2.aws.neon.tech/beach_bar_menu?sslmode=require
   ```
5. **Paste this somewhere safe** — in a Notes file on your desktop. You will need it in Step 5.

> **Important:** Keep this connection string private. Anyone who has it can read and modify your entire database. Never post it on GitHub or share it in any chat.

---

## Step 2: Prepare Your Secret Keys

Your app uses a "JWT Secret" — a long random password that it uses to sign login sessions securely. We need to generate a strong one for production.

**Why does this matter?** The default placeholder in your local `.env` file is weak. On a live site, a weak JWT secret could allow attackers to forge login tokens and access your admin panel.

### 2.1 Generate a strong JWT secret

You have two options:

**Option A — Using your Mac Terminal:**
```
openssl rand -base64 64
```
This gives you a long random string. Copy the entire output — that is your JWT secret.

**Option B — Using an online generator:**
1. Go to: **https://1password.com/password-generator/**
2. Set length to **64 characters**
3. Turn on: Letters, Numbers, Symbols
4. Click Generate and copy the result

### 2.2 Write down all your secrets now

Open a **Notes** app (or TextEdit on Mac) and fill in this template. Save it somewhere on your desktop — **not inside the project folder**.

```
--- MY PRODUCTION SECRETS (keep private, delete after setup) ---

DATABASE_URL     = [paste from Step 1.3]
JWT_SECRET       = [paste from Step 2.1]
NEXT_PUBLIC_APP_URL = https://[your domain — fill in after Step 8]
ANTHROPIC_API_KEY = [fill in after Step 3]
STRIPE keys      = [optional — fill in after Step 11 if needed]
ENABLE_HSTS      = true
```

> **Warning:** Do NOT save this file inside the beach-bar-menu project folder. Do NOT commit any secrets to GitHub. The `.env` file in your project is already blocked from GitHub by `.gitignore`, but stay careful.

---

## Step 3: Get Your Anthropic API Key (for Menu Scanning)

Your app has a feature called **"Scan Menu"** — you upload a photo of your printed menu and the app automatically reads it and imports all the items. This feature requires an Anthropic API key.

Without this key, only the Scan Menu feature will not work. All other features (ordering, QR codes, staff portal, payments) work fine without it.

### 3.1 Create an Anthropic account

1. Go to: **https://console.anthropic.com**
2. Click **"Sign Up"**
3. Create an account with your email address and verify it

### 3.2 Add billing (required to use the API)

1. Once logged in, click your profile icon (top right) → **"Billing"**
2. Click **"Add payment method"** and enter your credit card
3. Set a monthly spending limit — **$5 or $10 is more than enough** for occasional menu scanning

### 3.3 Generate your API key

1. In the left sidebar, click **"API Keys"**
2. Click **"Create Key"**
3. Give it a name like `beach-bar-menu-production`
4. Click **"Create Key"**
5. **Copy the key immediately** — it starts with `sk-ant-` and will only be shown once
6. Paste it into your notes file next to `ANTHROPIC_API_KEY`

> **Note:** You can come back and add this key later. If you skip it now, the Scan Menu feature will show an error when used, but everything else works normally.

---

## Step 4: Push Your Code to GitHub

We need to make sure all your latest code is saved to GitHub before Vercel can deploy it.

### 4.1 Open Terminal and navigate to your project

**Mac:**
```
cd ~/Desktop/beach-bar-menu
```

### 4.2 Check what files need to be saved

```
git status
```

### 4.3 Save and push everything to GitHub

Run these commands one at a time:

```
git add .
git commit -m "Ready for production deployment"
git push origin master
```

### 4.4 Verify on GitHub

1. Open your browser and go to your GitHub repository
2. You should see all your project files listed
3. **Check that you do NOT see a `.env` file in the list** — if you do, stop and do not continue until it is removed (the `.env` file contains your local database password and should never be on GitHub)

> **Why is this safe?** The `.gitignore` file in your project tells Git to ignore the `.env` file. Your local database credentials will never be uploaded.

---

## Step 5: Deploy on Vercel

Vercel is the platform that will run your app 24/7 on the internet. It reads your code from GitHub and rebuilds automatically every time you push an update.

### 5.1 Create a Vercel account

1. Go to: **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** — this is important! It lets Vercel access your code automatically.
4. Authorize Vercel when GitHub asks

### 5.2 Import your project

1. On your Vercel dashboard, click **"Add New..."** → **"Project"**
2. You will see a list of your GitHub repositories. Find your beach bar menu repository and click **"Import"**
3. On the configuration screen:
   - **Framework Preset:** Vercel should auto-detect "Next.js" — leave it as is
   - **Root Directory:** Leave as `.` (the default)
   - **Build Command:** Leave as the default
   - **Output Directory:** Leave as the default
4. **Do not click Deploy yet** — we need to add environment variables first

### 5.3 Add environment variables

Scroll down on the same screen to find the **"Environment Variables"** section.

Add each variable below, one at a time. For each one: type the name in the left box, paste the value in the right box, and click **"Add"** before moving to the next.

| Variable Name | Value | Where to get it |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | Step 1.3 |
| `JWT_SECRET` | Your 64-character random string | Step 2.1 |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Use a temporary Vercel URL for now — see note below |
| `ANTHROPIC_API_KEY` | Your key starting with `sk-ant-` | Step 3.3 |
| `ENABLE_HSTS` | `true` | Type this exactly |

> **About `NEXT_PUBLIC_APP_URL`:** At this point you do not have a custom domain yet. For now, enter the Vercel URL that Vercel will assign to your project. You can find this on the next screen after deploying — it will look like `https://malaka.vercel.app` or `https://malaka-abc123.vercel.app`. Enter a temporary URL for now and we will update it in Step 9 after you have a real domain.
>
> If you already know your Vercel project URL, enter it here. Otherwise, put `https://placeholder.vercel.app` — you will update it in Step 9.

> **Stripe keys:** Leave these blank for now. The app works fully without Stripe — customers can simply pay staff in cash or by card reader. You can add Stripe later. See Step 11.

### 5.4 Deploy!

1. Once all environment variables are added, click **"Deploy"**
2. Vercel will show a progress screen — this takes 1–3 minutes
3. When it finishes, you will see a success screen with a **"Visit"** button

### 5.5 Note your Vercel URL

Click **"Visit"** to see your live app. The URL will look like:
`https://your-project.vercel.app`

Write this down — and if you used a placeholder in Step 5.3, go back to Settings → Environment Variables, edit `NEXT_PUBLIC_APP_URL`, and set it to this real Vercel URL. Then redeploy (see Step 9.2 for how to redeploy).

---

## Step 6: Set Up the Production Database Tables

Your app is live but the cloud database is empty — no tables exist yet. We need to run the database setup command to create all the tables. This is called "running a migration."

We will use the **Vercel CLI** — a small tool you install on your computer that lets you run commands against your live app.

### 6.1 Install the Vercel CLI

In your Terminal:
```
npm install -g vercel
```

### 6.2 Log in to Vercel

```
vercel login
```

A browser window will open. Log in with your GitHub account and click **"Authorize"**.

### 6.3 Link your project

In your Terminal, make sure you are in the project folder (`cd ~/Desktop/beach-bar-menu`), then run:

```
vercel link
```

Answer the prompts:
- "Set up and deploy?" → **Y**
- "Which scope?" → Select your account name
- "Link to existing project?" → **Y**
- "What's the name?" → Type the name of your project as it appears in Vercel (usually your repository name)

### 6.4 Download your production environment variables

```
vercel env pull .env.production.local
```

This downloads your Vercel environment variables to a temporary local file. Do not commit this file.

### 6.5 Create the database tables

```
npx dotenv -e .env.production.local -- npx prisma db push
```

You should see output ending with:

```
The database is now in sync with your Prisma schema.
```

If you see this, the tables were created successfully.

### 6.6 Clean up the temporary file

```
rm .env.production.local
```

> **What just happened?** Prisma looked at your `prisma/schema.prisma` file (which defines all your tables) and created those tables in your Neon cloud database. This is safe to run multiple times — it will never delete your existing data.

---

## Step 7: Create Your Admin Account (Seed the Database)

Now we need to create the first admin account and some sample data so you can log in and test.

### 7.1 Download environment variables and run the seed

```
vercel env pull .env.production.local
npx dotenv -e .env.production.local -- npm run db:seed
rm .env.production.local
```

You should see output like this:

```
Admin created: admin@beachbarmenu.com
Admin password: Admin123!@#
Client created: demo@beachbar.com
Client ID: 1234
...
Setup Complete!
```

### 7.2 Save your login credentials

**Write these down now — you will need them to log in:**

| Portal | URL path | Email | Password |
|--------|----------|-------|----------|
| Admin Login | `/admin/login` | `admin@beachbarmenu.com` | `Admin123!@#` |
| Client Login | `/login` | `demo@beachbar.com` | `Beach2024!@` |
| Staff Portal | `/staff/[token]/login` | (no email — use the URL) | `Staff1` |
| Customer Menu | `/1234/A1` | (public — no login needed) | (none) |

> **Change your passwords after first login!** These are the default passwords created by the setup script. Once your app is live, log in to each portal and change them to something strong and unique.

> **About the demo client:** The seed creates a sample beach bar ("Paradise Beach Bar") with sample menu items so you have something to test with. In real use, you will create your actual beach bar accounts from the Admin panel. The demo account can be left in for testing or deleted once you have real accounts set up.

---

## Step 8: Purchase and Connect a Custom Domain

Right now your app is at a Vercel URL like `your-project.vercel.app`. A custom domain like `yourbeachbar.com` looks much more professional and is what your customers will see when they scan QR codes.

### 8.1 Buy a domain

We recommend one of these registrars:

| Registrar | Website | Notes |
|-----------|---------|-------|
| Namecheap | namecheap.com | Good prices, easy to use — recommended |
| Squarespace Domains | domains.squarespace.com | Simple interface |
| GoDaddy | godaddy.com | Widely known — check renewal prices before buying |

**What to search for:** Your bar name + `.com` or `.gr` (for Greek businesses).

Examples: `malaka-beach.com`, `paradisebeachbar.gr`, `sunsetbar.com`

Typical cost: $10–15/year for `.com`, €10–15/year for `.gr`

**Steps on Namecheap:**
1. Go to **https://namecheap.com**
2. Search for your desired domain name
3. Click **"Add to cart"** next to an available domain
4. Create an account and complete the purchase

> **Tip:** You do NOT need any extras they try to sell you — no hosting, no email, no SSL certificates. Just the domain registration. Vercel handles HTTPS (SSL) for free automatically.

### 8.2 Add your domain to Vercel

1. Go to your Vercel project dashboard
2. Click the **"Settings"** tab → **"Domains"** in the left sidebar
3. Type your domain name (e.g., `yourbeachbar.com`) and click **"Add"**
4. Also add `www.yourbeachbar.com` so the www version works too
5. Vercel will show you the **DNS records** you need to add — keep this page open

### 8.3 Add DNS records at your registrar

**On Namecheap:**
1. Log in to Namecheap
2. Go to **"Domain List"** → click **"Manage"** next to your domain
3. Click the **"Advanced DNS"** tab
4. Delete any existing A records or CNAME records pointing elsewhere
5. Add these records (Vercel tells you exactly which ones — use what Vercel shows you):

| Record Type | Host | Value |
|-------------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

6. Save each record

### 8.4 Wait for verification

Back in Vercel, the domain will show "Pending" until the DNS records are verified. This usually takes between 5 minutes and a few hours.

When it is done, Vercel shows a green checkmark next to your domain and your app will be accessible at `https://yourbeachbar.com`.

> **How long does this take?** DNS changes can take anywhere from 5 minutes to 48 hours. Usually it is under 1 hour. If it takes longer than 48 hours, double-check the DNS records you entered.

> **Vercel provides a free HTTPS certificate automatically.** Your site will have a padlock in the address bar with no extra setup on your part.

---

## Step 9: Update Your App URL and Redeploy

This step is critical. **Do not skip it.**

Your app has a setting called `NEXT_PUBLIC_APP_URL` that controls what URL gets embedded inside every QR code. If this URL is wrong, every QR code you generate will point to the wrong address and customers will not be able to order.

### 9.1 Update the environment variable in Vercel

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_APP_URL` in the list
4. Click the edit icon next to it
5. Change the value to your new custom domain:
   - **Old value:** `https://your-project.vercel.app`
   - **New value:** `https://yourbeachbar.com` (use your actual domain, with `https://`, no trailing slash)
6. Click **"Save"**

### 9.2 Trigger a new deployment

Changing an environment variable does not automatically rebuild the app. You must trigger a redeploy:

1. Click the **"Deployments"** tab in Vercel
2. Find the most recent deployment (should say "Ready" with a green dot)
3. Click the three-dot menu (`...`) on the right side of that deployment
4. Click **"Redeploy"**
5. In the popup, click **"Redeploy"** to confirm
6. Wait 1–2 minutes for it to finish — you will see a new "Ready" entry at the top of the list

### 9.3 Why QR codes must be generated after this step

Inside your app, every time a QR code is generated, it creates a URL like:

```
https://yourbeachbar.com/1234/A1
```

The domain part comes directly from `NEXT_PUBLIC_APP_URL`. If you generate QR codes before setting this correctly, they will embed the wrong URL and will not work.

**Always complete Steps 8 and 9 before generating QR codes for your real tables.**

If you already generated QR codes with the wrong URL, go to the Client Dashboard → QR Codes, delete them, and generate new ones — the new ones will have the correct URL.

---

## Step 10: Smoke Test — Is Everything Working?

A "smoke test" means checking all the key parts of the app to make sure nothing is obviously broken. Open your browser and go through this checklist.

Replace `yourbeachbar.com` with your actual domain throughout.

### Public pages (no login needed)
- [ ] `https://yourbeachbar.com` — Does the homepage load?
- [ ] `https://yourbeachbar.com/1234/A1` — Does the demo customer menu load with sample items (Mojito, beers, snacks)?
- [ ] `https://yourbeachbar.com/login` — Does the client login page load?
- [ ] `https://yourbeachbar.com/admin/login` — Does the admin login page load?

### Admin portal
- [ ] Log in at `/admin/login` with `admin@beachbarmenu.com` / `Admin123!@#`
- [ ] Can you see the client list?
- [ ] Can you create a new test client from the admin panel?

### Client dashboard
- [ ] Log in at `/login` with `demo@beachbar.com` / `Beach2024!@`
- [ ] Can you see the dashboard with order statistics?
- [ ] Go to **"Menu"** — can you see the sample items?
- [ ] Go to **"QR Codes"** — generate a QR code for a table
- [ ] Click on the generated QR code — does the URL inside it show `https://yourbeachbar.com/...` and **not** `localhost` or `vercel.app`?

### Staff portal
- [ ] Log in at the staff URL shown in your seed output (e.g., `/staff/abc123.../login`)
- [ ] Enter the password `Staff1`
- [ ] Can you see the orders panel?

### Place a test order end-to-end
- [ ] Go to `https://yourbeachbar.com/1234/A1` (the demo customer menu)
- [ ] Add an item to the cart and submit an order
- [ ] In the staff portal — does the new order appear?
- [ ] In the client dashboard under "Orders" — does the new order appear?

### Security
- [ ] Does the site show a padlock icon in the browser address bar (HTTPS)?
- [ ] If you type `http://yourbeachbar.com` (without the `s`), does it redirect to `https://`?

### If something does not work

See the [Troubleshooting](#troubleshooting-deployment-problems) section below.

---

## Step 11: Set Up Stripe Payments (Optional)

By default, your app works as an ordering system without processing card payments — customers order and pay staff directly in cash or by card reader. If you want the app to accept card payments online, you can connect Stripe.

> **Note:** This step requires completing business identity verification with Stripe. Allow extra time for this process.

### 11.1 Create a Stripe account

1. Go to: **https://stripe.com**
2. Click **"Start now"**
3. Create an account with your business email
4. Complete their business verification process (they require identity and business documents for accounts that process real payments)

### 11.2 Get your API keys

1. In the Stripe Dashboard, click **"Developers"** (top right) → **"API keys"**
2. You will see two keys:
   - **Publishable key** — starts with `pk_live_...` (safe to embed in the browser)
   - **Secret key** — starts with `sk_live_...` (keep this private!)
3. Copy both keys

> **Test mode vs. Live mode:** Stripe starts in "Test mode". Use test keys (`pk_test_...` and `sk_test_...`) while testing. To test payments without a real card, use card number `4242 4242 4242 4242` with any future expiry date and any 3-digit CVC. Switch to live keys only when ready to take real payments from customers.

### 11.3 Set up a webhook

Webhooks let Stripe notify your app when a payment is completed.

1. In Stripe Dashboard → **"Developers"** → **"Webhooks"**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://yourbeachbar.com/api/webhooks/stripe
   ```
4. Under "Select events", add:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. After saving, click on the new endpoint and find the **"Signing secret"** — copy it (starts with `whsec_...`)

### 11.4 Add keys to Vercel

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add these three variables:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for testing) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (or `pk_test_...` for testing) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

3. Redeploy following the same process as Step 9.2

> **How does payment work?** This app uses Stripe Connect — each beach bar that wants to accept card payments connects their own Stripe account. From the Client Dashboard → Settings, there is a "Connect Stripe" button. After completing the Stripe onboarding, payments from customers go directly to the bar's Stripe account. The platform takes a small automatic fee.

---

## Updating the App in the Future

When you make changes to your code and want to push them live:

1. Test the changes locally:
   ```
   npm run dev
   ```

2. Confirm the production build has no errors:
   ```
   npm run build
   ```

3. Push to GitHub:
   ```
   git add .
   git commit -m "Describe what you changed"
   git push origin master
   ```

4. Vercel automatically detects the push and redeploys within 1–2 minutes. Check the Vercel dashboard to confirm the new deployment succeeded.

### If you change the database structure

If any changes you make include updates to `prisma/schema.prisma`, run this after deploying:

```
vercel env pull .env.production.local
npx dotenv -e .env.production.local -- npx prisma db push
rm .env.production.local
```

This adds new tables or columns without deleting any existing data.

---

## Troubleshooting Deployment Problems

### Build failed on Vercel — "Type error" or "Module not found"

A code error is preventing the build from completing.

**Fix:** Click the failed deployment in Vercel and read the build log to find the error message. Run `npm run build` locally on your computer to reproduce and fix the error, then push the fix to GitHub.

---

### App is live but shows "Application error: a client-side exception has occurred"

This usually means a required environment variable is missing.

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Make sure all required variables are present — especially `DATABASE_URL` and `JWT_SECRET`
3. Redeploy after making any changes

---

### "PrismaClientInitializationError" or "database connection refused"

The app cannot connect to the database.

**Fix:**
1. Check that your `DATABASE_URL` in Vercel is the correct Neon connection string
2. Make sure it ends with `?sslmode=require`
3. Log in to Neon (console.neon.tech) and verify the project is active

> **Note:** Free Neon projects can go to "sleep" after a period of inactivity. They wake up automatically on the first request, which may cause the very first visit after a quiet period to be slow (5–10 seconds). This is normal on the free plan.

---

### QR codes contain `localhost` or the old Vercel URL instead of my domain

You generated QR codes before completing Step 9.

**Fix:** Follow Step 9 again to update `NEXT_PUBLIC_APP_URL` to your real domain and redeploy. Then go to the Client Dashboard → QR Codes, delete all existing QR codes, and generate new ones.

---

### My domain shows "This site can't be reached" for more than 1 hour

DNS has not propagated yet, or the DNS records are wrong.

**Fix:**
1. Go to **https://dnschecker.org** and enter your domain name
2. Check if the A record shows `76.76.21.21` (Vercel's IP)
3. If not, double-check the DNS records you entered at your registrar
4. If it has been more than 48 hours, contact your domain registrar's support team

---

### "Scan Menu" shows an error when uploading a menu photo

The `ANTHROPIC_API_KEY` is missing or invalid.

**Fix:**
1. Check the key is correctly set in Vercel environment variables (Settings → Environment Variables)
2. Confirm the key is active in the Anthropic console (console.anthropic.com)
3. Check your Anthropic account has a valid payment method and available credit

---

### Stripe payments are not working

**Fix:**
1. Confirm all three Stripe environment variables are set in Vercel and that you redeployed after adding them
2. Make sure you are using matching keys — either all test keys or all live keys (do not mix them)
3. Confirm the webhook URL in Stripe Dashboard matches your production domain exactly: `https://yourbeachbar.com/api/webhooks/stripe`
4. In Stripe Dashboard → Developers → Webhooks, check the "Recent deliveries" tab for error details

---

## Quick Reference

Replace `yourbeachbar.com` with your actual domain.

### Production URLs

| What | URL |
|------|-----|
| Homepage | `https://yourbeachbar.com` |
| Admin Login | `https://yourbeachbar.com/admin/login` |
| Client Login | `https://yourbeachbar.com/login` |
| Staff Portal | `https://yourbeachbar.com/staff/[token]/login` |
| Customer Menu | `https://yourbeachbar.com/[clientId]/[tableId]` |
| Demo Customer Menu | `https://yourbeachbar.com/1234/A1` |

### External Service Dashboards

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Neon Database | https://console.neon.tech |
| Anthropic Console | https://console.anthropic.com |
| Stripe Dashboard | https://dashboard.stripe.com |

### Default Credentials Created by Seed

> Change all of these after your first login!

| Portal | Email | Password |
|--------|-------|----------|
| Admin | `admin@beachbarmenu.com` | `Admin123!@#` |
| Demo Client | `demo@beachbar.com` | `Beach2024!@` |
| Staff | (no email — use the staff portal URL) | `Staff1` |

### Required Environment Variables

| Variable | Required? | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | Yes | Full Neon PostgreSQL connection string including `?sslmode=require` |
| `JWT_SECRET` | Yes | 64+ character random string for signing login sessions |
| `NEXT_PUBLIC_APP_URL` | Yes | Your production domain with `https://` — no trailing slash |
| `ANTHROPIC_API_KEY` | For Scan Menu feature | API key from console.anthropic.com |
| `ENABLE_HSTS` | Yes | Set to the string `true` to enforce HTTPS |
| `STRIPE_SECRET_KEY` | Only for card payments | From Stripe Dashboard → Developers → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | Only for card payments | From Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Only for card payments | From Stripe Dashboard → Developers → Webhooks |

### Useful Commands

| What you want to do | Command |
|---------------------|---------|
| Deploy code changes | `git add . && git commit -m "message" && git push origin master` |
| Apply database changes | `vercel env pull .env.production.local && npx dotenv -e .env.production.local -- npx prisma db push && rm .env.production.local` |
| Re-run database seed | `vercel env pull .env.production.local && npx dotenv -e .env.production.local -- npm run db:seed && rm .env.production.local` |
| Build locally to check for errors | `npm run build` |
| Start local development | `npm run dev` |

---

Good luck with your launch! If you follow each step carefully, your app will be live, secure, and ready for your first customers.
