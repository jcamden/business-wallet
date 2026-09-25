# Getting Started

## Installation

### From Community plugins

Business Wallet is not yet listed in Obsidian's community plugins. Use BRAT or manual install below.

### BRAT (beta)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs beta plugins directly from GitHub and keeps them updated.

1. Install the **BRAT** plugin from **Settings → Community plugins → Browse** and enable it
2. Run **BRAT: Add a beta plugin for testing** from the Command Palette
3. Enter the repository: `jcamden/business-wallet`
4. Enable **Business Wallet** in **Settings → Community plugins**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/jcamden/business-wallet/releases/latest)
2. Create the folder `<your-vault>/.obsidian/plugins/business-wallet/`
3. Copy the three files into that folder
4. Open Obsidian → **Settings → Community plugins** → enable **Business Wallet**

---

## First-Time Setup

### Step 1 — Add your accounts

Go to **Settings → Business Wallet → Active Accounts** and click **Add Account**.

For each account you have, add an entry with:

- **Name** — any label you want (e.g. `Cash`, `HSBC Savings`, `Visa Platinum`)
- **Type** — `Cash`, `Bank`, or `Credit Card`
- **Initial Balance** — your current balance (for credit cards, enter your current outstanding debt as a positive number, e.g. `3000` means you owe 3,000)

> **Tip:** Add all accounts before logging any transactions, so balances are calculated correctly from the start.

![Add account form in Settings](/settings-add-account.png)

### Step 2 — Set a default account

In **Settings → Business Wallet → General**, choose which account should be pre-selected when you open the Add Transaction form.

### Step 3 — Log your first transaction

Click the **Business Wallet icon** in the left ribbon to open the Business Overview, then press **+ Add Transaction**. You can also run `Business Wallet: Add transaction` from the Command Palette (`Cmd+P`).

Fill in:
- **Type** — Expense, Income, or Transfer
- **Date** — defaults to today
- **Account** — which account to record against
- **Category** — choose from the list or leave blank
- **Note** — optional description
- **Tags** — optional labels; on mobile, tap the tag row to open the picker
- **Amount** — on mobile, tapping the field opens a calculator sheet with numpad, `00`, ⌫, and a formula bar in the title; press **Done** to commit the value

Press **Confirm** to save.

<img src="/transaction-modal.png" alt="Add transaction form" width="560" />

> Using Business Wallet on a phone? See [Mobile entry](./transactions#mobile-entry) for bottom-sheet pickers and the calculator.

---

## Command palette

All commands are available via `Cmd+P` (or `Ctrl+P` on Windows / Linux):

| Command | Action |
|---------|--------|
| `Business Wallet: Open business overview` | Open the dashboard |
| `Business Wallet: Open transactions` | Open the transactions view |
| `Business Wallet: Open assets` | Open the assets view |
| `Business Wallet: Add transaction` | Open the transaction form directly |
| `Business Wallet: Refresh views` | Refresh all open Business Wallet views |
| `Business Wallet: Validate data` | Scan all wallet files for frontmatter / orphan-wallet issues |
| `Business Wallet: Open settings` | Open Obsidian Settings on the Business Wallet tab |

---

## Where data is stored

Business Wallet creates:

```
<vault>/
├── .business-wallet.json     ← your config (accounts, categories, settings)
└── BusinessWallet/           ← one .md file per month
    ├── 2026-04.md
    └── 2026-03.md
```

The folder name (`BusinessWallet` by default) can be changed in Settings. See [Data Format](./data-format) for details on the file structure.
