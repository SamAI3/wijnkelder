import { useState } from 'react'
import { X, Building2, Save } from 'lucide-react'
import type { Wijnhuis } from '../../types'

interface Props {
  wijnhuis: Wijnhuis
  onClose: () => void
  onSave: (informatie: string) => Promise<void>
}

export function WijnhuisModal({ wijnhuis, onClose, onSave }: Props) {
  const [tekst, setTekst] = useState(wijnhuis.informatie)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(tekst)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200, padding: '0',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        padding: '24px', width: '100%', maxWidth: '640px',
        maxHeight: '80dvh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#fdf2f4', borderRadius: '10px', padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={20} color="#8B1A2F" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>
              {wijnhuis.naam}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Notities over dit wijnhuis
        </label>
        <textarea
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          rows={5}
          placeholder="Voeg notities toe over dit wijnhuis..."
          style={{
            width: '100%', border: '2px solid #e5e7eb', borderRadius: '8px',
            padding: '10px', fontSize: '0.95rem', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', border: '2px solid #e5e7eb',
            borderRadius: '8px', background: 'white', cursor: 'pointer',
            fontSize: '0.95rem', fontWeight: 600, color: '#374151',
          }}>
            Annuleren
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '12px', border: 'none',
            borderRadius: '8px', background: '#8B1A2F', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem', fontWeight: 600, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            opacity: saving ? 0.7 : 1,
          }}>
            <Save size={16} />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
