# Production Deployment Guide

## Architecture

The recommended production setup is:

- Next.js application deployed on Vercel
- MongoDB Atlas for the production database
- GitHub `main` as the release source
- HTTPS production domain
- Actual cashier PC and receipt printer for daily operation

## 1. Prepare MongoDB Atlas

Create or select the production cluster and database.

Use a dedicated production database user. Do not reuse development credentials.

Configure Atlas network access so the Vercel deployment can connect to MongoDB. Keep access limited to what the deployment requires.

Enable Atlas backups before go-live and document the retention policy. See `docs/DATABASE_BACKUP.md` for recovery guidance.

## 2. Prepare Vercel

Import the GitHub repository into Vercel and configure the production project.

Set these production environment variables:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?retryWrites=true&w=majority
CASHIER_PIN=CLIENT_CASHIER_PIN
MANAGER_PIN=CLIENT_MANAGER_PIN
```

Use client-specific credentials and never paste production secrets into source files, issues, screenshots, or documentation that will be shared.

## 3. Deploy

Deploy the current `main` branch through Vercel.

The repository includes CI checks for linting and the production build. A release should not proceed when those checks fail.

## 4. Verify the deployment

Check the public health endpoint:

```text
https://your-production-domain.example/api/health
```

A healthy deployment should report an OK status and a connected database. The endpoint is safe for uptime monitoring and does not expose the MongoDB connection string.

From a machine with the project dependencies installed, run:

```bash
APP_URL=https://your-production-domain.example pnpm production:check
```

For the strongest local release validation, run:

```bash
pnpm lint
pnpm build
pnpm preflight
```

`production:check` verifies the deployed health endpoint; it is not a replacement for POS acceptance testing.

## 5. First production login

Sign in using the client manager account first.

Confirm the manager can access Settings, User Management, Dashboard, Analytics, Transactions, Audit, Inventory, Promos, and Shift management.

Create or verify cashier accounts from the manager account.

## 6. Configure the business

Complete the configuration described in `docs/CLIENT_SETUP.md` before processing live customer transactions.

Never start live operations with placeholder store details, prices, PINs, or test inventory.

## 7. Deployment rollback

If a release causes a production issue:

1. Stop normal cashier use when the issue could affect transaction accuracy.
2. Identify the last known-good Vercel deployment.
3. Roll back to that deployment using Vercel's deployment controls.
4. Verify `/api/health`.
5. Perform a controlled manager test transaction.
6. Document the incident before resuming normal operations.

Do not restore an old database backup simply because an application deployment failed. Application rollback and database recovery are separate decisions.

## 8. Production security

Production secrets must exist only in the deployment environment or secure credential storage.

Rotate the MongoDB password immediately if it has been exposed. Do the same for any compromised client credential.

Keep GitHub repository access limited to authorized maintainers.

## 9. Release record

For every client production release, record privately:

- Deployment date/time
- Vercel deployment identifier
- Git commit SHA
- Production domain
- MongoDB Atlas cluster/database
- Backup status
- Person who approved the release
- Date of the next backup/restore review
