# Database Backup & Recovery

## Purpose

The POS stores operational data in MongoDB. Production deployment must have a tested backup and recovery process so transactions, shifts, customers, inventory, promos, and audit logs can be restored after an accidental deletion, database failure, or deployment mistake.

## Production backup policy

Use MongoDB Atlas backup features for the production database. Backups should be enabled before the system is handed to the client.

Recommended minimum policy:

- Continuous or scheduled production backups enabled in Atlas.
- Keep enough retention to cover at least the client's normal accounting/review cycle.
- Protect the Atlas account with a strong unique password and multi-factor authentication.
- Limit Atlas database access to authorized administrators only.
- Never store the MongoDB URI or database password in source control.
- Use separate production credentials from development/testing credentials.

## Before client handover

1. Confirm the Vercel production project uses the production MongoDB URI.
2. Confirm MongoDB Atlas has backups enabled for the production cluster.
3. Create a documented restore test using a non-production target.
4. Verify restored data includes transactions, shifts, customers, inventory, promos, and audit logs.
5. Record the date of the latest successful restore test.

## Recovery procedure

If production data is lost or corrupted:

1. Stop using the affected POS instance when continued writes could make recovery harder.
2. Identify the correct Atlas backup/snapshot from before the incident.
3. Restore into a separate recovery database or cluster first when practical.
4. Validate transaction totals, shift records, inventory quantities, customer records, and audit logs.
5. Point the deployment to the recovered database only after validation is complete.
6. Verify `/api/health` and perform a controlled POS test transaction.
7. Document the incident and recovery time for the client.

## Important operational rule

The application itself does not replace MongoDB backups. The `/api/health` endpoint only checks whether the application can connect to MongoDB; a successful health response does not mean a backup exists or that a restore has been tested.

## Security

Treat the MongoDB connection string as a secret. Do not commit `.env.local`, production environment files, database passwords, or full connection strings to GitHub.

For client handover, keep a private record of:

- Production Vercel project
- Production MongoDB Atlas cluster
- Database name
- Backup/retention policy
- Date of last restore test
- Responsible administrator/contact
