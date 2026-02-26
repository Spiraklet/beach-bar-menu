# Beach Bar Menu

A digital menu and ordering system for beach bars and restaurants. Customers scan a QR code at their table, browse the menu, and place orders directly from their phone.

## Key Features

- **QR Code Ordering** - Customers scan a QR code at their table to view the menu and place orders
- **Real-time Order Management** - Staff see new orders instantly with sound notifications
- **Menu Management** - Add, edit, and organize menu items with categories and customization options
- **OCR Menu Scanning** - Upload a photo of your existing menu to automatically extract items
- **Staff Portal** - Dedicated interface for waiters/kitchen to manage orders and item availability
- **Order Grouping** - Orders grouped by table for efficient service
- **Sales Analysis** - View daily order statistics and revenue reports
- **Multi-language Support** - Customer menu available in English and Greek

---

## Table of Contents

1. [What You Need Before Starting](#what-you-need-before-starting)
2. [Step 1: Install Node.js](#step-1-install-nodejs)
3. [Step 2: Install PostgreSQL Database](#step-2-install-postgresql-database)
4. [Step 3: Download the Project Files](#step-3-download-the-project-files)
5. [Step 4: Install Project Dependencies](#step-4-install-project-dependencies)
6. [Step 5: Set Up Environment Variables](#step-5-set-up-environment-variables)
7. [Step 6: Set Up the Database](#step-6-set-up-the-database)
8. [Step 7: Run the Application](#step-7-run-the-application)
9. [How to Use the Application](#how-to-use-the-application)
10. [Stopping the Application](#stopping-the-application)
11. [Troubleshooting Common Problems](#troubleshooting-common-problems)

---

## What You Need Before Starting

You will need to install two things on your computer:
- **Node.js** - This runs the application
- **PostgreSQL** - This is the database that stores all your data

Don't worry if you don't know what these are - just follow the steps below!

---

## Step 1: Install Node.js

Node.js is what runs our application. Here's how to install it:

### On Mac:

1. Open your web browser and go to: https://nodejs.org/
2. Click the big green button that says **"LTS"** (this means Long Term Support - the stable version)
3. A file will download. Double-click it to open
4. Follow the installation wizard - just click "Continue" and "Agree" until it finishes
5. When it's done, you need to verify it worked:
   - Open the **Terminal** app (you can find it by pressing `Cmd + Space` and typing "Terminal")
   - Type this command and press Enter:
     ```
     node --version
     ```
   - You should see something like `v20.x.x` or `v22.x.x`. If you see a version number, it worked!

### On Windows:

1. Open your web browser and go to: https://nodejs.org/
2. Click the big green button that says **"LTS"**
3. A file will download. Double-click it to open
4. Follow the installation wizard - click "Next" and accept the defaults
5. **Important**: Make sure to check the box that says "Automatically install the necessary tools" if it appears
6. When it's done, verify it worked:
   - Press `Windows Key + R`, type `cmd`, and press Enter
   - Type this command and press Enter:
     ```
     node --version
     ```
   - You should see a version number like `v20.x.x`

---

## Step 2: Install PostgreSQL Database

PostgreSQL (often called "Postgres") is our database - it stores all the menu items, orders, and customer information.

### On Mac:

**Option A: Using Homebrew (Recommended if you have it)**

If you have Homebrew installed, open Terminal and run:
```
brew install postgresql@15
brew services start postgresql@15
```

**Option B: Using the Installer**

1. Go to: https://www.postgresql.org/download/macosx/
2. Click on "Download the installer" under Interactive Installer by EDB
3. Download the latest version (15 or higher)
4. Double-click the downloaded file and follow the installer
5. **Important**: When asked to set a password, use something simple you'll remember (like `postgres`). Write this down!
6. Keep the default port as `5432`
7. Finish the installation

### On Windows:

1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Choose the latest version (15 or higher) for Windows x86-64
4. Run the downloaded installer
5. Click "Next" through the options, keeping defaults
6. **Important**: When asked to set a password, use something simple (like `postgres`). Write this down!
7. Keep the default port as `5432`
8. Finish the installation

### Create the Database

After PostgreSQL is installed, you need to create a database for our application:

**On Mac:**
```
createdb beach_bar_menu
```

If that doesn't work, try:
```
psql -U postgres -c "CREATE DATABASE beach_bar_menu;"
```

**On Windows:**
1. Open "SQL Shell (psql)" from your Start menu
2. Press Enter for all the defaults until it asks for a password
3. Enter the password you set during installation
4. Type this and press Enter:
   ```
   CREATE DATABASE beach_bar_menu;
   ```
5. Type `\q` and press Enter to exit

---

## Step 3: Download the Project Files

If you're reading this, you probably already have the project files. If not:

1. Go to the GitHub repository
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file to a location you'll remember (like your Desktop or Documents folder)

---

## Step 4: Install Project Dependencies

Now we need to install all the code libraries that our project depends on.

1. Open **Terminal** (Mac) or **Command Prompt** (Windows)

2. Navigate to the project folder. For example, if you put it on your Desktop:

   **Mac:**
   ```
   cd ~/Desktop/beach-bar-menu
   ```

   **Windows:**
   ```
   cd C:\Users\YourName\Desktop\beach-bar-menu
   ```

   (Replace `YourName` with your actual Windows username)

3. Run this command to install everything:
   ```
   npm install
   ```

   This will take a minute or two. You'll see a lot of text scrolling by - that's normal! Wait until you see the command prompt again.

---

## Step 5: Set Up Environment Variables

Environment variables are settings that the application needs to run. We need to create a file to store these.

1. In the project folder, create a new file called `.env` (yes, it starts with a dot)

   **Mac:** In Terminal, while in the project folder:
   ```
   touch .env
   ```

   **Windows:** In Command Prompt:
   ```
   type nul > .env
   ```

2. Open this `.env` file with any text editor (TextEdit on Mac, Notepad on Windows)

3. Copy and paste the following into the file:

   ```
   # Database Connection
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/beach_bar_menu"

   # Authentication Secret (change this to any random string)
   JWT_SECRET="your-super-secret-key-change-this-to-something-random-and-long"

   # Stripe (for payments - leave blank for now if not set up)
   STRIPE_SECRET_KEY=""
   STRIPE_PUBLISHABLE_KEY=""
   STRIPE_WEBHOOK_SECRET=""

   # Application URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Important**: Replace `YOUR_PASSWORD` with the PostgreSQL password you set during installation (e.g., `postgres`)

   For example, if your password was `postgres`, the line should look like:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beach_bar_menu"
   ```

5. Save the file

---

## Step 6: Set Up the Database

Now we need to create the database tables and add some sample data.

1. Make sure you're in the project folder in Terminal/Command Prompt

2. Run this command to create the database tables:
   ```
   npm run db:push
   ```

   You should see output saying the database has been synced.

3. Run this command to add sample data (demo accounts and menu items):
   ```
   npm run db:seed
   ```

   You should see output like this:
   ```
   Admin created: admin@beachbarmenu.com
   Admin password: Admin123!@#
   Client created: demo@beachbar.com
   Client ID: 1234
   Client password: 123456
   ```

   **Save these login details!** You'll need them to access the application.

---

## Step 7: Run the Application

You're almost there! Now let's start the application.

1. In Terminal/Command Prompt (still in the project folder), run:
   ```
   npm run dev
   ```

2. Wait for a message that says something like:
   ```
   ▲ Next.js 14.x.x
   - Local: http://localhost:3000
   ```

3. Open your web browser and go to: **http://localhost:3000**

4. You should see the Beach Bar Menu homepage!

---

## How to Use the Application

### Admin Panel (for managing all clients/businesses)
- **URL**: http://localhost:3000/admin/login
- **Email**: `admin@beachbarmenu.com`
- **Password**: `Admin123!@#`

The admin can create and manage beach bar/restaurant accounts.

### Client Dashboard (for beach bar owners)
- **URL**: http://localhost:3000/login
- **Email**: `demo@beachbar.com`
- **Password**: `123456`

As a client (beach bar owner), you can:
- Manage your menu items
- View incoming orders
- Generate QR codes for tables
- Update your business settings

### Staff Portal (for waiters and kitchen staff)
- **URL**: http://localhost:3000/staff/[token]/orders
- **PIN**: Set up in Client Dashboard → Staff Settings

The staff portal allows employees to:
- View and manage incoming orders in real-time
- Mark orders as Preparing → Ready → Completed
- See orders grouped by table for easy service
- Toggle menu item availability (mark items as unavailable)
- Hide items from the customer menu temporarily

To set up the staff portal:
1. Log in to the Client Dashboard
2. Go to "Staff" in the sidebar
3. Set a 6-digit PIN for staff access
4. Share the staff portal link with your employees

### Customer Menu (what customers see)
- **URL**: http://localhost:3000/1234/A1

This is what customers see when they scan a QR code. The URL format is:
- `1234` = The client/business ID
- `A1` = The table identifier

Customers can browse the menu and place orders from here.

---

## Feature Guide

### Scanning a Menu to Add Items (OCR)

Instead of typing every menu item manually, you can upload a photo of your existing menu:

1. Log in to the Client Dashboard
2. Go to "Menu" in the sidebar
3. Click the **"Scan Menu"** button
4. Upload a clear photo of your printed menu (PNG, JPG, or PDF)
5. Wait for the system to extract the items (this may take 30-60 seconds)
6. Review and edit the extracted items - fix any mistakes
7. Click "Import" to add all items to your menu

**Tips for best results:**
- Use a clear, high-resolution photo
- Make sure the text is not blurry
- Take photos straight-on (not at an angle)
- Good lighting helps!

### Viewing Sales Analysis

Track your daily orders and revenue:

1. Log in to the Client Dashboard
2. Go to "Analysis" in the sidebar
3. View the table of daily statistics
4. Use the date range buttons (7 days, 30 days, 90 days) to filter
5. See totals at the bottom of the table

### Managing Item Availability (Staff Portal)

Staff can quickly mark items as unavailable when you run out:

1. Open the Staff Portal
2. Click the "Menu" tab at the top
3. Find the item that's out of stock
4. Toggle the "Available" switch OFF - customers will see "Not Available"
5. Toggle the "Visible" switch OFF to completely hide an item from the menu

---

## Stopping the Application

To stop the application:

1. Go to the Terminal/Command Prompt window where it's running
2. Press `Ctrl + C` (on both Mac and Windows)
3. The application will stop

---

## Troubleshooting Common Problems

### "command not found: node" or "node is not recognized"
Node.js isn't installed correctly. Go back to Step 1 and reinstall it. Make sure to restart your Terminal/Command Prompt after installation.

### "command not found: npm"
Same as above - npm comes with Node.js. Reinstall Node.js.

### Database connection error / "ECONNREFUSED"
PostgreSQL isn't running.

**Mac:**
```
brew services start postgresql@15
```
Or if you used the installer, open "pgAdmin" from your Applications and make sure the server is running.

**Windows:**
1. Press `Windows + R`, type `services.msc`, press Enter
2. Find "postgresql" in the list
3. Right-click it and select "Start"

### "database 'beach_bar_menu' does not exist"
You need to create the database. Go back to the "Create the Database" section in Step 2.

### "password authentication failed"
The password in your `.env` file doesn't match your PostgreSQL password. Double-check the `DATABASE_URL` in your `.env` file.

### "Port 3000 is already in use"
Something else is using port 3000. Either:
- Close the other application using that port
- Or change the port by running: `npm run dev -- -p 3001` (then use http://localhost:3001)

### The page loads but looks broken / no styles
Try stopping the app (`Ctrl + C`) and running it again with:
```
npm run dev
```

### "Module not found" errors
Run `npm install` again to make sure all dependencies are installed.

### Still having problems?
1. Make sure you're in the correct folder (the one containing `package.json`)
2. Try deleting the `node_modules` folder and running `npm install` again
3. Make sure PostgreSQL is running
4. Double-check your `.env` file has the correct database password

---

## Updating the Application

If you already have the application running and want to update to the latest version:

1. Stop the application (`Ctrl + C`)

2. Download/pull the latest code

3. Install any new dependencies:
   ```
   npm install
   ```

4. Update the database with new features:
   ```
   npm run db:push
   ```

5. Start the application again:
   ```
   npm run dev
   ```

**Note:** The `db:push` command will add new database fields without losing your existing data.

---

## Quick Reference Commands

| What you want to do | Command |
|---------------------|---------|
| Start the application | `npm run dev` |
| Stop the application | `Ctrl + C` |
| Install dependencies | `npm install` |
| Set up/update database | `npm run db:push` |
| Add sample data | `npm run db:seed` |
| View database visually | `npm run db:studio` |
| Run tests | `npm test` |
| Build for production | `npm run build` |

### Important URLs

| What | URL |
|------|-----|
| Customer Menu (example) | http://localhost:3000/1234/A1 |
| Client Login | http://localhost:3000/login |
| Admin Login | http://localhost:3000/admin/login |
| Staff Portal | http://localhost:3000/staff/[token]/orders |

---

## Setting Up Stripe Payments (Optional - For Later)

To enable real payments, you'll need a Stripe account:

1. Go to https://stripe.com and create an account
2. In the Stripe Dashboard, go to Developers → API Keys
3. Copy your keys and add them to your `.env` file:
   - `STRIPE_SECRET_KEY` = Your secret key (starts with `sk_`)
   - `STRIPE_PUBLISHABLE_KEY` = Your publishable key (starts with `pk_`)
4. For webhooks, you'll need to set up a webhook endpoint (this requires deploying to a public URL)

For now, the application will work without Stripe - payments just won't be processed.

---

Good luck! If you follow these steps carefully, you should have the application running on your computer.
