import { useState, useRef, useEffect } from 'react'
import { X, Camera, Search, Loader2, Plus, ChevronDown } from 'lucide-react'
import type { Wijn, Wijnhuis, WijnKleur } from '../../types'
import { scanEtiket, opzoekWijn } from '../../utils/anthropic'

const KLEUREN: WijnKleur[] = ['Rood', 'Wit', 'Rosé', 'Oranje']

const BEKENDE_LANDEN = [
  'Frankrijk', 'Italië', 'Spanje', 'Portugal', 'Duitsland',
  'Nederland', 'Oostenrijk', 'Zuid-Afrika',
]

interface Props {
  wijn?: Wijn
  wijnhuizen: Wijnhuis[]
  bekendeWijnhuizen: string[]
  bekeneDruivensoorten: string[]
  onOpslaan: (data: Omit<Wijn, 'id'>) => Promise<void>
  onAnnuleren: () => void
  onNieuwWijnhuis: (naam: string) => Promise<string>
}

function leegFormulier(): Omit<Wijn, 'id'> {
  return {
    naam: '', wijnhuis: '', jaartal: new Date().getFullYear(),
    land: '', kleur: 'Rood', druivensoorten: [],
    prijs: 0, aankoopjaar: new Date().getFullYear(),
    smaakomschrijving: '', flessenSamen: 0, flessenSam: 0, flessenRiv: 0,
  }
}

export function WijnFormModal({ wijn, wijnhuizen, bekendeWijnhuizen, bekeneDruivensoorten, onOpslaan, onAnnuleren, onNieuwWijnhuis }: Props) {
  const [form, setForm] = useState<Omit<Wijn, 'id'>>(wijn ? {
    naam: wijn.naam, wijnhuis: wijn.wijnhuis, jaartal: wijn.jaartal,
    land: wijn.land, kleur: wijn.kleur, druivensoorten: [...wijn.druivensoorten],
    prijs: wijn.prijs, aankoopjaar: wijn.aankoopjaar,
    smaakomschrijving: wijn.smaakomschrijving, flessenSamen: wijn.flessenSamen,
    flessenSam: wijn.flessenSam, flessenRiv: wijn.flessenRiv,
    drinkVanaf: wijn.drinkVanaf, drinkVoor: wijn.drinkVoor,
  } : leegFormulier())

  const [bezig, setBezig] = useState(false)
  const [scanBezig, setScanBezig] = useState(false)
  const [opzoekBezig, setOpzoekBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [nieuwDruif, setNieuwDruif] = useState('')
  const [nieuwWijnhuis, setNieuwWijnhuis] = useState('')
  const [toonNieuwWijnhuis, setToonNieuwWijnhuis] = useState(false)
  const [toonNieuwLand, setToonNieuwLand] = useState(false)
  const [nieuwLand, setNieuwLand] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Alle bekende wijnhuizen inclusief nieuwe
  const alleWijnhuizen = [...new Set([...bekendeWijnhuizen, ...wijnhuizen.map(w => w.naam)])].sort()

  function set(key: keyof typeof form, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleDruif(druif: string) {
    setForm(prev => ({
      ...prev,
      druivensoorten: prev.druivensoorten.includes(druif)
        ? prev.druivensoorten.filter(d => d !== druif)
        : [...prev.druivensoorten, druif]
    }))
  }

  function voegDruifToe() {
    const d = nieuwDruif.trim()
    if (d && !form.druivensoorten.includes(d)) {
      setForm(prev => ({ ...prev, druivensoorten: [...prev.druivensoorten, d] }))
    }
    setNieuwDruif('')
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanBezig(true)
    setFout(null)
    try {
      const base64 = await fileToBase64(file)
      const result = await scanEtiket(base64, file.type)
      setForm(prev => ({
        ...prev,
        naam: result.naam ?? prev.naam,
        wijnhuis: result.wijnhuis ?? prev.wijnhuis,
        jaartal: result.jaartal ?? prev.jaartal,
        land: result.land ?? prev.land,
        druivensoorten: result.druivensoorten ?? prev.druivensoorten,
        smaakomschrijving: result.smaakomschrijving ?? prev.smaakomschrijving,
        drinkVanaf: result.drinkVanaf ?? prev.drinkVanaf,
        drinkVoor: result.drinkVoor ?? prev.drinkVoor,
      }))
    } catch (err) {
      setFout(`Foto-scan mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`)
    } finally {
      setScanBezig(false)
      e.target.value = ''
    }
  }

  async function handleOpzoeken() {
    if (!form.naam || !form.wijnhuis || !form.jaartal) {
      setFout('Vul naam, wijnhuis en jaartal in om op te zoeken.')
      return
    }
    setOpzoekBezig(true)
    setFout(null)
    try {
      const result = await opzoekWijn(form.naam, form.wijnhuis, form.jaartal)
      setForm(prev => ({
        ...prev,
        land: result.land ?? prev.land,
        druivensoorten: result.druivensoorten?.length ? result.druivensoorten : prev.druivensoorten,
        smaakomschrijving: result.smaakomschrijving ?? prev.smaakomschrijving,
        prijs: result.prijs ?? prev.prijs,
        drinkVanaf: result.drinkVanaf ?? prev.drinkVanaf,
        drinkVoor: result.drinkVoor ?? prev.drinkVoor,
      }))
    } catch (err) {
      setFout(`Opzoeken mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`)
    } finally {
      setOpzoekBezig(false)
    }
  }

  async function handleWijnhuisToevoegen() {
    const naam = nieuwWijnhuis.trim()
    if (!naam) return
    try {
      await onNieuwWijnhuis(naam)
      set('wijnhuis', naam)
      setNieuwWijnhuis('')
      setToonNieuwWijnhuis(false)
    } catch {
      setFout('Wijnhuis toevoegen mislukt')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.naam.trim() || !form.wijnhuis.trim() || !form.land.trim()) {
      setFout('Naam, wijnhuis en land zijn verplicht.')
      return
    }
    setBezig(true)
    setFout(null)
    try {
      await onOpslaan(form)
    } catch (err) {
      setFout(`Opslaan mislukt: ${err instanceof Error ? err.message : 'Onbekende fout'}`)
      setBezig(false)
    }
  }

  const alleBekenDruiven = [...new Set([...bekeneDruivensoorten])].sort()

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', zIndex: 300,
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#FAF8F5', minHeight: '100dvh',
        width: '100%', maxWidth: '640px', margin: '0 auto',
        paddingBottom: '40px',
      }}>
        {/* Header */}
        <div style={{
          background: '#8B1A2F', color: 'white',
          padding: '16px', position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {wijn ? 'Wijn bewerken' : 'Wijn toevoegen'}
          </h2>
          <button onClick={onAnnuleren} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex',
          }}>
            <X size={20} color="white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {fout && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              fontSize: '0.88rem', color: '#991b1b',
            }}>
              {fout}
            </div>
          )}

          {/* AI acties */}
          <div style={{
            background: 'white', borderRadius: '12px', padding: '16px',
            marginBottom: '16px', border: '1px solid #f0ebe7',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
              Automatisch invullen met AI
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={scanBezig}
                style={aiKnopStijl(scanBezig)}
              >
                {scanBezig ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={14} />}
                {scanBezig ? 'Scannen...' : 'Foto scannen'}
              </button>
              <button
                type="button"
                onClick={handleOpzoeken}
                disabled={opzoekBezig}
                style={aiKnopStijl(opzoekBezig)}
              >
                {opzoekBezig ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                {opzoekBezig ? 'Opzoeken...' : 'Naam opzoeken'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
          </div>

          {/* Basisinfo */}
          <Sectie titel="Basisinformatie">
            <VeldLabel>Naam *</VeldLabel>
            <input value={form.naam} onChange={e => set('naam', e.target.value)}
              placeholder="Naam van de wijn" style={inputStijl} />

            <VeldLabel>Wijnhuis *</VeldLabel>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <select
                  value={form.wijnhuis}
                  onChange={e => set('wijnhuis', e.target.value)}
                  style={{ ...inputStijl, appearance: 'none', paddingRight: '32px' }}
                >
                  <option value="">Selecteer wijnhuis</option>
                  {alleWijnhuizen.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <button type="button" onClick={() => setToonNieuwWijnhuis(v => !v)} style={{
                padding: '10px 12px', background: '#fdf2f4', border: '2px solid #8B1A2F',
                borderRadius: '8px', cursor: 'pointer', color: '#8B1A2F', flexShrink: 0,
              }}>
                <Plus size={16} />
              </button>
            </div>
            {toonNieuwWijnhuis && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  value={nieuwWijnhuis}
                  onChange={e => setNieuwWijnhuis(e.target.value)}
                  placeholder="Naam nieuw wijnhuis"
                  style={{ ...inputStijl, flex: 1, marginBottom: 0 }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleWijnhuisToevoegen())}
                />
                <button type="button" onClick={handleWijnhuisToevoegen} style={{
                  padding: '10px 14px', background: '#8B1A2F', border: 'none',
                  borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, flexShrink: 0,
                }}>
                  Toevoegen
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <VeldLabel>Jaartal</VeldLabel>
                <input type="number" value={form.jaartal} onChange={e => set('jaartal', Number(e.target.value))}
                  style={inputStijl} min={1900} max={2099} />
              </div>
              <div>
                <VeldLabel>Aankoopjaar</VeldLabel>
                <input type="number" value={form.aankoopjaar} onChange={e => set('aankoopjaar', Number(e.target.value))}
                  style={inputStijl} min={1900} max={2099} />
              </div>
            </div>

            <VeldLabel>Land *</VeldLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <select
                  value={BEKENDE_LANDEN.includes(form.land) ? form.land : (form.land ? '__custom' : '')}
                  onChange={e => {
                    if (e.target.value === '__custom') { setToonNieuwLand(true) }
                    else { set('land', e.target.value); setToonNieuwLand(false) }
                  }}
                  style={{ ...inputStijl, appearance: 'none', paddingRight: '32px' }}
                >
                  <option value="">Selecteer land</option>
                  {BEKENDE_LANDEN.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="__custom">Ander land...</option>
                </select>
                <ChevronDown size={16} color="#6b7280" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            {(toonNieuwLand || (!BEKENDE_LANDEN.includes(form.land) && form.land)) && (
              <input
                value={form.land}
                onChange={e => set('land', e.target.value)}
                placeholder="Naam van het land"
                style={{ ...inputStijl, marginTop: '8px' }}
              />
            )}

            <VeldLabel>Kleur</VeldLabel>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {KLEUREN.map(k => (
                <button
                  key={k} type="button"
                  onClick={() => set('kleur', k)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                    border: `2px solid ${form.kleur === k ? '#8B1A2F' : '#e5e7eb'}`,
                    background: form.kleur === k ? '#8B1A2F' : 'white',
                    color: form.kleur === k ? 'white' : '#374151',
                    fontSize: '0.88rem', fontWeight: 500,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </Sectie>

          {/* Druivensoorten */}
          <Sectie titel="Druivensoorten">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {form.druivensoorten.map(d => (
                <button
                  key={d} type="button"
                  onClick={() => toggleDruif(d)}
                  style={{
                    padding: '4px 10px', borderRadius: '20px',
                    border: '2px solid #8B1A2F', background: '#8B1A2F',
                    color: 'white', fontSize: '0.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  {d} <X size={11} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {alleBekenDruiven.filter(d => !form.druivensoorten.includes(d)).slice(0, 20).map(d => (
                <button
                  key={d} type="button"
                  onClick={() => toggleDruif(d)}
                  style={{
                    padding: '4px 10px', borderRadius: '20px',
                    border: '1.5px solid #e5e7eb', background: 'white',
                    color: '#374151', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={nieuwDruif}
                onChange={e => setNieuwDruif(e.target.value)}
                placeholder="Druivensoort toevoegen..."
                style={{ ...inputStijl, flex: 1, marginBottom: 0 }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), voegDruifToe())}
              />
              <button type="button" onClick={voegDruifToe} style={{
                padding: '10px 14px', background: '#fdf2f4', border: '2px solid #8B1A2F',
                borderRadius: '8px', cursor: 'pointer', color: '#8B1A2F', flexShrink: 0,
              }}>
                <Plus size={16} />
              </button>
            </div>
          </Sectie>

          {/* Details */}
          <Sectie titel="Details">
            <VeldLabel>Prijs (€)</VeldLabel>
            <input type="number" value={form.prijs} onChange={e => set('prijs', parseFloat(e.target.value) || 0)}
              style={inputStijl} min={0} step={0.01} />

            <VeldLabel>Smaakomschrijving</VeldLabel>
            <textarea
              value={form.smaakomschrijving}
              onChange={e => set('smaakomschrijving', e.target.value)}
              rows={4}
              placeholder="Beschrijf de smaak, aroma's, karakter..."
              style={{ ...inputStijl, resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <VeldLabel>Drink vanaf (jaar)</VeldLabel>
                <input type="number" value={form.drinkVanaf ?? ''} onChange={e => set('drinkVanaf', e.target.value ? Number(e.target.value) : undefined)}
                  style={inputStijl} min={1980} max={2099} placeholder="bv. 2024" />
              </div>
              <div>
                <VeldLabel>Drink voor (jaar)</VeldLabel>
                <input type="number" value={form.drinkVoor ?? ''} onChange={e => set('drinkVoor', e.target.value ? Number(e.target.value) : undefined)}
                  style={inputStijl} min={1980} max={2099} placeholder="bv. 2030" />
              </div>
            </div>
          </Sectie>

          {/* Voorraad */}
          <Sectie titel="Voorraad">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {(['flessenSamen', 'flessenSam', 'flessenRiv'] as const).map((veld, i) => (
                <div key={veld}>
                  <VeldLabel>{['Samen', 'Sam', 'Riv'][i]}</VeldLabel>
                  <input
                    type="number" value={form[veld]}
                    onChange={e => set(veld, Math.max(0, parseInt(e.target.value) || 0))}
                    style={inputStijl} min={0}
                  />
                </div>
              ))}
            </div>
          </Sectie>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onAnnuleren} style={{
              flex: 1, padding: '13px', border: '2px solid #e5e7eb', borderRadius: '10px',
              background: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#374151',
            }}>
              Annuleren
            </button>
            <button type="submit" disabled={bezig} style={{
              flex: 2, padding: '13px', border: 'none', borderRadius: '10px',
              background: '#8B1A2F', color: 'white', fontSize: '0.95rem', fontWeight: 600,
              cursor: bezig ? 'not-allowed' : 'pointer', opacity: bezig ? 0.7 : 1,
            }}>
              {bezig ? 'Opslaan...' : (wijn ? 'Wijzigingen opslaan' : 'Wijn toevoegen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '16px',
      marginBottom: '12px', border: '1px solid #f0ebe7',
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{titel}</h3>
      {children}
    </div>
  )
}

function VeldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: '0.82rem', fontWeight: 600,
      color: '#6b7280', marginBottom: '5px', marginTop: '12px',
    }}>
      {children}
    </label>
  )
}

const inputStijl: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '2px solid #e5e7eb', borderRadius: '8px',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  background: 'white', marginBottom: '0',
  fontFamily: 'inherit',
}

function aiKnopStijl(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '9px 14px', background: disabled ? '#f3f4f6' : '#fdf2f4',
    border: `2px solid ${disabled ? '#e5e7eb' : '#8B1A2F'}`,
    borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#9ca3af' : '#8B1A2F',
    fontSize: '0.88rem', fontWeight: 600,
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
