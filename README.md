# Carwash POS

A production-oriented carwash point-of-sale system built with Next.js, TypeScript, Tailwind CSS, MongoDB, and Mongoose.

## Core features

- Cashier and manager authentication with server-side sessions
- Cashier shift opening, cash-in/out, and shift closing
- POS checkout with server-side price validation
- Packages, individual services, promos, discounts, and payment validation
- Customer and vehicle history
- Inventory stock tracking and automatic usage deduction
- Active wash queue
- Transaction history, void/restore controls, and audit logs
- Analytics and dashboard reporting
- Configurable store details, receipt footer, payment methods, and promo settings

## Requirements

- Node.js 20+
- MongoDB database (MongoDB Atlas is recommended for hosted deployments)
- npm, pnpm, or another supported Node package manager

## Environment variables

Create `.env.local` for local development. Never commit real credentials.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?retryWrites=true&w=majority
CASHIER_PIN=CHANGE_ME
MANAGER_PIN=CHANGE_ME
```

Use strong production PINs and rotate any database credential that has been exposed.

## Local setup

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Validate the environment

Run the preflight check before testing or deploying:

```bash
pnpm preflight
```

For a general project check:

```bash
pnpm check
```

The preflight check verifies that required environment variables exist, PINs are exactly 4 digits, and placeholder/default values are not being used.

### Seed initial accounts

With `.env.local` configured:

```bash
pnpm seed:auth
```

The seed script creates or updates the initial cashier and manager accounts from the supplied PINs.

## Production deployment

The application can be deployed to Vercel with MongoDB Atlas.

1. Import the repository into Vercel.
2. Configure the production environment variable `MONGODB_URI` in the correct Vercel environment.
3. Use strong client-specific credentials for the initial cashier and manager setup.
4. Make sure the MongoDB Atlas network access rules allow the deployment environment to connect.
5. Run `pnpm check` locally against the final deployment configuration where practical.
6. Deploy and verify the application through the health endpoint:

```text
/api/health
```

A healthy response reports `status: ok` and `database: connected`. A database failure returns HTTP 503 without exposing database credentials.

### Verify the deployed application

After Vercel deployment, run:

```bash
APP_URL=https://your-production-domain.example pnpm production:check
```

This verifies that the production application is reachable and that `/api/health` reports a working database connection. It does not expose secrets and does not replace a full POS acceptance test.

For the complete release process, use `docs/GO_LIVE_CHECKLIST.md`.

## Client handover documentation

The repository includes production handover documentation:

- `docs/CLIENT_SETUP.md` — configure the POS for a new client, including accounts, business settings, services, inventory, promos, and receipt hardware.
- `docs/DEPLOYMENT.md` — deploy and verify Vercel + MongoDB Atlas production releases.
- `docs/USER_GUIDE.md` — cashier and manager operating procedures.
- `docs/GO_LIVE_CHECKLIST.md` — release, security, functional, hardware, and handover acceptance tests.
- `docs/DATABASE_BACKUP.md` — MongoDB Atlas backup and recovery procedure.

Use the go-live checklist as the final gate before real customer transactions.

## Client handover checklist

Before handing the system to a client:

- Replace all default/demo account PINs with client-specific credentials.
- Confirm store information, receipt footer, payment methods, service pricing, promos, and inventory rules.
- Create the required cashier and manager accounts.
- Test one complete sale for each enabled payment method.
- Open and close a cashier shift and verify cash reconciliation.
- Test queue status changes and inventory deduction.
- Test transaction void/restore and audit logging with a manager account.
- Configure MongoDB Atlas backups and confirm a recovery procedure.
- Run the production environment preflight and fix any configuration errors before handover.
- Run the deployed production health check.
- Confirm GitHub Actions CI is green for the final commit.
- Test the production deployment from the actual cashier device, receipt printer, and network.
- Keep a copy of the final production configuration and deployment notes for support.

## Health check

The endpoint `GET /api/health` checks application-to-database connectivity and is safe to use for uptime monitoring. It does not return the MongoDB connection string or other secrets.

## Production verification

The repository includes automated CI for linting and the production build on pushes and pull requests to `main`.

Available checks:

```bash
pnpm lint
pnpm build
pnpm preflight
APP_URL=https://your-production-domain.example pnpm production:check
```

A successful `pnpm build` verifies the application can be compiled for production. A successful `production:check` verifies the deployed application and database health endpoint. Both should pass before client handover.
