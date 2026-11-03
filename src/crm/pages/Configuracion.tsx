import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { APP_VERSION, updateNow } from '../../utils/useAppUpdate'
import { listProfiles, Profile, Role, ROLE_LABEL, updateProfile } from '../../utils/auth'
import { Field, Page } from '../ui'
import { getCurrentUser, setCurrentUser, getOverrunPct, setOverrunPct } from '../../utils/crmStore'
import { supabase } from '../../utils/supabase'
import { resetEverything } from '../../utils/reset'

function UsersCard() {
  const { profile } = useAuth()
  const [list, setList] = useState<Profile[]>([])
  const [error, setError] = useState('')
  const load = () => { void listProfiles().then(setList) }
  useEffect(load, [])

  const change = async (id: string, patch: Partial<Pick<Profile, 'role' | 'active'>>) => {
    const err = await updateProfile(id, patch)
    setError(err ?? '')
    load()
  }

  return (
    <div className="card p-4 mt-4 space-y-3">
      <div className="font-bold text-[15px]">Usuarios</div>
      <p className="text-[12px] text-romero-gray-3">
        Las cuentas nuevas quedan pendientes hasta que las aprobés. Administrador: todo. Encargado: todo menos Reportes, usuarios y borrado general. Empleado: obras (sin plata), stock, garantías y clientes.
      </p>
      {error && <p className="text-[13px] font-semibold text-red-700">{error}</p>}
      <div className="divide-y divide-romero-gray-2">
        {list.map((u) => {
          const me = u.id === profile?.id
          return (
            <div key={u.id} className="py-3 space-y-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{u.name || u.email}{me ? ' (vos)' : ''}</div>
                <div className="text-[12px] text-romero-gray-3 truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <select className="input py-2" value={u.role} disabled={me} onChange={(e) => void change(u.id, { role: e.target.value as Role })}>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
                  <input type="checkbox" checked={u.active} disabled={me} onChange={(e) => void change(u.id, { active: e.target.checked })} />
                  Activo
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Configuracion() {
  const { profile, can, logout } = useAuth()
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
      {profile && (
        <div className="card p-4 space-y-2 mb-4">
          <div className="font-bold text-[15px]">Mi cuenta</div>
          <div className="text-[14px]">{profile.name || profile.email}</div>
          <div className="text-[12px] text-romero-gray-3">{profile.email} · {ROLE_LABEL[profile.role]}</div>
          <button className="btn-ghost w-full" onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {can('users') && <UsersCard />}

      <div className="card p-4 space-y-3 mt-4">
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

      <div className="card p-4 mt-4 space-y-2">
        <div className="font-bold text-[15px]">Versión de la app</div>
        <p className="text-[14px]">Versión <b>{APP_VERSION}</b></p>
        <p className="text-[12px] text-romero-gray-3">Si este dispositivo muestra algo viejo, tocá el botón para traer la última versión.</p>
        <button className="btn-ghost w-full" onClick={() => void updateNow()}>Buscar actualización</button>
      </div>

      {can('reset') && <div className="card p-4 mt-4 space-y-2 border-red-200">
        <div className="font-bold text-[15px] text-red-700">Empezar de cero</div>
        <p className="text-[12px] text-romero-gray-3">
          Deja el CRM vacío: archiva en Supabase todos los datos (no se pierden, quedan archivados) y borra la copia de este dispositivo.
          Los demás dispositivos se limpian solos la próxima vez que abran la app.
        </p>
        {error && <p className="text-[13px] font-semibold text-red-700">{error}</p>}
        <button className="btn-danger w-full" disabled={busy} onClick={onReset}>
          {busy ? 'Archivando…' : 'Borrar todos los datos'}
        </button>
      </div>}
    </Page>
  )
}
