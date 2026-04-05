# Household Finance App

A private, browser-based budgeting site for tracking household money using a four-bucket plan.

The app helps you:

- Track income and transactions by month.
- Auto-categorize spending into budget buckets.
- Monitor budget health and overspending risk.
- Plan and track savings goals.
- Review monthly reports and export transactions to CSV.

## What The Site Is For

This project is designed for people who want a lightweight finance dashboard without creating accounts or sending data to a server. It is especially useful for monthly planning with a fixed bucket strategy:

- Fixed Costs
- Investments
- Savings
- Guilt-Free Spending

Instead of only showing totals, the app compares actual spend against bucket targets and surfaces a budget health score so you can quickly see whether the month is on track.

## How The Site Works

## 1) App Architecture

- Frontend: React + Vite
- Routing: React Router
- Charts: Recharts
- Styling: Tailwind CSS
- State management: React Context + useReducer
- Persistence: browser localStorage

At startup, the app initializes state in [frontend/src/context/FinanceContext.jsx](frontend/src/context/FinanceContext.jsx):

- Reads settings, transactions, and goals from localStorage.
- Migrates legacy settings shape if needed.
- Falls back to seeded demo transactions when no data exists yet.

Global state is then provided to all pages through `FinanceProvider`.

## 2) Data Model

The app stores three main datasets:

- Settings
  - `currency`
  - `monthlyIncomes` keyed by month (`YYYY-MM`)
  - `bucketTargets` as percentages
- Transactions
  - `id`, `date`, `amount`, `description`, `category`, `bucket`, `type`
- Goals
  - `id`, `name`, `targetAmount`, `currentAmount`, `targetDate`, `bucket`

Local storage keys:

- `hft_settings`
- `hft_transactions`
- `hft_goals`

## 3) Monthly Income Behavior

Income is stored per month. If a month has no explicit income entry, the app falls back to the most recent prior month that does have one. This keeps budget calculations usable month to month without forcing re-entry every time.

## 4) Transaction Entry And Auto-Bucketing

When adding an expense in [frontend/src/components/TransactionForm.jsx](frontend/src/components/TransactionForm.jsx), the description is matched against keyword sets in [frontend/src/utils/budgetHelpers.js](frontend/src/utils/budgetHelpers.js) to suggest a bucket automatically (for example, rent or groceries -> Fixed Costs).

You can still override the bucket manually before saving.

## 5) Dashboard Calculations

The dashboard in [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx) computes:

- Monthly spend (expenses only for selected month)
- Remaining amount (`income - spend`)
- Per-bucket actual vs target amount and percentage
- Per-bucket status:
  - `good` when actual <= target
  - `warn` when actual <= 110% of target
  - `danger` otherwise

Health score logic (0 to 100) is implemented in [frontend/src/utils/budgetHelpers.js](frontend/src/utils/budgetHelpers.js). Conceptually:

$$
\text{bucket score} = \max\left(0, 25 - 25 \cdot \frac{|\text{actual}\% - \text{target}\%|}{\max(\text{target}\%, 1)}\right)
$$

The total health score is the sum of all bucket scores, clamped to $[0, 100]$.

## 6) Goals Tracking

On [frontend/src/pages/Goals.jsx](frontend/src/pages/Goals.jsx), goals track progress percentage:

$$
\text{progress}\% = \frac{\text{currentAmount}}{\text{targetAmount}} \times 100
$$

Projected completion date uses:

- Remaining amount = `targetAmount - currentAmount`
- Monthly contribution estimate derived from current month income and bucket target
- Months to complete = `ceil(remaining / monthlyContribution)`

Displayed as an estimated month/year when possible.

## 7) Reports And Export

[frontend/src/pages/Reports.jsx](frontend/src/pages/Reports.jsx) groups expenses by month and bucket, then renders a multi-series bar chart for trend comparison.

CSV export in [frontend/src/utils/csvExport.js](frontend/src/utils/csvExport.js):

- Escapes values safely for CSV format.
- Generates a file in-browser (`transactions-report.csv` by default).

## Pages Overview

- Dashboard: monthly snapshot, health score, bucket breakdown, and spend visualization.
- Transactions: create/edit/delete transactions, filter by bucket/month, and search.
- Goals: create/edit/delete goals and monitor completion progress.
- Reports: month-over-month bucket chart and CSV export.

## Getting Started

## Prerequisites

- Node.js 20+ recommended
- npm

## Install

From repository root:

```bash
npm run install:frontend
```

## Run In Development

From repository root:

```bash
npm run dev
```

The dev server is provided by Vite (usually at `http://localhost:5173`).

## Build For Production

From repository root:

```bash
npm run build
```

## Preview Production Build

From repository root:

```bash
npm run preview
```

## Available Scripts

Repository-level scripts ([package.json](package.json)):

- `npm run dev` -> run frontend dev server
- `npm run start` -> alias of dev
- `npm run build` -> production build
- `npm run preview` -> preview built app
- `npm run install:frontend` -> install frontend dependencies

Frontend-level scripts ([frontend/package.json](frontend/package.json)):

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Project Structure

```text
Home finance app/
  package.json
  frontend/
    src/
      components/
      context/
      pages/
      utils/
      App.jsx
      main.jsx
```

## Privacy

This app is private-by-default in the sense that it does not include a backend API. Data is stored in your browser localStorage on the current device.

If you clear browser site data or switch browsers/devices, data will not automatically carry over.

## Notes And Limits

- No cloud sync or authentication in current version.
- Currency formatting uses the browser locale.
- Auto-bucketing is keyword-based and may need manual correction for some transactions.

## Future Enhancements (Optional)

- Import transactions from CSV
- Recurring transaction templates
- Multi-household profiles
- Backup/restore local data
