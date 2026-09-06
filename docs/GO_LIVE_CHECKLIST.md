# Carwash POS Go-Live Checklist

Use this checklist immediately before giving the production POS to a client.

## 1. Source and build

- [ ] `main` contains the final approved code.
- [ ] GitHub Actions CI is green for the final commit.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] No test/demo credentials are committed.

## 2. Environment and deployment

- [ ] Vercel Production has the correct `MONGODB_URI`.
- [ ] Production environment variables are configured only in Vercel or another secure secret store.
- [ ] Cashier and manager initial PINs are client-specific.
- [ ] `pnpm preflight` passes against the final environment.
- [ ] The deployed URL is using the intended production project.

## 3. Deployment health

Run:

```bash
APP_URL=https://your-production-domain.example pnpm production:check
```

The check must report:

- Application reachable
- `/api/health` returns HTTP success
- Application reports `status: ok`
- Application reports `database: connected`

The health endpoint is a connectivity check only; it does not prove backups or business workflows are correct.

## 4. Authentication

- [ ] Manager can sign in.
- [ ] Cashier can sign in.
- [ ] Invalid PIN is rejected.
- [ ] Repeated failed PIN attempts trigger the configured gradual lockout.
- [ ] Manager can reset a cashier lockout.
- [ ] Deactivated accounts cannot sign in.
- [ ] Logout ends the active session.
- [ ] Cashier is redirected to Shift when attempting protected cashier workflows without an open shift.

## 5. Cashier shift

- [ ] Cashier with no open shift is directed to the shift screen.
- [ ] Opening cash is recorded correctly.
- [ ] Cash-in works and requires a reason.
- [ ] Cash-out works, requires a reason, and cannot exceed available cash.
- [ ] Cash sales increase expected drawer cash.
- [ ] GCash/card sales do not increase physical drawer cash.
- [ ] Closing a shift records actual cash and variance.
- [ ] Shift history remains available for manager review.

## 6. POS sale

- [ ] Plate is required.
- [ ] Vehicle type and size behave correctly.
- [ ] Changing vehicle type/size does not clear the current order.
- [ ] Package selection does not silently add unselected extra services.
- [ ] Pricing matches the approved service catalog.
- [ ] Promo eligibility is enforced server-side.
- [ ] Required promo verification is enforced.
- [ ] Disabled payment methods cannot be used.
- [ ] Cash change is calculated correctly.
- [ ] GCash/card require exact payment.
- [ ] A repeated checkout request does not create a duplicate transaction.
- [ ] Successful sale creates the queue entry.
- [ ] Successful sale performs the expected inventory deduction.
- [ ] Insufficient inventory blocks the sale with a usable error message.
- [ ] Receipt output contains the approved business details and totals.

## 7. Inventory and queue

- [ ] Inventory restock works.
- [ ] Inventory adjustment/history is recorded for manager review.
- [ ] Low-stock indicators work.
- [ ] Queue entry appears as waiting after a successful sale.
- [ ] Queue status can move through washing to completed.
- [ ] Completed queue items are removed from the active queue view.

## 8. Management and records

- [ ] Customer/vehicle history is updated.
- [ ] Transaction history loads real production data.
- [ ] Void/restore requires manager access.
- [ ] Important administrative and transaction actions are auditable.
- [ ] Dashboard and analytics reflect completed transactions.
- [ ] Store information, receipt footer, payment methods, and promo settings are correct.
- [ ] User Management correctly creates, updates, deactivates, and resets cashier accounts.

## 9. Backup and recovery

- [ ] MongoDB Atlas production backups are enabled.
- [ ] Backup retention is documented.
- [ ] A restore test has been completed in a non-production environment.
- [ ] The restore test date is recorded.
- [ ] Recovery contact/responsible administrator is known.

See `docs/DATABASE_BACKUP.md` for the recovery procedure.

## 10. Failure and safety tests

- [ ] Invalid login is rejected without exposing system details.
- [ ] Database/API failure shows a friendly error instead of a blank or broken page.
- [ ] A duplicate checkout does not create duplicate records.
- [ ] Missing shift blocks cashier checkout.
- [ ] Insufficient cash prevents an invalid cash-out.
- [ ] Invalid promo verification blocks the discount.
- [ ] Invalid/unavailable service pricing prevents checkout.
- [ ] Deactivated users lose access.

## 11. Real hardware test

On the actual client workstation/tablet:

- [ ] Login works over the production network.
- [ ] POS remains usable at the intended screen size.
- [ ] Receipt printing works with the actual printer.
- [ ] Receipt formatting and paper size are correct.
- [ ] Cashier can complete an end-to-end test transaction.
- [ ] Network interruption shows a friendly failure instead of a broken screen.
- [ ] Reloading the app does not lose the authenticated session unexpectedly.
- [ ] Keyboard/mouse/touch input works as intended.

## 12. Handover

- [ ] Client manager PIN delivered securely.
- [ ] Client cashier PIN(s) delivered securely.
- [ ] Vercel ownership/access is documented.
- [ ] MongoDB Atlas ownership/access is documented.
- [ ] Backup/recovery responsibility is documented.
- [ ] Final production URL is documented.
- [ ] Final service prices and promos are confirmed with the client.
- [ ] Client setup guide provided.
- [ ] User guide provided.
- [ ] Deployment/recovery documentation provided.
- [ ] Support/contact procedure is documented.

## Final sign-off

Do not hand over the system until deployment health, CI/build, database backup verification, security checks, and the real hardware transaction test all pass.
