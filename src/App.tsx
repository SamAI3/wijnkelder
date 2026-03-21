import { useState, useEffect, useMemo } from 'react'
import { PasswordPage, isAuthenticated } from './components/auth/PasswordPage'
import { TabNavigation, type Tab } from './components/layout/TabNavigation'
import { KelderScreen } from './components/kelder/KelderScreen'
import { DashboardScreen } from './components/dashboard/DashboardScreen'
import { EtenScreen } from './components/eten/EtenScreen'
import { DetailPage } from './components/detail/DetailPage'
import { WijnFormModal } from './components/forms/WijnFormModal'
import { BewaaradviesBatch } from './components/BewaaradviesBatch'
import { useWijnen } from './hooks/useWijnen'
import { useWijnhuizen } from './hooks/useWijnhuizen'
import { seedDatabase } from './firebase/seed'
import type { Wijn } from './types'

type View = 'kelder' | 'detail' | 'form'

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [activeTab, setActiveTab] = useState<Tab>('kelder')
  const [view, setView] = useState<View>('kelder')
  const [selectedWijn, setSelectedWijn] = useState<Wijn | null>(null)
  const [seedKlaar, setSeedKlaar] = useState(false)
  const [batchNodig, setBatchNodig] = useState(false)
  const [batchKlaar, setBatchKlaar] = useState(false)
  const [seedFout, setSeedFout] = useState<string | null>(null)

  const { wijnen, loading: wijnenLoading, addWijn, updateWijn, deleteWijn } = useWijnen()
  const { wijnhuizen, addWijnhuis, updateWijnhuis } = useWijnhuizen()

  // Seed + batch bewaaradvies
  useEffect(() => {
    if (!authenticated) return
    seedDatabase()
      .then(({ seeded }) => {
        setSeedKlaar(true)
        if (seeded) {
          // Nieuwe database: batch bewaaradvies ophalen
          setBatchNodig(true)
        } else {
          setBatchKlaar(true)
        }
      })
      .catch(err => setSeedFout(err.message))
  }, [authenticated])

  // Dynamische filteropties
  const bekendeWijnhuizen = useMemo(() => [...new Set(wijnen.map(w => w.wijnhuis))].sort(), [wijnen])
  const bekeneDruivensoorten = useMemo(() => {
    const set = new Set<string>()
    wijnen.forEach(w => w.druivensoorten.forEach(d => set.add(d)))
    return [...set].sort()
  }, [wijnen])

  if (!authenticated) {
    return <PasswordPage onSuccess={() => setAuthenticated(true)} />
  }

  if (seedFout) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#FAF8F5' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', textAlign: 'center' }}>
          <h2 style={{ color: '#991b1b' }}>Firebase fout</h2>
          <p style={{ color: '#374151', fontSize: '0.9rem' }}>{seedFout}</p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Controleer je Firebase-configuratie in het .env bestand.</p>
        </div>
      </div>
    )
  }

  // Batch bewaaradvies scherm
  if (batchNodig && !batchKlaar) {
    return <BewaaradviesBatch onKlaar={() => { setBatchKlaar(true); setBatchNodig(false) }} />
  }

  async function handleWijnOpslaan(data: Omit<Wijn, 'id'>) {
    if (selectedWijn?.id) {
      await updateWijn(selectedWijn.id, data)
    } else {
      await addWijn(data)
    }
    setView('kelder')
    setSelectedWijn(null)
  }

  async function handleWijnVerwijderen() {
    if (selectedWijn?.id) {
      await deleteWijn(selectedWijn.id)
      setView('kelder')
      setSelectedWijn(null)
    }
  }

  async function handleSamenGedronken() {
    if (selectedWijn?.id && selectedWijn.flessenSamen > 0) {
      const nieuweAantal = selectedWijn.flessenSamen - 1
      await updateWijn(selectedWijn.id, { flessenSamen: nieuweAantal })
      setSelectedWijn(prev => prev ? { ...prev, flessenSamen: nieuweAantal } : prev)
    }
  }

  async function handleWijnhuisOpslaan(id: string, informatie: string) {
    await updateWijnhuis(id, { informatie })
  }

  async function handleNieuwWijnhuis(naam: string): Promise<string> {
    return addWijnhuis({ naam, informatie: '' })
  }

  const isLoading = !seedKlaar || wijnenLoading

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
      {/* Detail view */}
      {view === 'detail' && selectedWijn && (
        <DetailPage
          wijn={selectedWijn}
          onTerug={() => { setView('kelder'); setSelectedWijn(null) }}
          onBewerken={() => setView('form')}
          onVerwijderen={handleWijnVerwijderen}
          onSamenGedronken={handleSamenGedronken}
        />
      )}

      {/* Form view */}
      {view === 'form' && (
        <WijnFormModal
          wijn={selectedWijn ?? undefined}
          wijnhuizen={wijnhuizen}
          bekendeWijnhuizen={bekendeWijnhuizen}
          bekeneDruivensoorten={bekeneDruivensoorten}
          onOpslaan={handleWijnOpslaan}
          onAnnuleren={() => {
            setView(selectedWijn ? 'detail' : 'kelder')
            if (!selectedWijn) setSelectedWijn(null)
          }}
          onNieuwWijnhuis={handleNieuwWijnhuis}
        />
      )}

      {/* Tab content (verborgen als detail/form actief) */}
      {view === 'kelder' && (
        <>
          {isLoading ? (
            <div style={{ minHeight: '100dvh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px', height: '40px', border: '3px solid #f3f4f6',
                  borderTop: '3px solid #8B1A2F', borderRadius: '50%',
                  animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Kelder laden...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'kelder' && (
                <KelderScreen
                  wijnen={wijnen}
                  wijnhuizen={wijnhuizen}
                  onWijnToevoegen={() => { setSelectedWijn(null); setView('form') }}
                  onWijnDetail={(wijn) => { setSelectedWijn(wijn); setView('detail') }}
                  onWijnBewerken={(wijn) => { setSelectedWijn(wijn); setView('form') }}
                  onWijnhuisOpslaan={handleWijnhuisOpslaan}
                />
              )}
              {activeTab === 'dashboard' && <DashboardScreen wijnen={wijnen} />}
              {activeTab === 'eten' && <EtenScreen wijnen={wijnen} />}
              <TabNavigation activeTab={activeTab} onChange={setActiveTab} />
            </>
          )}
        </>
      )}
    </div>
  )
}
