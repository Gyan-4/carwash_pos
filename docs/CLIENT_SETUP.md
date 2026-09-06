# Client Setup Guide

Use this guide when installing the Carwash POS for a new client.

## 1. Before installation

Confirm the client has:

- A Windows PC or laptop for the POS
- A stable local internet connection
- A supported receipt printer if printed receipts are required
- A MongoDB Atlas production database prepared for the deployment
- A Vercel project connected to the production repository
- Final service prices, store details, payment methods, and promo rules
- At least one manager and one cashier account plan

Do not use development credentials or test database credentials in production.

## 2. Production environment

Configure these Vercel production environment variables:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?retryWrites=true&w=majority
CASHIER_PIN=CLIENT_CASHIER_PIN
MANAGER_PIN=CLIENT_MANAGER_PIN
```

The PIN values are used by the initial account seed process. They must be replaced with client-specific values before handover.

Never commit `.env.local`, production connection strings, or passwords to GitHub.

## 3. Initial account setup

After the environment is ready, run the initial account seed with the production-safe credentials:

```bash
pnpm seed:auth
```

Then sign in as manager and create the additional cashier accounts required by the business.

Verify that inactive accounts cannot sign in and that wrong PIN attempts trigger the configured lockout behavior.

## 4. Business settings

Open **Settings** and configure:

- Store/business name
- Address
- Contact information
- Receipt footer message
- Enabled payment methods
- Promo settings
- Physical loyalty stamp settings

The loyalty program is physical-card based. The POS does not replace the client's paper loyalty card with digital stamp tracking.

## 5. Services and pricing

Verify the final service catalog against the client's approved price list before the first live sale.

Check:

- Regular packages
- Premium packages
- Individual services
- Motorcycle services
- Vehicle-size pricing
- Package/service conflicts
- Disabled or unavailable services

Complete at least one test order for each major vehicle category used by the client.

## 6. Inventory

Enter the client's actual consumable inventory and opening quantities.

For each item verify:

- Item name
- Unit
- Quantity on hand
- Reorder/low-stock threshold
- Active status
- Usage deduction configuration where applicable

Perform one controlled sale and confirm inventory deduction is recorded correctly.

## 7. Promotions

Create and verify the client's active promos in **Promos**.

For every promo confirm:

- Active/inactive status
- Date range, when applicable
- Vehicle restrictions
- Required verification
- Rider platform restrictions, when applicable
- Discount behavior

Do not create duplicate promotions that can accidentally stack.

## 8. Receipt printer

Install the receipt printer driver on the production cashier PC.

Print a real test receipt and verify:

- Store name
- Address/contact
- Transaction number
- Date/time
- Vehicle details
- Services
- Discounts
- Payment method
- Amount paid
- Change
- Receipt footer

## 9. Final business validation

Before handover, the client or authorized manager should approve:

- Service prices
- Payment methods
- Promo rules
- Inventory opening quantities
- Employee accounts
- Store information
- Receipt layout

Record the approval date in the go-live checklist.

## 10. Handover information

Keep a private record containing the production Vercel project, MongoDB Atlas cluster, production domain, backup policy, responsible administrator, and support contact.

Do not place passwords or the full MongoDB connection string in this document or in GitHub.