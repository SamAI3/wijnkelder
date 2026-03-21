import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal, X, User, Flag, Palette, Grape, CircleDollarSign, Building2 } from 'lucide-react'
import type { Filters } from '../../types'

interface FilterSectie {
  id: string
  label: string
  opties: { waarde: string; label: string }[]
  meervoud: boolean
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  landen: string[]
  kleuren: string[]
  druivensoorten: string[]
  wijnhuizen: string[]
}

function FilterChips({
  opties, geselecteerd, onToggle
}: { opties: { waarde: string; label: string }[]; geselecteerd: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 0 4px' }}>
      {opties.map(opt => {
        const actief = geselecteerd.includes(opt.waarde)
        return (
          <button
            key={opt.waarde}
            onClick={() => onToggle(opt.waarde)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: `1.5px solid ${actief ? '#8B1A2F' : '#e5e7eb'}`,
              background: actief ? '#8B1A2F' : 'white',
              color: actief ? 'white' : '#374151',
              fontSize: '0.82rem',
              fontWeight: actief ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function FilterPanel({ filters, onChange, landen, kleuren, druivensoorten, wijnhuizen }: Props) {
  const [open, setOpen] = useState(true)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleMulti(key: keyof Filters, waarde: string) {
    const arr = filters[key] as string[]
    const next = arr.includes(waarde) ? arr.filter(v => v !== waarde) : [...arr, waarde]
    onChange({ ...filters, [key]: next })
  }

  const prijsOpties = [
    { waarde: '<10', label: '< €10' },
    { waarde: '10-20', label: '€10–€20' },
    { waarde: '20-30', label: '€20–€30' },
    { waarde: '>30', label: '> €30' },
  ]

  const actieveFilters = [
    ...(filters.voorWie !== 'alle' ? [filters.voorWie] : []),
    ...filters.landen,
    ...filters.kleuren,
    ...filters.druivensoorten,
    ...filters.prijsklasse,
    ...filters.wijnhuizen,
  ].length

  function resetFilters() {
    onChange({ voorWie: 'alle', landen: [], kleuren: [], druivensoorten: [], prijsklasse: [], wijnhuizen: [] })
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} color="#8B1A2F" />
          <span style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.95rem' }}>Filters</span>
          {actieveFilters > 0 && (
            <span style={{
              background: '#8B1A2F', color: 'white', borderRadius: '10px',
              fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px',
            }}>{actieveFilters}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actieveFilters > 0 && (
            <button onClick={e => { e.stopPropagation(); resetFilters() }} style={{
              background: '#fdf2f4', border: 'none', borderRadius: '6px',
              padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', color: '#8B1A2F',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <X size={12} /> Reset
            </button>
          )}
          {open ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f3f4f6' }}>
          {/* Voor wie */}
          <FilterSectieComp
            label="Voor wie" icon={<User size={14} />}
            isOpen={openSections.has('voorwie')}
            onToggle={() => toggleSection('voorwie')}
          >
            <FilterChips
              opties={[
                { waarde: 'alle', label: 'Alle' },
                { waarde: 'samen', label: 'Samen' },
                { waarde: 'sam', label: 'Sam' },
                { waarde: 'riv', label: 'Riv' },
              ]}
              geselecteerd={[filters.voorWie]}
              onToggle={v => onChange({ ...filters, voorWie: v as Filters['voorWie'] })}
            />
          </FilterSectieComp>

          {/* Kleuren */}
          {kleuren.length > 0 && (
            <FilterSectieComp label="Kleur" icon={<Palette size={14} />} isOpen={openSections.has('kleur')} onToggle={() => toggleSection('kleur')}>
              <FilterChips
                opties={kleuren.map(k => ({ waarde: k, label: k }))}
                geselecteerd={filters.kleuren}
                onToggle={v => toggleMulti('kleuren', v)}
              />
            </FilterSectieComp>
          )}

          {/* Landen */}
          {landen.length > 0 && (
            <FilterSectieComp label="Landen" icon={<Flag size={14} />} isOpen={openSections.has('landen')} onToggle={() => toggleSection('landen')}>
              <FilterChips
                opties={landen.map(l => ({ waarde: l, label: l }))}
                geselecteerd={filters.landen}
                onToggle={v => toggleMulti('landen', v)}
              />
            </FilterSectieComp>
          )}

          {/* Prijsklasse */}
          <FilterSectieComp label="Prijsklasse" icon={<CircleDollarSign size={14} />} isOpen={openSections.has('prijs')} onToggle={() => toggleSection('prijs')}>
            <FilterChips
              opties={prijsOpties}
              geselecteerd={filters.prijsklasse}
              onToggle={v => toggleMulti('prijsklasse', v)}
            />
          </FilterSectieComp>

          {/* Druivensoorten */}
          {druivensoorten.length > 0 && (
            <FilterSectieComp label="Druivensoorten" icon={<Grape size={14} />} isOpen={openSections.has('druiven')} onToggle={() => toggleSection('druiven')}>
              <FilterChips
                opties={druivensoorten.map(d => ({ waarde: d, label: d }))}
                geselecteerd={filters.druivensoorten}
                onToggle={v => toggleMulti('druivensoorten', v)}
              />
            </FilterSectieComp>
          )}

          {/* Wijnhuizen */}
          {wijnhuizen.length > 0 && (
            <FilterSectieComp label="Wijnhuizen" icon={<Building2 size={14} />} isOpen={openSections.has('wijnhuizen')} onToggle={() => toggleSection('wijnhuizen')}>
              <FilterChips
                opties={wijnhuizen.map(w => ({ waarde: w, label: w }))}
                geselecteerd={filters.wijnhuizen}
                onToggle={v => toggleMulti('wijnhuizen', v)}
              />
            </FilterSectieComp>
          )}
        </div>
      )}
    </div>
  )
}

function FilterSectieComp({ label, icon, isOpen, onToggle, children }: {
  label: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
          <span style={{ color: '#8B1A2F' }}>{icon}</span>
          {label}
        </span>
        {isOpen ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
      </button>
      {isOpen && <div style={{ marginTop: '8px' }}>{children}</div>}
    </div>
  )
}
