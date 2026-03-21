import { useState, useMemo } from 'react'
import { Wine, Plus } from 'lucide-react'
import type { Wijn, Wijnhuis, Filters } from '../../types'
import { WijnKaart } from './WijnKaart'
import { FilterPanel } from './FilterPanel'
import { WijnhuisModal } from './WijnhuisModal'

interface Props {
  wijnen: Wijn[]
  wijnhuizen: Wijnhuis[]
  onWijnToevoegen: () => void
  onWijnDetail: (wijn: Wijn) => void
  onWijnBewerken: (wijn: Wijn) => void
  onWijnhuisOpslaan: (id: string, informatie: string) => Promise<void>
}

function matchesPrijsklasse(prijs: number, klassen: string[]): boolean {
  if (klassen.length === 0) return true
  return klassen.some(k => {
    if (k === '<10') return prijs < 10
    if (k === '10-20') return prijs >= 10 && prijs < 20
    if (k === '20-30') return prijs >= 20 && prijs < 30
    if (k === '>30') return prijs >= 30
    return false
  })
}

export function KelderScreen({ wijnen, wijnhuizen, onWijnToevoegen, onWijnDetail, onWijnBewerken, onWijnhuisOpslaan }: Props) {
  const [tab, setTab] = useState<'voorraad' | 'leeg'>('voorraad')
  const [filters, setFilters] = useState<Filters>({
    voorWie: 'alle', landen: [], kleuren: [], druivensoorten: [], prijsklasse: [], wijnhuizen: []
  })
  const [wijnhuisModal, setWijnhuisModal] = useState<Wijnhuis | null>(null)

  // Dynamische filteropties vanuit data
  const wijnhuisNamen = useMemo(() => {
    const namen = new Set(wijnen.map(w => w.wijnhuis))
    return [...namen].sort()
  }, [wijnen])

  const landen = useMemo(() => [...new Set(wijnen.map(w => w.land))].sort(), [wijnen])
  const kleuren = useMemo(() => [...new Set(wijnen.map(w => w.kleur))].sort(), [wijnen])
  const druivensoorten = useMemo(() => {
    const set = new Set<string>()
    wijnen.forEach(w => w.druivensoorten.forEach(d => set.add(d)))
    return [...set].sort()
  }, [wijnen])

  const gefilterd = useMemo(() => {
    return wijnen.filter(w => {
      const totaal = w.flessenSamen + w.flessenSam + w.flessenRiv
      const opVoorraad = totaal > 0
      if (tab === 'voorraad' && !opVoorraad) return false
      if (tab === 'leeg' && opVoorraad) return false

      if (filters.voorWie === 'samen' && w.flessenSamen === 0) return false
      if (filters.voorWie === 'sam' && w.flessenSam === 0) return false
      if (filters.voorWie === 'riv' && w.flessenRiv === 0) return false

      if (filters.landen.length > 0 && !filters.landen.includes(w.land)) return false
      if (filters.kleuren.length > 0 && !filters.kleuren.includes(w.kleur)) return false
      if (filters.wijnhuizen.length > 0 && !filters.wijnhuizen.includes(w.wijnhuis)) return false
      if (filters.druivensoorten.length > 0 && !filters.druivensoorten.some(d => w.druivensoorten.includes(d))) return false
      if (!matchesPrijsklasse(w.prijs, filters.prijsklasse)) return false

      return true
    })
  }, [wijnen, tab, filters])

  function getWijnhuis(naam: string): Wijnhuis | undefined {
    return wijnhuizen.find(wh => wh.naam === naam)
  }

  function handleWijnhuisClick(wijnNaam: string) {
    const wh = getWijnhuis(wijnNaam)
    if (wh) setWijnhuisModal(wh)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', paddingBottom: '100px' }}>
      {/* Header */}
      <header style={{
        background: '#8B1A2F', color: 'white',
        padding: '16px 16px 20px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wine size={24} color="white" />
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Onze Wijnkelder</h1>
          </div>
          <button
            onClick={onWijnToevoegen}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', color: 'white', padding: '8px 12px',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Wijn toevoegen
          </button>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {/* Filter panel */}
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          landen={landen}
          kleuren={kleuren}
          druivensoorten={druivensoorten}
          wijnhuizen={wijnhuisNamen}
        />

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'white', borderRadius: '10px',
          padding: '4px', marginBottom: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {(['voorraad', 'leeg'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                background: tab === t ? '#8B1A2F' : 'transparent',
                color: tab === t ? 'white' : '#6b7280',
                fontSize: '0.9rem', fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {t === 'voorraad' ? 'Op voorraad' : 'Niet op voorraad'}
            </button>
          ))}
        </div>

        {/* Lijst */}
        {gefilterd.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'white', borderRadius: '12px',
          }}>
            <Wine size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Geen wijnen gevonden</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              {tab === 'voorraad'
                ? 'Voeg je eerste wijn toe of pas de filters aan.'
                : 'Alle flessen zijn nog op voorraad — mooi!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gefilterd.map(wijn => (
              <WijnKaart
                key={wijn.id}
                wijn={wijn}
                wijnhuis={getWijnhuis(wijn.wijnhuis)}
                onDetail={() => onWijnDetail(wijn)}
                onEdit={() => onWijnBewerken(wijn)}
                onWijnhuisClick={() => handleWijnhuisClick(wijn.wijnhuis)}
              />
            ))}
          </div>
        )}
      </div>

      {wijnhuisModal && (
        <WijnhuisModal
          wijnhuis={wijnhuisModal}
          onClose={() => setWijnhuisModal(null)}
          onSave={async (informatie) => {
            if (wijnhuisModal.id) await onWijnhuisOpslaan(wijnhuisModal.id, informatie)
          }}
        />
      )}
    </div>
  )
}
