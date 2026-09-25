# Views

Business Wallet has three views. The **Business Overview** is the primary view; Transactions and Assets remain available from its header or the Command Palette.

---

## Business Overview

Open it by clicking the **Business Wallet icon** in the left ribbon, or run **Business Wallet: Open business overview** from the Command Palette.

![Finance overview](/finance-overview.png)

The header also contains two navigation buttons:
- **Transactions** — switch to the Transactions list view
- **Assets** — switch to the assets view
- **+ Add Transaction** — open the transaction form

### Period selector

The default is **All time**. You can also select **Year to date**, **This month**, **Prior month**, or a custom start and end date.

### Summary Metrics

| Metric | Description |
|--------|-------------|
| Sales revenue | Operating revenue; owner contributions and refunds are excluded |
| Business expenses | Ordinary and owner-paid expenses, net of refunds |
| Profit or loss | Sales revenue minus business expenses |
| Business cash | Included cash and bank account balances at the end of the period |
| Owner funding | Direct owner contributions plus owner-paid expenses |
| Owner draws | Equity withdrawals, excluded from expenses |

### Management breakdowns

- Funding source / expenses by payer
- Expenses by category
- Expenses by vendor, derived from `provider-*` tags
- Monthly revenue versus expenses
- Cumulative profit/loss and owner funding over time

### Bookkeeping health

The health panel counts review items, missing receipts, unreconciled bank transactions, and duplicate `src-*` identifiers, and shows the latest `stmt-*` statement tag.

---

## Transactions

A full list of all transactions for the selected month, with filters and subtotals.

![Transactions view](/transactions-view.png)

### Filters

- **Type pills** — multi-select: All / Expense / Income / Transfer (tap multiple to combine)
- **Wallet pills** — multi-select; pills are tinted per account so the active filter is visible at a glance
- **Category dropdown** — checklist of categories present in the filtered results; select any combination to narrow further
- **Keyword search** — filters transactions whose note contains the search text
- **Filter sheet (detail view)** — a shared header opens a sheet for picking account and date range; on mobile, the sheet backdrop covers the Obsidian toolbar so the sheet owns the screen

### Transaction Rows

Each row shows: date, type badge, category, note, account (or From → To for transfers), and amount.

On desktop, hover a row to reveal the **✏** edit action. On mobile, the edit affordance stays visible. Delete now lives inside the edit modal (a confirmation dialog appears before deletion). Refund expenses appear as positive expense reversals, visually distinct from income.

### Subtotals

A fixed bar at the bottom always shows **Expense Subtotal** and **Income Subtotal** for the currently filtered transactions. The list scrolls independently without affecting the header or subtotals.

---

## Assets

An assets-focused view for medium-term financial tracking. Open it from the **Assets** button in the Business Overview header, or run **Business Wallet: Open assets** from the Command Palette.

![Assets view](/asset-view.png)

### Range Selector

Choose **3 months**, **6 months**, or **12 months**.

### Account Balances

Shows the current running balance for each active account. Credit card balances are shown as negative values.

**Net Assets** at the bottom is the sum of all cash/bank balances minus all credit card debt.

### Cashflow Metrics

| Metric | Description |
|--------|-------------|
| Income | Total income within the selected range |
| Expense | Total expense within the selected range |
| Balance | Income minus Expense within the selected range |
| Savings Rate | `Balance / Income` (shown as 0% when income is 0) |

### Net Asset Trend Chart

A line chart showing your net asset over the selected range. Hover near a data point to see the value. Missing months (no data) create a gap in the line.

### Asset Allocation Pie

Appears when you have two or more active cash/bank accounts with positive balances. Shows the distribution of liquid assets across those accounts.
