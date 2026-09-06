# Carwash POS User Guide

## Cashier workflow

### 1. Sign in

Select **Cashier** and enter your assigned PIN.

Cashiers must have an open shift before processing sales. If there is no active shift, the system redirects the cashier to Shift.

### 2. Open a shift

On **Shift**:

1. Enter the opening cash amount.
2. Confirm the amount.
3. Open the shift.

The opening cash should match the physical cash placed in the till.

### 3. Start a sale

Open **POS** and enter the vehicle information:

- Vehicle type
- Vehicle size
- Plate number
- Customer name, when available

Existing customer information may be found automatically from the plate number.

### 4. Select services

Choose packages or individual services that apply to the vehicle.

The POS keeps the current order when vehicle type or vehicle size is changed. Review the selected services after any change because pricing and availability can change with vehicle details.

Do not select a package and an individual service that would duplicate the same work unless the business intentionally allows it.

### 5. Apply promotions

Select an eligible promo when applicable. Follow the required verification shown by the POS.

The system validates promo eligibility again when the transaction is saved.

### 6. Take payment

Review the total before opening payment.

Enter the amount paid and select the enabled payment method.

For cash payments, verify the displayed change against the actual cash received.

### 7. Complete the transaction

Complete the sale once the customer has paid.

Avoid double-clicking the completion action. The transaction endpoint protects against duplicate submissions, but the cashier should still wait for the confirmation.

A completed sale creates the wash queue entry and applies the applicable inventory usage automatically.

### 8. Wash queue

Open **Queue** to monitor active vehicles.

Use the queue actions to start washing and mark completed work according to the shop's workflow.

### 9. Close the shift

At the end of the shift:

1. Go to **Shift**.
2. Count the physical cash.
3. Review cash-in and cash-out activity.
4. Compare actual cash with expected cash.
5. Enter the final cash amount and close the shift.

Report any variance to the manager.

## Manager workflow

Managers can operate the POS without opening a personal cashier shift, but should still follow the shop's cash-control procedures.

### Dashboard and analytics

Use **Dashboard** and **Analytics** to review sales activity and operational performance.

Use date filters and other available filters to investigate unusual activity or compare periods.

### Transactions

Use **Transactions** to search completed sales and inspect transaction details.

Managers can use the available void/restore controls when a transaction must be corrected. These actions should follow the business's approval policy.

### Audit

Use **Audit** to review recorded administrative and operational actions.

Audit records should be retained as part of the shop's operational history.

### Customers

Use **Customers** to review customer and vehicle records.

Removing a vehicle/customer record does not erase historical transaction records that have already been recorded.

### Inventory

Use **Inventory** to add items, update quantities, review stock history, and investigate low-stock conditions.

Restocks and adjustments should match a real physical movement or approved correction.

### Promos

Use **Promos** to create, edit, activate, or deactivate promotions.

Verify promo rules carefully before activation so discounts cannot be applied to unintended vehicles, services, dates, or riders.

### User Management

Use **User Management** to create and maintain cashier/manager accounts, deactivate accounts that should no longer sign in, and manage cashier lockout settings.

Do not share PINs between employees.

### Settings

Use **Settings** to maintain the shop's name, address, contact details, receipt footer, payment methods, and physical loyalty program configuration.

## Physical loyalty card

The shop's loyalty program uses a physical stamp card. The POS does not maintain digital stamp counts.

Current business rule:

- One qualifying wash earns one physical stamp.
- After 5 washes, the customer receives 30% off Package 1, 2, or 3.
- The 11th wash earns one free Package 2: Body Wash + Vacuum + Tire Black.

The printed loyalty card and the business's verification process remain the source of truth for stamp collection and redemption.

## Common situations

**Cashier cannot process a sale:** verify that the cashier has an open shift.

**A service is unavailable after changing vehicle size:** confirm the service is priced and enabled for the selected vehicle/size.

**A duplicate sale appears possible:** wait for the first completion response before trying again, then check Transactions.

**A payment method is missing:** ask the manager to verify that the payment method is enabled in Settings.

**Inventory looks incorrect:** stop making manual adjustments until the manager checks the inventory history and recent transactions.
