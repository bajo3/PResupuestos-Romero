// Mezcla de la copia local con lo que hay en Supabase.
//
// Regla: gana siempre lo más reciente (por fecha de modificación) y lo ARCHIVADO en la nube
// cuenta. Una copia local vieja de algo que después se archivó se descarta en vez de
// volver a subirse (antes se resucitaba y reaparecían datos borrados).

export interface RemoteRow {
  id: string
  archived: boolean
  updated_at: number
  data: unknown
}

export interface Mergeable {
  id: string
  updatedAt: number
  archived?: boolean
}

export function mergeWithRemote<T extends Mergeable>(local: T[], remote: RemoteRow[]): { list: T[]; toPush: T[]; known: Map<string, number> } {
  const byId = new Map(remote.map((r) => [r.id, r]))
  const list: T[] = []
  const toPush: T[] = []
  const known = new Map<string, number>()
  const seen = new Set<string>()

  for (const r of remote) {
    known.set(r.id, r.updated_at)
    if (r.archived) continue
    const mine = local.find((l) => l.id === r.id)
    seen.add(r.id)
    if (mine && (mine.updatedAt ?? 0) > r.updated_at) {
      list.push(mine)
      toPush.push(mine)
    } else {
      list.push(r.data as T)
    }
  }

  for (const l of local) {
    if (seen.has(l.id)) continue
    const r = byId.get(l.id)
    if (!r) {
      // Nuevo, creado sin conexión: se conserva y se sube
      list.push(l)
      toPush.push(l)
    } else if ((l.updatedAt ?? 0) > r.updated_at) {
      // Se modificó después de archivarse: gana lo local
      list.push(l)
      toPush.push(l)
    }
    // si no: está archivado en la nube y la copia local es vieja → se descarta
  }

  list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  return { list, toPush, known }
}
