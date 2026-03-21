import { Wine, BarChart2, Utensils } from 'lucide-react'

export type Tab = 'kelder' | 'dashboard' | 'eten'

interface Props {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

export function TabNavigation({ activeTab, onChange }: Props) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'kelder', label: 'Kelder', icon: <Wine size={22} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={22} /> },
    { id: 'eten', label: 'Wat eten we?', icon: <Utensils size={22} /> },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1a0a0f',
      borderTop: '1px solid #3d1a24',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '10px 0 8px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === tab.id ? '#8B1A2F' : '#9ca3af',
            transition: 'color 0.2s',
          }}
        >
          {tab.icon}
          <span style={{ fontSize: '0.7rem', fontWeight: activeTab === tab.id ? 600 : 400 }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
