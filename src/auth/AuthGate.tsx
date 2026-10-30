import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'
import { fetchMyProfile, getSession, onAuthChange, Profile, signIn, signOut, signUp } from '../utils/auth'
import { applyRemoteReset } from '../utils/reset'
import { setCurrentUser } from '../utils/crmStore'
import { BrandLogo } from '../components/BrandLogo'
import { AuthProvider, makeAuthValue } from './AuthContext'

type Phase = 'loading' | 'login' | 'pending' | 'ready'

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <div className="bg-white rounded-xl border-2 border-romero-yellow p-1 shadow-sm">
            <BrandLogo variant="nav" />
          </div>
        </div>
        <div className="card p-5 space-y-3">{children}</div>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-romero-gray-3 mt-4">CRM LG · Gestión de obras</p>
      </div>
    </div>
  )
}

function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      if (password.length < 6) {
        setError('La contraseña tiene que tener al menos 6 caracteres.')
        setBusy(false)
        return
      }
      const res = await signUp(email, password, name)
      if (res.error) setError(res.error)
      else if (res.needsConfirm) setInfo('Te enviamos un email para confirmar la cuenta. Confirmalo y después ingresá.')
    }
    setBusy(false)
  }

  return (
    <Frame>
      <form onSubmit={submit} className="space-y-3">
        <div className="font-bold text-[17px]">{mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</div>
        {mode === 'signup' && (
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ej: Lucas" />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>
        {error && <p className="text-[13px] font-semibold text-red-700">{error}</p>}
        {info && <p className="text-[13px] font-semibold text-emerald-700">{info}</p>}
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
        <button type="button" className="w-full text-[13px] text-romero-gray-3 underline py-1" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}>
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
        </button>
        {mode === 'signup' && (
          <p className="text-[12px] text-romero-gray-3">La primera cuenta que se crea es la del administrador. Las siguientes quedan pendientes hasta que el administrador las apruebe.</p>
        )}
      </form>
    </Frame>
  )
}

function PendingScreen({ profile, onRetry }: { profile: Profile | null; onRetry: () => void }) {
  return (
    <Frame>
      <div className="font-bold text-[17px]">Cuenta pendiente de aprobación</div>
      <p className="text-[14px] text-romero-gray-3">
        {profile?.email ?? 'Tu cuenta'} se creó correctamente, pero el administrador todavía tiene que aprobarla para que puedas entrar.
      </p>
      <button className="btn-yellow w-full" onClick={onRetry}>Ya me aprobaron, reintentar</button>
      <button className="btn-ghost w-full" onClick={() => void signOut()}>Cerrar sesión</button>
    </Frame>
  )
}

/** Pide ingresar antes de mostrar la app. Sin Supabase configurado (desarrollo, tests) no pide nada. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(supabase ? 'loading' : 'ready')
  const [profile, setProfile] = useState<Profile | null>(null)
  const userId = useRef<string | null>(null)

  const resolve = useCallback(async (session: Session | null) => {
    if (!session) {
      userId.current = null
      setProfile(null)
      setPhase('login')
      return
    }
    userId.current = session.user.id
    let p = await fetchMyProfile()
    if (!p) {
      await new Promise((r) => setTimeout(r, 700))
      p = await fetchMyProfile()
    }
    setProfile(p)
    if (!p || !p.active) {
      setPhase('pending')
      return
    }
    setCurrentUser(p.name || p.email.split('@')[0])
    await applyRemoteReset()
    setPhase('ready')
  }, [])

  useEffect(() => {
    if (!supabase) return
    void getSession().then(resolve)
    return onAuthChange((event, session) => {
      if (event === 'SIGNED_OUT') void resolve(null)
      else if (event === 'SIGNED_IN' && session && session.user.id !== userId.current) void resolve(session)
    })
  }, [resolve])

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-romero-gray-3 text-[14px]">Cargando…</div>
  }
  if (phase === 'login') return <LoginScreen />
  if (phase === 'pending') return <PendingScreen profile={profile} onRetry={() => void getSession().then(resolve)} />

  return <AuthProvider value={makeAuthValue(profile, () => void signOut())}>{children}</AuthProvider>
}
