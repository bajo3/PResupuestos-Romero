import { useEffect, useState } from 'react'
import { Budget, makeEmptyBudget } from './types/budget'
import { Receipt, makeEmptyReceipt } from './types/receipt'
import {
  loadBudgets, saveBudgets, nextBudgetNumberAsync, refreshBudgetsFromCloud, archiveBudget,
  loadReceipts, saveReceipts, nextReceiptNumberAsync, refreshReceiptsFromCloud, archiveReceipt,
} from './utils/storage'
import { BudgetList } from './components/BudgetList'
import { BudgetForm } from './components/BudgetForm'
import { BudgetPreview } from './components/BudgetPreview'
import { PrintActions } from './components/PrintActions'
import { ReceiptList } from './components/ReceiptList'
import { ReceiptForm } from './components/ReceiptForm'
import { ReceiptPreview } from './components/ReceiptPreview'
import { BrandLogo } from './components/BrandLogo'

// ─── Tipos de vista ───────────────────────────────────────────────────────────

type BudgetView =
  | { kind: 'list' }
  | { kind: 'form'; budget: Budget }
  | { kind: 'preview'; budget: Budget }

type ReceiptView =
  | { kind: 'list' }
  | { kind: 'form'; receipt: Receipt }
  | { kind: 'preview'; receipt: Receipt }

type Tab = 'budgets' | 'receipts'

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-romero-gray-2">
      <div className="mx-auto max-w-2xl px-4">
        {/* Marca */}
        <div className="flex items-center gap-3 pt-3 pb-2">
          <div className="bg-white rounded-xl border-2 border-romero-yellow p-1 shadow-sm">
            <BrandLogo variant="nav" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-romero-gray-3 truncate">
              Especialistas en Impermeabilización
            </div>
            <div className="text-base font-extrabold leading-none">Lucas Gallastagui</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-0">
          {([
            { id: 'budgets', label: 'Presupuestos' },
            { id: 'receipts', label: 'Recibos' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`px-4 py-2.5 text-[13px] font-semibold rounded-t-lg transition-all border-b-2 ${
                active === t.id
                  ? 'border-romero-ink text-romero-ink bg-white'
                  : 'border-transparent text-romero-gray-3 hover:text-romero-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>('budgets')

  // Presupuestos
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets())
  const [budgetView, setBudgetView] = useState<BudgetView>({ kind: 'list' })

  // Recibos
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadReceipts())
  const [receiptView, setReceiptView] = useState<ReceiptView>({ kind: 'list' })

  // Sync inicial desde Supabase
  useEffect(() => {
    refreshBudgetsFromCloud().then((remote) => { if (remote) setBudgets(remote) })
    refreshReceiptsFromCloud().then((remote) => { if (remote) setReceipts(remote) })
  }, [])

  // Persistencia local
  useEffect(() => { saveBudgets(budgets) }, [budgets])
  useEffect(() => { saveReceipts(receipts) }, [receipts])

  // ── Presupuestos ──────────────────────────────────────────────────────────

  const upsertBudget = (b: Budget) => {
    setBudgets((list) => {
      const idx = list.findIndex((x) => x.id === b.id)
      if (idx === -1) return [b, ...list]
      const next = [...list]; next[idx] = b; return next
    })
  }

  const handleNewBudget = async () => {
    const b = makeEmptyBudget()
    b.number = await nextBudgetNumberAsync()
    setBudgetView({ kind: 'form', budget: b })
  }
  const handleEditBudget = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (b) setBudgetView({ kind: 'form', budget: b })
  }
  const handleViewBudget = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (b) setBudgetView({ kind: 'preview', budget: b })
  }
  const handleDuplicateBudget = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (!b) return
    const copy: Budget = {
      ...b,
      id: crypto.randomUUID(),
      number: b.number ? b.number + ' (copia)' : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setBudgets((list) => [copy, ...list])
  }
  const handleDeleteBudget = (id: string) => {
    setBudgets((list) => archiveBudget(id, list))
  }

  // ── Recibos ───────────────────────────────────────────────────────────────

  const upsertReceipt = (r: Receipt) => {
    setReceipts((list) => {
      const idx = list.findIndex((x) => x.id === r.id)
      if (idx === -1) return [r, ...list]
      const next = [...list]; next[idx] = r; return next
    })
  }

  const handleNewReceipt = async () => {
    const r = makeEmptyReceipt()
    r.number = await nextReceiptNumberAsync()
    setReceiptView({ kind: 'form', receipt: r })
  }
  const handleEditReceipt = (id: string) => {
    const r = receipts.find((x) => x.id === id)
    if (r) setReceiptView({ kind: 'form', receipt: r })
  }
  const handleViewReceipt = (id: string) => {
    const r = receipts.find((x) => x.id === id)
    if (r) setReceiptView({ kind: 'preview', receipt: r })
  }
  const handleDeleteReceipt = (id: string) => {
    setReceipts((list) => archiveReceipt(id, list))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Presupuesto: formulario
  if (tab === 'budgets' && budgetView.kind === 'form') {
    return (
      <BudgetForm
        initial={budgetView.budget}
        onCancel={() => setBudgetView({ kind: 'list' })}
        onSave={(b) => { upsertBudget(b); setBudgetView({ kind: 'preview', budget: b }) }}
        onPreview={(b) => setBudgetView({ kind: 'preview', budget: b })}
      />
    )
  }

  // Presupuesto: preview
  if (tab === 'budgets' && budgetView.kind === 'preview') {
    const exists = budgets.some((x) => x.id === budgetView.budget.id)
    return (
      <>
        <PrintActions
          onBack={() => setBudgetView({ kind: 'list' })}
          onEdit={() => setBudgetView({ kind: 'form', budget: budgetView.budget })}
          clientName={budgetView.budget.client}
        />
        <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
          <BudgetPreview budget={budgetView.budget} />
          {!exists && (
            <div className="no-print mx-auto max-w-5xl mt-4 text-center text-sm text-romero-gray-3">
              Vista previa sin guardar.
            </div>
          )}
        </main>
      </>
    )
  }

  // Recibo: formulario
  if (tab === 'receipts' && receiptView.kind === 'form') {
    return (
      <>
        <TabBar active={tab} onChange={(t) => { setTab(t); setReceiptView({ kind: 'list' }) }} />
        <ReceiptForm
          initial={receiptView.receipt}
          budgets={budgets}
          onCancel={() => setReceiptView({ kind: 'list' })}
          onSave={(r) => { upsertReceipt(r); setReceiptView({ kind: 'preview', receipt: r }) }}
        />
      </>
    )
  }

  // Recibo: preview
  if (tab === 'receipts' && receiptView.kind === 'preview') {
    return (
      <>
        <PrintActions
          onBack={() => setReceiptView({ kind: 'list' })}
          onEdit={() => setReceiptView({ kind: 'form', receipt: receiptView.receipt })}
          clientName={receiptView.receipt.client}
          docType="recibo"
        />
        <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
          <ReceiptPreview receipt={receiptView.receipt} />
        </main>
      </>
    )
  }

  // Listas (default)
  return (
    <div className="min-h-screen">
      <TabBar active={tab} onChange={(t) => setTab(t)} />
      {tab === 'budgets' && (
        <BudgetList
          budgets={budgets}
          onNew={handleNewBudget}
          onView={handleViewBudget}
          onEdit={handleEditBudget}
          onDuplicate={handleDuplicateBudget}
          onDelete={handleDeleteBudget}
          onPrint={handleViewBudget}
        />
      )}
      {tab === 'receipts' && (
        <ReceiptList
          receipts={receipts}
          onNew={handleNewReceipt}
          onView={handleViewReceipt}
          onEdit={handleEditReceipt}
          onDelete={handleDeleteReceipt}
        />
      )}
    </div>
  )
}
