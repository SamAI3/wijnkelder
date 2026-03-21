import { useState } from 'react'
import { ArrowLeft, Edit2, Trash2, Minus, Wine, Building2, MapPin, Grape, Calendar, Euro } from 'lucide-react'
import type { Wijn } from '../../types'
import { getBewaarStatus, getBewaarLabel, getBewaarBg, getBewaarColor } from '../../utils/bewaaradvies'
import { getFlag } from '../../utils/flags'

interface Props {
  wijn: Wijn
  onTerug: () => void
  onBewerken: () => void
  onVerwijderen: () => Promise<void>
  onSamenGedronken: () => Promise<void>
}

export function DetailPage({ wijn, onTerug, onBewerken, onVerwijderen, onSamenGedronken }: Props) {
  const [bevestigVerwijder, setBevestigVerwijder] = useState(false)
  const [bezig, setBezig] = useState(false)

  const status = getBewaarStatus(wijn)
  const totaal = wijn.flessenSamen + wijn.flessenSam + wijn.flessenRiv

  async function handleVerwijder() {
    setBezig(true)
    try {
      await onVerwijderen()
    } finally {
      setBezig(false)
    }
  }

  async function handleSamen() {
    if (wijn.flessenSamen === 0) return
    setBezig(true)
    try {
      await onSamenGedronken()
    } finally {
      setBezig(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{
        background: '#8B1A2F', color: 'white',
        padding: '16px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onTerug} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
            padding: '8px', cursor: 'pointer', display: 'flex',
          }}>
            <ArrowLeft size={20} color="white" />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1, lineHeight: 1.3 }}>
            {wijn.naam}
          </h1>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {/* Bewaaradvies blok */}
        {status !== 'onbekend' && (
        <div style={{
          background: getBewaarBg(status),
          borderRadius: '12px', padding: '16px', marginBottom: '16px',
          border: `1.5px solid ${getBewaarColor(status)}30`,
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: getBewaarColor(status), marginBottom: '4px' }}>
            {getBewaarLabel(status)}
          </div>
          {wijn.drinkVanaf && wijn.drinkVoor && (
            <div style={{ fontSize: '0.88rem', color: '#374151' }}>
              Drink tussen <strong>{wijn.drinkVanaf}</strong> en <strong>{wijn.drinkVoor}</strong>
            </div>
          )}
        </div>
        )}

        {/* Hoofdinfo */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <InfoRij icon={<Wine size={16} color="#8B1A2F" />} label="Wijn" value={wijn.naam} />
          <InfoRij icon={<Building2 size={16} color="#8B1A2F" />} label="Wijnhuis" value={wijn.wijnhuis} />
          <InfoRij icon={<Calendar size={16} color="#8B1A2F" />} label="Jaartal" value={String(wijn.jaartal)} />
          <InfoRij icon={<MapPin size={16} color="#8B1A2F" />} label="Land" value={`${getFlag(wijn.land)} ${wijn.land}`} />
          <InfoRij icon={<Wine size={16} color="#8B1A2F" />} label="Kleur" value={wijn.kleur} />
          <InfoRij icon={<Grape size={16} color="#8B1A2F" />} label="Druivensoorten" value={wijn.druivensoorten.join(', ')} />
          <InfoRij icon={<Euro size={16} color="#8B1A2F" />} label="Prijs" value={`€${wijn.prijs.toFixed(2)}`} />
          <InfoRij icon={<Calendar size={16} color="#8B1A2F" />} label="Aankoopjaar" value={String(wijn.aankoopjaar)} />
          {wijn.smaakomschrijving && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Smaakomschrijving
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                {wijn.smaakomschrijving}
              </p>
            </div>
          )}
        </div>

        {/* Voorraad */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a' }}>Voorraad</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Totaal', count: totaal },
              { label: 'Samen', count: wijn.flessenSamen },
              { label: 'Sam', count: wijn.flessenSam },
              { label: 'Riv', count: wijn.flessenRiv },
            ].map(({ label, count }) => (
              <div key={label} style={{
                background: '#faf8f5', borderRadius: '10px', padding: '12px 8px',
                textAlign: 'center', border: '1px solid #f0ebe7',
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8B1A2F' }}>{count}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSamen}
            disabled={wijn.flessenSamen === 0 || bezig}
            style={{
              width: '100%', padding: '11px', border: '2px solid #8B1A2F',
              borderRadius: '8px', background: 'white', cursor: wijn.flessenSamen === 0 ? 'not-allowed' : 'pointer',
              color: '#8B1A2F', fontSize: '0.9rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              opacity: wijn.flessenSamen === 0 ? 0.4 : 1,
            }}
          >
            <Minus size={16} /> Samen fles gedronken
          </button>
        </div>

        {/* Acties */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onBewerken} style={{
            flex: 1, padding: '13px', border: 'none', borderRadius: '10px',
            background: '#8B1A2F', color: 'white', fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <Edit2 size={16} /> Bewerken
          </button>
          <button onClick={() => setBevestigVerwijder(true)} style={{
            padding: '13px 18px', border: 'none', borderRadius: '10px',
            background: '#fee2e2', color: '#991b1b', fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Verwijder bevestiging */}
      {bevestigVerwijder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '24px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '320px',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#1a1a1a' }}>Wijn verwijderen?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem' }}>
              Weet je zeker dat je <strong>{wijn.naam}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setBevestigVerwijder(false)} style={{
                flex: 1, padding: '11px', border: '2px solid #e5e7eb', borderRadius: '8px',
                background: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#374151',
              }}>
                Annuleren
              </button>
              <button onClick={handleVerwijder} disabled={bezig} style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '8px',
                background: '#ef4444', color: 'white', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: 600, opacity: bezig ? 0.7 : 1,
              }}>
                {bezig ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRij({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '8px 0', borderBottom: '1px solid #f9fafb',
    }}>
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, marginBottom: '1px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}
