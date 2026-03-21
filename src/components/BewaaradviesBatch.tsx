import { useEffect, useState, useRef } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { schatDrinkvenster } from '../utils/anthropic'
import { Loader2 } from 'lucide-react'

interface Props {
  onKlaar: () => void
}

export function BewaaradviesBatch({ onKlaar }: Props) {
  const [voortgang, setVoortgang] = useState({ verwerkt: 0, totaal: 0 })
  const [bezig, setBezig] = useState(true)
  const gestart = useRef(false)

  useEffect(() => {
    if (gestart.current) return
    gestart.current = true
    runBatch()
  }, [])

  async function runBatch() {
    try {
      const snap = await getDocs(collection(db, 'wijnen'))
      const teVerwerken = snap.docs.filter(d => {
        const data = d.data()
        return !data.drinkVanaf || !data.drinkVoor
      })

      if (teVerwerken.length === 0) {
        setBezig(false)
        onKlaar()
        return
      }

      setVoortgang({ verwerkt: 0, totaal: teVerwerken.length })

      const BATCH = 5
      for (let i = 0; i < teVerwerken.length; i += BATCH) {
        const chunk = teVerwerken.slice(i, i + BATCH)
        await Promise.all(chunk.map(async (d) => {
          const data = d.data()
          try {
            const advies = await schatDrinkvenster(
              data.naam, data.wijnhuis, data.land, data.druivensoorten ?? [], data.jaartal
            )
            await updateDoc(doc(db, 'wijnen', d.id), {
              drinkVanaf: advies.drinkVanaf,
              drinkVoor: advies.drinkVoor,
            })
          } catch {
            // Sla over bij fout, niet blokkeren
          }
        }))
        setVoortgang(prev => ({ ...prev, verwerkt: Math.min(i + BATCH, teVerwerken.length) }))
      }
    } catch {
      // Ignore errors, proceed
    } finally {
      setBezig(false)
      onKlaar()
    }
  }

  if (!bezig) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(139,26,47,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, color: 'white', gap: '20px', padding: '32px',
    }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
          Bewaaradvies ophalen...
        </div>
        {voortgang.totaal > 0 && (
          <>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '12px' }}>
              {voortgang.verwerkt} van {voortgang.totaal} wijnen verwerkt
            </div>
            <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', margin: '0 auto' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((voortgang.verwerkt / voortgang.totaal) * 100)}%`,
                background: 'white', borderRadius: '3px', transition: 'width 0.4s ease',
              }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
