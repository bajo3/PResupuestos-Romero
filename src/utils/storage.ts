import { Budget, makeDemoBudget } from '../types/budget'

const KEY = 'romero.budgets.v1'
const SEEDED_KEY = 'romero.budgets.seeded.v1'

export function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Budget[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  // Seed con el demo del PDF la primera vez
  if (!localStorage.getItem(SEEDED_KEY)) {
    const demo = makeDemoBudget()
    saveBudgets([demo])
    localStorage.setItem(SEEDED_KEY, '1')
    return [demo]
  }
  return []
}

export function saveBudgets(list: Budget[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}
