import { useState } from 'react'
import { Field, Page } from '../ui'
import { getCurrentUser, setCurrentUser, getOverrunPct, setOverrunPct } from '../../utils/crmStore'
import { supabase } from '../../utils/supabase'
import { resetEverything } from '../../utils/reset'

export function Configuracion() {
  const [user, setUser] = useState(getCurrentUser())
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [overrun, setOverrun] = useState(String(getOverrunPct()))
  const [overrunSaved, setOverrunSaved] = useState(false)

  const onReset = async () => {
    if (!confirm('Esto deja el CRM en cero: se archivan todos los presupuestos, recibos, obras, caja, deudas, stock y garantías. ¿Continuar?')) return
    if ((prompt('Para confirmar, escribí BORRAR') ?? '').trim().toUpperCase() !== 'BORRAR') return
    setBusy(true)
    setError('')
    const err = await resetEverything()
    if (err) { setError(err); setBusy(false); return }
    window.location.hash = '/panel'
    window.location.reload()
  }

  return (
    <Page title="Configuración">
      <div className="card p-4 space-y-3">
        <div className="font-bold text-[15px]">Usuario de este dispositivo</div>
        <Field label="Nombre">
          <input className="input" value={user} onChange={(e) => { setUser(e.target.value); setSaved(false) }} placeholder="Ej: Lucas" />
        </Field>
        <p className="text-[12px] text-romero-gray-3">
          Queda registrado en cada movimiento que cargues, modifiques o anules (historial).
        </p>
        <button className="btn-primary" onClick={() => { setCurrentUser(user); setSaved(true) }}>
          {saved ? 'Guardado ✓' : 'Guardar'}
        </button>
      </div>

      <div className="card p-4 mt-4 space-y-3">
        <div className="font-bold text-[15px]">Alerta de sobrecosto</div>
        <Field label="Avisar cuando los gastos de una obra pasen este % del presupuesto">
          <input className="input" inputMode="numeric" value={overrun} onChange={(e) => { setOverrun(e.target.value.replace(/\D/g, '')); setOverrunSaved(false) }} />
        </Field>
        <button className="btn-primary" disabled={!(Number(overrun) > 0 && Number(overrun) <= 200)} onClick={() => { setOverrunPct(Number(overrun)); setOverrunSaved(true) }}>
          {overrunSaved ? 'Guardado ✓' : 'Guardar'}
        </button>
      </div>

      <div className="card p-4 mt-4 space-y-2">
        <div className="font-bold text-[15px]">Base de datos</div>
        {supabase ? (
          <p className="text-[14px] text-emerald-700 font-semibold">Conectado a Supabase: los datos se comparten entre dispositivos.</p>
        ) : (
          <p className="text-[14px] text-amber-700 font-semibold">
            Sin Supabase: los datos quedan solo en este navegador.
          </p>
        )}
        <p className="text-[12px] text-romero-gray-3">
          Para el CRM hay que correr una vez el script <code>supabase-crm.sql</code> en el SQL Editor de Supabase.
        </p>
      </div>

      <div className="card p-4 mt-4 space-y-2 border-red-200">
        <div className="font-bold text-[15px] text-red-700">Empezar de cero</div>
        <p className="text-[12px] text-romero-gray-3">
          Deja el CRM vacío: archiva en Supabase todos los datos (no se pierden, quedan archivados) y borra la copia de este dispositivo.
          Los demás dispositivos se limpian solos la próxima vez que abran la app.
        </p>
        {error && <p className="text-[13px] font-semibold text-red-700">{error}</p>}
        <button className="btn-danger w-full" disabled={busy} onClick={onReset}>
          {busy ? 'Archivando…' : 'Borrar todos los datos'}
        </button>
      </div>
    </Page>
  )
}
