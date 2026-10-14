export type Kind = 'habit' | 'todo'
export type PlantType = 'sakura' | 'moss' | 'bamboo' | 'matcha' | 'peony' | 'fern'
export interface Task { id: string; name: string; kind: Kind; plant: PlantType; created: number; archived?: boolean }
export interface Done { id: string; taskId: string; day: string; at: number; plant: PlantType; x: number; seed: number }

let dbp: Promise<IDBDatabase> | null = null
function db(): Promise<IDBDatabase> {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open('u74-garden', 1)
    r.onupgradeneeded = () => {
      const d = r.result
      d.createObjectStore('tasks', { keyPath: 'id' })
      const s = d.createObjectStore('done', { keyPath: 'id' })
      s.createIndex('day', 'day')
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  return dbp
}
async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db()
  return new Promise((res, rej) => {
    const r = fn(d.transaction(store, mode).objectStore(store))
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
export const all = <T>(s: 'tasks' | 'done') => tx<T[]>(s, 'readonly', st => st.getAll() as IDBRequest<T[]>)
export const put = (s: 'tasks' | 'done', v: Task | Done) => tx(s, 'readwrite', st => st.put(v))
export const del = (s: 'tasks' | 'done', id: string) => tx(s, 'readwrite', st => st.delete(id))
export async function persist() { try { await navigator.storage?.persist?.() } catch { /* ignore */ } }
