import { useState } from 'react'
import { Wine, Lock } from 'lucide-react'

const WACHTWOORD = 'paspas321'
const STORAGE_KEY = 'wijnkelder_toegang'

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

interface Props {
  onSuccess: () => void
}

export function PasswordPage({ onSuccess }: Props) {
  const [input, setInput] = useState('')
  const [fout, setFout] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === WACHTWOORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      onSuccess()
    } else {
      setFout(true)
      setInput('')
      setTimeout(() => setFout(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAF8F5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 4px 24px rgba(139,26,47,0.12)',
        textAlign: 'center',
      }}>
        <div style={{
          background: '#8B1A2F',
          borderRadius: '50%',
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Wine size={32} color="white" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>
          Onze Wijnkelder
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 32px' }}>
          Voer het wachtwoord in om toegang te krijgen
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Wachtwoord"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: `2px solid ${fout ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                background: fout ? '#fef2f2' : 'white',
              }}
            />
          </div>
          {fout && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px' }}>
              Onjuist wachtwoord. Probeer opnieuw.
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#8B1A2F',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Toegang
          </button>
        </form>
      </div>
    </div>
  )
}
