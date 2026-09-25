import type { Transaction, Wallet } from './types'

export type BusinessPeriod = 'all' | 'ytd' | 'thisMonth' | 'priorMonth' | 'custom'

export interface DateRange {
  start: string | null
  end: string | null
}

export interface DatedTransaction extends Transaction {
  yearMonth: string
}

export interface BusinessSummary {
  salesRevenue: number
  businessExpenses: number
  profitLoss: number
  ownerFunding: number
  ownerDraws: number
}

export interface BookkeepingHealth {
  needsReview: number
  missingReceipts: number
  unreconciledBank: number
  latestStatement: string | null
  duplicateSources: number
}

const OWNER_PAID_WALLET = 'owner-paid business expenses'

function normalized(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ')
}

function hasTag(tx: Transaction, ...names: string[]): boolean {
  const wanted = new Set(names.map(normalized))
  return (tx.tags ?? []).some(tag => wanted.has(normalized(tag)))
}

export function transactionDate(tx: DatedTransaction): string {
  return `${tx.yearMonth.slice(0, 4)}-${tx.date.replace('/', '-')}`
}

export function rangeForPeriod(period: BusinessPeriod, now = new Date()): DateRange {
  const date = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const year = now.getFullYear()
  const month = now.getMonth()

  if (period === 'all' || period === 'custom') return { start: null, end: null }
  if (period === 'ytd') return { start: date(year, 0, 1), end: date(year, month, now.getDate()) }
  if (period === 'thisMonth') return { start: date(year, month, 1), end: date(year, month, now.getDate()) }

  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return {
    start: date(first.getFullYear(), first.getMonth(), first.getDate()),
    end: date(last.getFullYear(), last.getMonth(), last.getDate()),
  }
}

export function inDateRange(tx: DatedTransaction, range: DateRange): boolean {
  const date = transactionDate(tx)
  return (!range.start || date >= range.start) && (!range.end || date <= range.end)
}

export function isOwnerDraw(tx: Transaction): boolean {
  return tx.type === 'expense' && (normalized(tx.category) === 'owner draw' || hasTag(tx, 'owner-draw'))
}

export function isOwnerPaidExpense(tx: Transaction): boolean {
  return tx.type === 'expense' && (
    normalized(tx.wallet) === OWNER_PAID_WALLET || hasTag(tx, 'owner-paid')
  )
}

export function isReimbursedOwnerExpense(tx: Transaction): boolean {
  return tx.type === 'expense' && hasTag(tx, 'reimbursed-owner', 'owner-reimbursed')
}

export function isBusinessExpense(tx: Transaction): boolean {
  return tx.type === 'expense' && !isOwnerDraw(tx)
}

function isOwnerContribution(tx: Transaction): boolean {
  return tx.type === 'income' && (
    normalized(tx.category) === 'owner contribution' || hasTag(tx, 'owner-contribution')
  )
}

function isIncomeRefund(tx: Transaction): boolean {
  const category = normalized(tx.category)
  return tx.type === 'income' && (category === 'refund' || category === 'refunds' || hasTag(tx, 'refund'))
}

function isSalesRevenue(tx: Transaction): boolean {
  return tx.type === 'income' && (
    normalized(tx.category) === 'sales revenue' || hasTag(tx, 'sales-revenue')
  )
}

export function summarizeBusiness(transactions: DatedTransaction[]): BusinessSummary {
  let salesRevenue = 0
  let businessExpenses = 0
  let ownerFunding = 0
  let ownerDraws = 0

  for (const tx of transactions) {
    if (isOwnerContribution(tx)) ownerFunding += tx.amount
    else if (isIncomeRefund(tx)) businessExpenses -= tx.amount
    else if (isSalesRevenue(tx)) salesRevenue += tx.amount

    if (isOwnerDraw(tx)) ownerDraws += tx.amount
    else if (isBusinessExpense(tx)) {
      businessExpenses += tx.amount
      if (isOwnerPaidExpense(tx)) ownerFunding += tx.amount
    }
  }

  return {
    salesRevenue,
    businessExpenses,
    profitLoss: salesRevenue - businessExpenses,
    ownerFunding,
    ownerDraws,
  }
}

function add(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}

export function expensesByCategory(transactions: DatedTransaction[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const tx of transactions) {
    if (isBusinessExpense(tx)) add(result, tx.category ?? '', tx.amount)
  }
  return result
}

export function vendorName(tx: Transaction): string {
  const tag = (tx.tags ?? []).map(value => value.trim())
    .find(value => value.toLowerCase().startsWith('provider-'))
  if (!tag) return 'Unspecified'
  return tag.slice('provider-'.length).split('-').filter(Boolean)
    .map(part => part.toLowerCase() === 'openai' ? 'OpenAI' : part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

export function expensesByVendor(transactions: DatedTransaction[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const tx of transactions) {
    if (isBusinessExpense(tx)) add(result, vendorName(tx), tx.amount)
  }
  return result
}

export function expensesByPayer(transactions: DatedTransaction[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const tx of transactions) {
    if (!isBusinessExpense(tx)) continue
    const payer = isReimbursedOwnerExpense(tx)
      ? 'Reimbursed owner expenses'
      : isOwnerPaidExpense(tx)
        ? 'Paid personally by owner'
        : 'Paid from business accounts'
    add(result, payer, tx.amount)
  }
  return result
}

export function monthRange(transactions: DatedTransaction[], range: DateRange): string[] {
  const transactionMonths = transactions.map(tx => tx.yearMonth).sort()
  const first = range.start?.slice(0, 7) ?? transactionMonths[0]
  const last = range.end?.slice(0, 7) ?? transactionMonths[transactionMonths.length - 1]
  if (!first || !last || first > last) return []

  const [startYear, startMonth] = first.split('-').map(Number)
  const [endYear, endMonth] = last.split('-').map(Number)
  const result: string[] = []
  for (let date = new Date(startYear, startMonth - 1, 1);
    date <= new Date(endYear, endMonth - 1, 1);
    date.setMonth(date.getMonth() + 1)) {
    result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

export function bookkeepingHealth(
  transactions: DatedTransaction[],
  wallets: Wallet[],
): BookkeepingHealth {
  const bankWallets = new Set(wallets.filter(wallet => wallet.type === 'bank').map(wallet => wallet.name))
  const sourceCounts = new Map<string, number>()
  let needsReview = 0
  let missingReceipts = 0
  let unreconciledBank = 0
  let latestStatement: string | null = null

  for (const tx of transactions) {
    const tags = tx.tags ?? []
    if (normalized(tx.category) === 'needs review' || hasTag(tx, 'needs-review')) needsReview++
    if (isBusinessExpense(tx) && tx.amount > 0 && !/\[\[[^\]]+\]\]/.test(tx.note) &&
      !tags.some(tag => tag.trim().toLowerCase().startsWith('receipt-'))) missingReceipts++

    const touchesBank = [tx.wallet, tx.fromWallet, tx.toWallet].some(wallet => wallet && bankWallets.has(wallet))
    const statementTag = tags.map(tag => tag.trim()).find(tag => tag.toLowerCase().startsWith('stmt-'))
    if (touchesBank && !statementTag) unreconciledBank++
    if (statementTag && (!latestStatement || statementTag.localeCompare(latestStatement) > 0)) {
      latestStatement = statementTag
    }

    for (const tag of tags.map(value => value.trim()).filter(value => value.toLowerCase().startsWith('src-'))) {
      sourceCounts.set(tag, (sourceCounts.get(tag) ?? 0) + 1)
    }
  }

  return {
    needsReview,
    missingReceipts,
    unreconciledBank,
    latestStatement: latestStatement?.slice('stmt-'.length) ?? null,
    duplicateSources: [...sourceCounts.values()].filter(count => count > 1).length,
  }
}
