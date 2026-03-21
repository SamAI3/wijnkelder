import { Info, Edit2, ChevronRight } from 'lucide-react'
import type { Wijn, Wijnhuis } from '../../types'
import { getBewaarStatus, getBewaarLabel, getBewaarBg, getBewaarColor } from '../../utils/bewaaradvies'
import { getFlag } from '../../utils/flags'

const kleurBadge: Record<string, { bg: string; color: string }> = {
  'Rood': { bg: '#fce7ef', color: '#8B1A2F' },
  'Wit': { bg: '#fef9c3', color: '#854d0e' },
  'Rosé': { bg: '#fce7f3', color: '#9d174d' },
  'Oranje': { bg: '#ffedd5', color: '#c2410c' },
}

interface Props {
  wijn: Wijn
  wijnhuis?: Wijnhuis
  onDetail: () => void
  onEdit: () => void
  onWijnhuisClick: () => void
}

export function WijnKaart({ wijn, wijnhuis: wijnhuisObj, onDetail, onEdit, onWijnhuisClick }: Props) {
  const status = getBewaarStatus(wijn)
  const badge = kleurBadge[wijn.kleur] ?? { bg: '#f3f4f6', color: '#374151' }
  const totaalFlessen = wijn.flessenSamen + wijn.flessenSam + wijn.flessenRiv

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #f0ebe7',
    }}>
      {/* Header rij */}
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>
          {wijn.naam}
          <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#9ca3af', marginLeft: '6px' }}>
            · {wijn.jaartal}
          </span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onWijnhuisClick}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: '0.82rem', color: '#8B1A2F', fontWeight: 500,
              textDecoration: 'underline', textDecorationColor: 'rgba(139,26,47,0.3)',
            }}
          >
            {wijn.wijnhuis}
          </button>
          {wijnhuisObj && (
            <button onClick={onWijnhuisClick} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', display: 'flex' }}>
              <Info size={13} color="#8B1A2F" />
            </button>
          )}
        </div>
      </div>

      {/* Badges rij */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        <span style={{
          background: badge.bg, color: badge.color,
          borderRadius: '20px', padding: '2px 10px',
          fontSize: '0.78rem', fontWeight: 600,
        }}>
          {wijn.kleur}
        </span>
        {status !== 'onbekend' && (
          <span style={{
            background: getBewaarBg(status), color: getBewaarColor(status),
            borderRadius: '20px', padding: '2px 10px',
            fontSize: '0.78rem', fontWeight: 500,
          }}>
            {getBewaarLabel(status)}
          </span>
        )}
        {wijn.drinkVanaf && wijn.drinkVoor && (
          <span style={{
            background: '#f3f4f6', color: '#6b7280',
            borderRadius: '20px', padding: '2px 10px',
            fontSize: '0.75rem',
          }}>
            {wijn.drinkVanaf}–{wijn.drinkVoor}
          </span>
        )}
      </div>

      {/* Info rij */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
          {getFlag(wijn.land)} {wijn.land}
        </span>
        <span style={{ color: '#d1d5db' }}>·</span>
        <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>€{wijn.prijs.toFixed(2)}</span>
      </div>

      {wijn.druivensoorten.length > 0 && (
        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#6b7280' }}>
          {wijn.druivensoorten.join(', ')}
        </p>
      )}

      {wijn.smaakomschrijving && (
        <p style={{
          margin: '0 0 12px', fontSize: '0.85rem', color: '#374151',
          lineHeight: 1.5, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {wijn.smaakomschrijving}
        </p>
      )}

      {/* Voorraad */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '12px',
        background: '#faf8f5', borderRadius: '8px', padding: '8px',
      }}>
        {wijn.flessenSamen > 0 && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#8B1A2F' }}>{wijn.flessenSamen}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Samen</div>
          </div>
        )}
        {wijn.flessenSam > 0 && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#8B1A2F' }}>{wijn.flessenSam}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Sam</div>
          </div>
        )}
        {wijn.flessenRiv > 0 && (
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#8B1A2F' }}>{wijn.flessenRiv}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Riv</div>
          </div>
        )}
        {totaalFlessen === 0 && (
          <span style={{ fontSize: '0.82rem', color: '#9ca3af', flex: 1 }}>Geen flessen op voorraad</span>
        )}
        {totaalFlessen > 0 && (
          <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e5e7eb', marginLeft: '4px', paddingLeft: '8px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>{totaalFlessen}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Totaal</div>
          </div>
        )}
      </div>

      {/* Knoppen */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onDetail} style={{
          flex: 1, padding: '9px', border: '2px solid #8B1A2F',
          borderRadius: '8px', background: 'white', cursor: 'pointer',
          color: '#8B1A2F', fontSize: '0.88rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          Details <ChevronRight size={14} />
        </button>
        <button onClick={onEdit} style={{
          flex: 1, padding: '9px', border: 'none',
          borderRadius: '8px', background: '#8B1A2F', cursor: 'pointer',
          color: 'white', fontSize: '0.88rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <Edit2 size={14} /> Bewerken
        </button>
      </div>
    </div>
  )
}
