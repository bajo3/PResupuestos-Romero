import { useState } from 'react'
import { Field, Page } from '../ui'
import { getCurrentUser, setCurrentUser } from '../../utils/crmStore'
import { supabase } from '../../utils/supabase'

export function Configuracion() {
  const [user, setUser] = useState(getCurrentUser())
  const [saved, setSaved] = useState(false)

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
    </Page>
  )
}
