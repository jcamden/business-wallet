import { describe, expect, it } from 'vitest'
import {
  bookkeepingHealth,
  expensesByPayer,
  expensesByVendor,
  inDateRange,
  rangeForPeriod,
  summarizeBusiness,
  type DatedTransaction,
} from '../../src/business'
import type { Wallet } from '../../src/types'

const tx = (values: Partial<DatedTransaction>): DatedTransaction => ({
  yearMonth: '2026-09',
  date: '09/01',
  type: 'expense',
  wallet: 'US Bank',
  note: '',
  amount: 0,
  ...values,
})

describe('business overview', () => {
  it('separates operating results from owner equity and transfers', () => {
    const result = summarizeBusiness([
      tx({ type: 'income', category: 'Sales revenue', amount: 1000 }),
      tx({ type: 'income', category: 'Owner contribution', tags: ['owner-contribution'], amount: 500 }),
      tx({ type: 'expense', category: 'Hosting and software', amount: 200 }),
      tx({ type: 'expense', category: 'AI and API services', wallet: 'Owner-paid business expenses', tags: ['owner-paid', 'owner-contribution'], amount: 100 }),
      tx({ type: 'expense', category: 'Owner draw', tags: ['owner-draw'], amount: 50 }),
      tx({ type: 'income', category: 'Refunds', amount: 25 }),
      tx({ type: 'income', category: 'Needs review', tags: ['needs-review'], amount: 300 }),
      tx({ type: 'transfer', amount: 900 }),
    ])

    expect(result).toEqual({
      salesRevenue: 1000,
      businessExpenses: 275,
      profitLoss: 725,
      ownerFunding: 600,
      ownerDraws: 50,
    })
  })

  it('groups expenses by funding source and provider tag', () => {
    const transactions = [
      tx({ amount: 10, tags: ['provider-openai'] }),
      tx({ amount: 20, wallet: 'Owner-paid business expenses', tags: ['owner-paid', 'provider-github'] }),
      tx({ amount: 30, tags: ['owner-paid', 'reimbursed-owner', 'provider-openai'] }),
    ]

    expect(Object.fromEntries(expensesByPayer(transactions))).toEqual({
      'Paid from business accounts': 10,
      'Paid personally by owner': 20,
      'Reimbursed owner expenses': 30,
    })
    expect(Object.fromEntries(expensesByVendor(transactions))).toEqual({ OpenAI: 40, Github: 20 })
  })

  it('builds date presets and filters full transaction dates', () => {
    expect(rangeForPeriod('priorMonth', new Date(2026, 0, 15))).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    })
    expect(inDateRange(tx({ yearMonth: '2026-09', date: '09/03' }), {
      start: '2026-09-02',
      end: '2026-09-04',
    })).toBe(true)
  })

  it('reports review, receipt, reconciliation, and duplicate-source health', () => {
    const wallets: Wallet[] = [{ name: 'US Bank', type: 'bank', initialBalance: 0, status: 'active', includeInNetAsset: true }]
    const result = bookkeepingHealth([
      tx({ category: 'Needs review', amount: 12, tags: ['needs-review', 'src-a'] }),
      tx({ date: '09/02', amount: 13, note: 'Invoice [[Receipts/vendor.pdf]]', tags: ['stmt-2026-09', 'src-a'] }),
      tx({ date: '09/03', amount: 14, wallet: 'Owner-paid business expenses', tags: ['owner-paid'] }),
    ], wallets)

    expect(result).toEqual({
      needsReview: 1,
      missingReceipts: 2,
      unreconciledBank: 1,
      latestStatement: '2026-09',
      duplicateSources: 1,
    })
  })
})
