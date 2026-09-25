# Business Wallet

A business bookkeeping plugin for [Obsidian](https://obsidian.md), based on the original personal-finance project. Transactions stay in plain Markdown tables while the primary view reports revenue, operating expenses, owner equity, cash, and bookkeeping health correctly for a small business.

## Business overview

The overview defaults to **All time** and also supports **Year to date**, **This month**, **Prior month**, and a native custom date range.

Headline figures:

- Sales revenue
- Business expenses
- Profit or loss
- Business cash
- Owner funding
- Owner draws

Owner contributions and draws are excluded from profit. Owner-paid costs remain business expenses and owner funding, but do not affect balances for business bank accounts.

The overview also includes:

- Funding source / expenses by payer
- Expenses by category and provider-derived vendor
- Monthly revenue versus expenses
- Cumulative profit/loss and owner funding over time
- Transactions needing review or receipts
- Unreconciled bank transactions and latest statement
- Duplicate `src-*` source warnings

Runway is intentionally deferred until the ledger contains several representative operating months.

## Business classifications

| Record | Business treatment |
| --- | --- |
| Sales revenue | Revenue |
| Owner contribution | Equity, not revenue |
| Refund | Reduces expenses |
| Ordinary expense | Business expense |
| Owner-paid expense | Expense plus owner funding |
| Owner draw | Equity withdrawal, not expense |
| Transfer | Neither revenue nor expense |

The plugin derives these distinctions from the existing category, wallet, and tag fields; no Markdown column was added. Vendor names initially come from tags such as `provider-openai`.

## Transaction conventions

- Owner contribution: income category `Owner contribution` and tag `owner-contribution`
- Owner draw: expense category `Owner draw` and tag `owner-draw`
- Owner-paid expense: ordinary expense in `Owner-paid business expenses`, tagged `owner-paid` and `owner-contribution`
- Reimbursed owner expense: add `reimbursed-owner` or `owner-reimbursed`
- Bank reconciliation: add a `stmt-*` tag
- Imported-source identity: add a stable `src-*` tag
- Receipt: link it in the note with an Obsidian wikilink, or add a `receipt-*` tag
- Review queue: use category `Needs review` or tag `needs-review`

## Data format

Business Wallet preserves the fork's 10-column monthly Markdown format:

```markdown
---
income: 100.00
expense: 25.00
netAsset: 0
---

## 2026-09

| Date | Type | Wallet | From | To | Category | Note | Tags | Amount | CreatedAt |
|------|------|--------|------|----|----------|------|------|--------|-----------|
| 09/01 | income | US Bank checking | - | - | Sales revenue | Client payment | src-ab12,stmt-2026-09 | 100.00 | 2026-09-01T12:00:00.000Z |
```

New installations use `.business-wallet.json` and the `BusinessWallet/` folder. Existing `.penny-wallet.json` files remain readable so established vaults can move to this fork without rewriting their transaction files.

## Development

```bash
npm ci
npm test
npm run lint
npm run lint:css
npm run lint:i18n
npm run build
```

## License

[MIT](LICENSE)
