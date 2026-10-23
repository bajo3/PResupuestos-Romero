import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { CrmProvider, DocActions } from './crm/CrmContext'
import { Shell, NAV } from './crm/Shell'
import { Dashboard } from './crm/pages/Dashboard'
import { Caja } from './crm/pages/Caja'
import { ObrasList, ObraDetail } from './crm/pages/Obras'
import { Clientes } from './crm/pages/Clientes'
import { Stock } from './crm/pages/Stock'
import { Deudas } from './crm/pages/Deudas'
import { GarantiasList, GarantiaView } from './crm/pages/Garantias'
import { Reportes } from './crm/pages/Reportes'
import { Configuracion } from './crm/pages/Configuracion'

// ─── Tipos de vista ───────────────────────────────────────────────────────────

type BudgetView =
  | { kind: 'list' }
  | { kind: 'form'; budget: Budget }
  | { kind: 'preview'; budget: Budget }

type ReceiptView =
  | { kind: 'list' }
  | { kind: 'form'; receipt: Receipt }
  | { kind: 'preview'; receipt: Receipt }

// ─── Ruteo por hash: #/obras/<id> ─────────────────────────────────────────────

function readRoute(): string {
  const r = window.location.hash.replace(/^#\/?/, '')
  return r || 'panel'
}

function useRoute(): [string, (r: string) => void] {
  const [route, setRoute] = useState(readRoute)
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const navigate = useCallback((r: string) => {
    if (readRoute() === r) setRoute(r)
    else window.location.hash = '/' + r
  }, [])
  return [route, navigate]
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [route, navigate] = useRoute()
  const [section, param] = route.split('/')

  // Presupuestos
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets())
  const [budgetView, setBudgetView] = useState<BudgetView>({ kind: 'list' })

  // Recibos
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadReceipts())
  const [receiptView, setReceiptView] = useState<ReceiptView>({ kind: 'list' })

  /** Ruta a la que vuelve un documento abierto desde otro módulo (p. ej. una obra). */
  const returnTo = useRef<string | null>(null)

  // Sync inicial desde Supabase
  useEffect(() => {
    refreshBudgetsFromCloud().then((remote) => { if (remote) setBudgets(remote) })
    refreshReceiptsFromCloud().then((remote) => { if (remote) setReceipts(remote) })
  }, [])

  // Persistencia local
  useEffect(() => { saveBudgets(budgets) }, [budgets])
  useEffect(() => { saveReceipts(receipts) }, [receipts])

  // ── Navegación ────────────────────────────────────────────────────────────

  const goSection = useCallback((id: string) => {
    returnTo.current = null
    setBudgetView({ kind: 'list' })
    setReceiptView({ kind: 'list' })
    navigate(id)
  }, [navigate])

  const backFromDoc = (fallback: () => void) => {
    const r = returnTo.current
    returnTo.current = null
    if (r) { setBudgetView({ kind: 'list' }); setReceiptView({ kind: 'list' }); navigate(r) }
    else fallback()
  }

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

  const handleNewReceipt = async (preset: Partial<Receipt> = {}) => {
    const r = { ...makeEmptyReceipt(), ...preset }
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

  // ── Acciones de documentos para el CRM ────────────────────────────────────

  const budgetsRef = useRef(budgets); budgetsRef.current = budgets
  const receiptsRef = useRef(receipts); receiptsRef.current = receipts

  const docs = useMemo<DocActions>(() => {
    const from = () => { const r = readRoute(); returnTo.current = r.startsWith('presupuestos') || r.startsWith('recibos') ? null : r }
    return {
      newBudget: () => { from(); navigate('presupuestos'); handleNewBudget() },
      viewBudget: (id) => {
        const b = budgetsRef.current.find((x) => x.id === id)
        if (!b) return
        from(); navigate('presupuestos'); setBudgetView({ kind: 'preview', budget: b })
      },
      newReceipt: (preset) => { from(); navigate('recibos'); handleNewReceipt(preset) },
      viewReceipt: (id) => {
        const r = receiptsRef.current.find((x) => x.id === id)
        if (!r) return
        from(); navigate('recibos'); setReceiptView({ kind: 'preview', receipt: r })
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  // ── Render ────────────────────────────────────────────────────────────────

  const known = NAV.some((n) => n.id === section) ? section : 'panel'

  let content: JSX.Element
  let bare = false // documentos a pantalla completa, sin menú

  if (known === 'presupuestos' && budgetView.kind === 'form') {
    bare = true
    content = (
      <BudgetForm
        initial={budgetView.budget}
        onCancel={() => backFromDoc(() => setBudgetView({ kind: 'list' }))}
        onSave={(b) => { upsertBudget(b); setBudgetView({ kind: 'preview', budget: b }) }}
        onPreview={(b) => setBudgetView({ kind: 'preview', budget: b })}
      />
    )
  } else if (known === 'presupuestos' && budgetView.kind === 'preview') {
    bare = true
    const exists = budgets.some((x) => x.id === budgetView.budget.id)
    content = (
      <>
        <PrintActions
          onBack={() => backFromDoc(() => setBudgetView({ kind: 'list' }))}
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
  } else if (known === 'recibos' && receiptView.kind === 'form') {
    bare = true
    content = (
      <ReceiptForm
        initial={receiptView.receipt}
        budgets={budgets}
        onCancel={() => backFromDoc(() => setReceiptView({ kind: 'list' }))}
        onSave={(r) => { upsertReceipt(r); setReceiptView({ kind: 'preview', receipt: r }) }}
      />
    )
  } else if (known === 'recibos' && receiptView.kind === 'preview') {
    bare = true
    content = (
      <>
        <PrintActions
          onBack={() => backFromDoc(() => setReceiptView({ kind: 'list' }))}
          onEdit={() => setReceiptView({ kind: 'form', receipt: receiptView.receipt })}
          clientName={receiptView.receipt.client}
          docType="recibo"
        />
        <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
          <ReceiptPreview receipt={receiptView.receipt} />
        </main>
      </>
    )
  } else if (known === 'garantias' && param) {
    bare = true
    content = <GarantiaView id={param} />
  } else {
    content = {
      panel: <Dashboard />,
      caja: <Caja />,
      obras: param ? <ObraDetail id={param} /> : <ObrasList />,
      clientes: <Clientes />,
      presupuestos: (
        <BudgetList
          budgets={budgets}
          onNew={handleNewBudget}
          onView={handleViewBudget}
          onEdit={handleEditBudget}
          onDuplicate={handleDuplicateBudget}
          onDelete={handleDeleteBudget}
          onPrint={handleViewBudget}
        />
      ),
      recibos: (
        <ReceiptList
          receipts={receipts}
          onNew={() => handleNewReceipt()}
          onView={handleViewReceipt}
          onEdit={handleEditReceipt}
          onDelete={handleDeleteReceipt}
        />
      ),
      stock: <Stock />,
      deudas: <Deudas />,
      garantias: <GarantiasList />,
      reportes: <Reportes />,
      config: <Configuracion />,
    }[known] ?? <Dashboard />
  }

  return (
    <CrmProvider budgets={budgets} receipts={receipts} navigate={navigate} docs={docs}>
      {bare ? content : <Shell section={known} onGo={goSection}>{content}</Shell>}
    </CrmProvider>
  )
}
