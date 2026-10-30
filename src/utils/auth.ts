import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'admin' | 'encargado' | 'empleado'

export interface Profile {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  empleado: 'Empleado',
}

/**
 * Qué puede ver cada rol. `feature` es una sección del menú o una acción especial.
 * - Administrador: todo, incluidos usuarios y "Borrar todos los datos".
 * - Encargado: todo menos Reportes, usuarios y el borrado general.
 * - Empleado: obras (sin plata), stock, garantías y clientes.
 */
export function canAccess(role: Role, feature: string): boolean {
  if (role === 'admin') return true
  if (feature === 'reset' || feature === 'users') return false
  if (role === 'encargado') return feature !== 'reportes'
  return ['obras', 'stock', 'garantias', 'clientes', 'config'].includes(feature)
}

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Falta confirmar el email: revisá tu correo.',
  'User already registered': 'Ya existe una cuenta con ese email.',
}

const friendly = (msg: string) => ERRORS[msg] ?? msg

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(cb: (event: string, session: Session | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session))
  return () => data.subscription.unsubscribe()
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Sin conexión con el servidor.'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error ? friendly(error.message) : null
}

export async function signUp(email: string, password: string, name: string): Promise<{ error: string | null; needsConfirm: boolean }> {
  if (!supabase) return { error: 'Sin conexión con el servidor.', needsConfirm: false }
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
  if (error) return { error: friendly(error.message), needsConfirm: false }
  return { error: null, needsConfirm: !data.session }
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
}

export async function fetchMyProfile(): Promise<Profile | null> {
  if (!supabase) return null
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle()
  return (data as Profile | null) ?? null
}

export async function listProfiles(): Promise<Profile[]> {
  if (!supabase) return []
  const { data } = await supabase.from('profiles').select('*').order('created_at')
  return (data as Profile[]) ?? []
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'role' | 'active' | 'name'>>): Promise<string | null> {
  if (!supabase) return 'Sin conexión con el servidor.'
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  return error ? error.message : null
}
