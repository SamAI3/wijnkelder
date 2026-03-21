import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Wijnhuis } from '../types'

export function useWijnhuizen() {
  const [wijnhuizen, setWijnhuizen] = useState<Wijnhuis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'wijnhuizen'), orderBy('naam'))
    const unsub = onSnapshot(q, (snap) => {
      setWijnhuizen(snap.docs.map(d => ({ id: d.id, ...d.data() } as Wijnhuis)))
      setLoading(false)
    })
    return unsub
  }, [])

  async function addWijnhuis(wijnhuis: Omit<Wijnhuis, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'wijnhuizen'), wijnhuis)
    return ref.id
  }

  async function updateWijnhuis(id: string, data: Partial<Wijnhuis>) {
    await updateDoc(doc(db, 'wijnhuizen', id), data)
  }

  return { wijnhuizen, loading, addWijnhuis, updateWijnhuis }
}
