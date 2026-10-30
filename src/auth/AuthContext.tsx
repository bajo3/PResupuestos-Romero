import { createContext, useContext } from 'react'
import { canAccess, Profile, Role } from '../utils/auth'

interface AuthValue {
  profile: Profile | null
  /** Sin sesión (modo local/desarrollo) se comporta como administrador. */
  role: Role
  can: (feature: string) => boolean
  logout: () => void
}

const Ctx = createContext<AuthValue>({
  profile: null,
  role: 'admin',
  can: () => true,
  logout: () => {},
})

export const AuthProvider = Ctx.Provider

export function useAuth(): AuthValue {
  return useContext(Ctx)
}

export function makeAuthValue(profile: Profile | null, logout: () => void): AuthValue {
  const role = profile?.role ?? 'admin'
  return { profile, role, can: (f) => canAccess(role, f), logout }
}
