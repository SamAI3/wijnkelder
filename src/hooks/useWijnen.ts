import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Wijn } from '../types'

export function useWijnen() {
  const [wijnen, setWijnen] = useState<Wijn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'wijnen'), orderBy('naam'))
    const unsub = onSnapshot(q, (snap) => {
      setWijnen(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wijn)))
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [])

  async function addWijn(wijn: Omit<Wijn, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'wijnen'), wijn)
    return ref.id
  }

  async function updateWijn(id: string, data: Partial<Wijn>) {
    await updateDoc(doc(db, 'wijnen', id), data)
  }

  async function deleteWijn(id: string) {
    await deleteDoc(doc(db, 'wijnen', id))
  }

  return { wijnen, loading, error, addWijn, updateWijn, deleteWijn }
}
