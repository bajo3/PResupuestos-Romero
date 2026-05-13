import { useEffect, useState } from 'react'
import { Budget, makeEmptyBudget } from './types/budget'
import { loadBudgets, saveBudgets } from './utils/storage'
import { BudgetList } from './components/BudgetList'
import { BudgetForm } from './components/BudgetForm'
import { BudgetPreview } from './components/BudgetPreview'
import { PrintActions } from './components/PrintActions'

type View =
  | { kind: 'list' }
  | { kind: 'form'; budget: Budget }
  | { kind: 'preview'; budget: Budget; autoPrint?: boolean }

export default function App() {
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets())
  const [view, setView] = useState<View>({ kind: 'list' })

  useEffect(() => {
    saveBudgets(budgets)
  }, [budgets])

  useEffect(() => {
    if (view.kind === 'preview' && view.autoPrint) {
      const id = setTimeout(() => window.print(), 250)
      return () => clearTimeout(id)
    }
  }, [view])

  const upsert = (b: Budget) => {
    setBudgets((list) => {
      const idx = list.findIndex((x) => x.id === b.id)
      if (idx === -1) return [b, ...list]
      const next = [...list]
      next[idx] = b
      return next
    })
  }

  const handleNew = () => setView({ kind: 'form', budget: makeEmptyBudget() })
  const handleEdit = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (b) setView({ kind: 'form', budget: b })
  }
  const handleView = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (b) setView({ kind: 'preview', budget: b })
  }
  const handlePrint = (id: string) => {
    const b = budgets.find((x) => x.id === id)
    if (b) setView({ kind: 'preview', budget: b, autoPrint: true })
  }
  const handleDuplicate = (id: string) => {
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
  const handleDelete = (id: string) => {
    setBudgets((list) => list.filter((x) => x.id !== id))
  }

  if (view.kind === 'form') {
    return (
      <BudgetForm
        initial={view.budget}
        onCancel={() => setView({ kind: 'list' })}
        onSave={(b) => {
          upsert(b)
          setView({ kind: 'preview', budget: b })
        }}
        onPreview={(b) => setView({ kind: 'preview', budget: b })}
      />
    )
  }

  if (view.kind === 'preview') {
    const exists = budgets.some((x) => x.id === view.budget.id)
    return (
      <>
        <PrintActions
          onBack={() => setView({ kind: 'list' })}
          onEdit={() => setView({ kind: 'form', budget: view.budget })}
          clientName={view.budget.client}
        />
        <main className="px-3 sm:px-6 py-4 sm:py-8 print:p-0">
          <BudgetPreview budget={view.budget} />
          {!exists && (
            <div className="no-print mx-auto max-w-5xl mt-4 text-center text-sm text-romero-gray-3">
              Vista previa sin guardar.
            </div>
          )}
        </main>
      </>
    )
  }

  return (
    <BudgetList
      budgets={budgets}
      onNew={handleNew}
      onView={handleView}
      onEdit={handleEdit}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onPrint={handlePrint}
    />
  )
}
