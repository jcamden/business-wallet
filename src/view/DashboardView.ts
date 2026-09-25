import { Events, ItemView, WorkspaceLeaf } from 'obsidian'
import { WalletFile } from '../io/WalletFile'
import { t, formatMonthLabel, formatYearMonth } from '../i18n'
import { formatAmount } from '../utils'
import { createMetric, renderCard } from './components'
import { renderSharedHeader } from './SharedHeader'
import { Chart } from 'chart.js'
import { drawIncExpChart, drawTrendChart, type MonthData, type TrendPoint } from './charts'
import {
  bookkeepingHealth,
  expensesByCategory,
  expensesByPayer,
  expensesByVendor,
  inDateRange,
  monthRange,
  rangeForPeriod,
  summarizeBusiness,
  transactionDate,
  type BusinessPeriod,
  type DateRange,
  type DatedTransaction,
} from '../business'

export const DASHBOARD_VIEW_TYPE = 'business-wallet-dashboard'

export class DashboardView extends ItemView {
  private walletFile: WalletFile
  private period: BusinessPeriod = 'all'
  private customRange: DateRange = { start: null, end: null }
  private charts: Chart[] = []

  constructor(leaf: WorkspaceLeaf, walletFile: WalletFile) {
    super(leaf)
    this.walletFile = walletFile
  }

  getViewType() { return DASHBOARD_VIEW_TYPE }
  getDisplayText() { return t('dashboard.title') }
  getIcon() { return 'briefcase' }

  async onOpen() {
    this.registerEvent(
      (this.app.workspace as Events).on('business-wallet:refresh', () => { void this.render() })
    )
    this.registerEvent(
      (this.app.workspace as Events).on('css-change', () => { void this.render() })
    )
    await this.render()
  }

  onClose(): Promise<void> {
    this.clearCharts()
    this.contentEl.empty()
    return Promise.resolve()
  }

  private clearCharts() {
    this.charts.forEach(chart => chart.destroy())
    this.charts = []
  }

  async render() {
    const { contentEl } = this
    this.clearCharts()
    contentEl.empty()
    contentEl.addClass('pw-dashboard')

    const yearMonths = this.walletFile.getAllYearMonths()
    const monthlyTransactions = await Promise.all(yearMonths.map(yearMonth => this.walletFile.readMonth(yearMonth)))
    const allTransactions: DatedTransaction[] = yearMonths.flatMap((yearMonth, index) =>
      monthlyTransactions[index].map(tx => ({ ...tx, yearMonth })))
    const range = this.period === 'custom' ? this.customRange : rangeForPeriod(this.period)
    const transactions = allTransactions.filter(tx => inDateRange(tx, range))
    const summary = summarizeBusiness(transactions)
    const dp = this.walletFile.getConfig().decimalPlaces ?? 0

    renderSharedHeader(contentEl, {
      view: this,
      walletFile: this.walletFile,
      activeView: 'dashboard',
      yearMonth: null,
    })
    this.renderPeriodControls(contentEl)

    const cashTransactions = range.end
      ? allTransactions.filter(tx => transactionDate(tx) <= range.end!)
      : allTransactions
    const businessCash = this.walletFile.computeWalletBalances(cashTransactions)
      .filter(({ wallet }) => wallet.includeInNetAsset && (wallet.type === 'cash' || wallet.type === 'bank'))
      .reduce((total, { balance }) => total + balance, 0)

    const metrics = contentEl.createDiv('pw-metrics pw-business-metrics')
    createMetric(metrics, t('dash.salesRevenue'), summary.salesRevenue, 'income', { dp })
    createMetric(metrics, t('dash.businessExpenses'), summary.businessExpenses, 'expense', { dp })
    createMetric(metrics, t('dash.profitLoss'), summary.profitLoss,
      summary.profitLoss >= 0 ? 'positive' : 'negative', { dp, hero: true })
    createMetric(metrics, t('dash.businessCash'), businessCash, 'neutral', { dp })
    createMetric(metrics, t('dash.ownerFunding'), summary.ownerFunding, 'neutral', { dp })
    createMetric(metrics, t('dash.ownerDraws'), summary.ownerDraws, 'neutral', { dp })

    const fundingCard = renderCard(contentEl, { title: t('dash.fundingSource'), className: 'pw-wide-card' })
    this.renderBreakdown(fundingCard, expensesByPayer(transactions), dp)

    const breakdowns = contentEl.createDiv('pw-business-grid')
    const categoryCard = renderCard(breakdowns, { title: t('dash.expenseByCategory') })
    this.renderBreakdown(categoryCard, expensesByCategory(transactions), dp)
    const vendorCard = renderCard(breakdowns, { title: t('dash.expenseByVendor') })
    this.renderBreakdown(vendorCard, expensesByVendor(transactions), dp)

    this.renderTrends(contentEl, transactions, range, dp)
    this.renderHealth(contentEl, allTransactions)
  }

  private renderPeriodControls(parent: HTMLElement): void {
    const controls = parent.createDiv('pw-period-controls')
    controls.createEl('label', { text: t('dash.period'), attr: { for: 'pw-business-period' } })
    const select = controls.createEl('select', { cls: 'dropdown', attr: { id: 'pw-business-period' } })
    const periods: Array<[BusinessPeriod, string]> = [
      ['all', t('period.all')],
      ['ytd', t('period.ytd')],
      ['thisMonth', t('period.thisMonth')],
      ['priorMonth', t('period.priorMonth')],
      ['custom', t('period.custom')],
    ]
    for (const [value, label] of periods) {
      const option = select.createEl('option', { text: label, value })
      option.selected = value === this.period
    }
    select.addEventListener('change', () => {
      this.period = select.value as BusinessPeriod
      void this.render()
    })

    if (this.period !== 'custom') return
    const start = controls.createEl('input', { type: 'date', value: this.customRange.start ?? '' })
    const end = controls.createEl('input', { type: 'date', value: this.customRange.end ?? '' })
    start.setAttr('aria-label', t('period.start'))
    end.setAttr('aria-label', t('period.end'))
    start.max = end.value
    end.min = start.value
    start.addEventListener('change', () => {
      this.customRange.start = start.value || null
      void this.render()
    })
    end.addEventListener('change', () => {
      this.customRange.end = end.value || null
      void this.render()
    })
  }

  private renderBreakdown(parent: HTMLElement, values: Map<string, number>, dp: 0 | 2): void {
    const entries = [...values.entries()]
      .filter(([, amount]) => amount !== 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    if (entries.length === 0) {
      parent.createEl('p', { text: t('dash.noData'), cls: 'pw-no-data' })
      return
    }

    const table = parent.createDiv('pw-breakdown-table')
    for (const [name, amount] of entries) {
      const row = table.createDiv('pw-breakdown-row')
      row.createEl('span', { text: name || t('label.cat.uncategorized') })
      row.createEl('span', { text: formatAmount(amount, dp), cls: amount < 0 ? 'negative' : '' })
    }
  }

  private renderTrends(parent: HTMLElement, transactions: DatedTransaction[], range: DateRange, dp: 0 | 2): void {
    const months = monthRange(transactions, range)
    if (months.length === 0) return

    let cumulativeProfit = 0
    const monthly = months.map(yearMonth => {
      const summary = summarizeBusiness(transactions.filter(tx => tx.yearMonth === yearMonth))
      cumulativeProfit += summary.profitLoss
      return { yearMonth, summary, cumulativeProfit }
    })
    const chartData: MonthData[] = monthly.map(({ yearMonth, summary }) => ({
      monthLabel: formatMonthLabel(yearMonth),
      tooltipLabel: formatYearMonth(yearMonth, 'short'),
      income: summary.salesRevenue,
      expense: summary.businessExpenses,
      net: null,
    }))
    const trendPoint = (pick: (row: typeof monthly[number]) => number): TrendPoint[] => monthly.map(row => ({
      monthLabel: formatMonthLabel(row.yearMonth),
      tooltipLabel: formatYearMonth(row.yearMonth, 'short'),
      value: pick(row),
    }))

    const trends = parent.createDiv('pw-business-trends')
    const revenueCard = renderCard(trends, { title: t('trend.monthlyRevenueExpense'), className: 'pw-inc-exp-card' })
    this.charts.push(drawIncExpChart(revenueCard.createDiv('pw-chart-wrap'), chartData, dp))
    const profitCard = renderCard(trends, { title: t('trend.cumulativeProfitLoss') })
    this.charts.push(drawTrendChart(profitCard.createDiv('pw-chart-wrap'), trendPoint(row => row.cumulativeProfit), t('dash.profitLoss'), dp))
    const fundingCard = renderCard(trends, { title: t('trend.ownerFunding') })
    this.charts.push(drawTrendChart(fundingCard.createDiv('pw-chart-wrap'), trendPoint(row => row.summary.ownerFunding), t('dash.ownerFunding'), dp, 'income'))
  }

  private renderHealth(parent: HTMLElement, transactions: DatedTransaction[]): void {
    const health = bookkeepingHealth(transactions, this.walletFile.getConfig().wallets)
    const card = renderCard(parent, { title: t('health.title'), className: 'pw-wide-card' })
    const grid = card.createDiv('pw-health-grid')
    const values: Array<[string, string | number, boolean]> = [
      [t('health.needsReview'), health.needsReview, health.needsReview > 0],
      [t('health.missingReceipts'), health.missingReceipts, health.missingReceipts > 0],
      [t('health.unreconciled'), health.unreconciledBank, health.unreconciledBank > 0],
      [t('health.latestStatement'), health.latestStatement ?? t('health.none'), false],
      [t('health.duplicateSources'), health.duplicateSources, health.duplicateSources > 0],
    ]
    for (const [label, value, warning] of values) {
      const item = grid.createDiv('pw-health-item' + (warning ? ' is-warning' : ''))
      item.createEl('span', { text: label })
      item.createEl('strong', { text: String(value) })
    }
  }
}
