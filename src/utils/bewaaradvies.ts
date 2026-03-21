import type { BewaarStatus, Wijn } from '../types'

export function getBewaarStatus(wijn: Wijn): BewaarStatus {
  const huidigJaar = new Date().getFullYear()
  if (!wijn.drinkVanaf || !wijn.drinkVoor || wijn.drinkVanaf === 0 || wijn.drinkVoor === 0) return 'onbekend'
  if (huidigJaar < wijn.drinkVanaf) return 'te_jong'
  if (huidigJaar > wijn.drinkVoor) return 'over_hoogtepunt'
  return 'perfect'
}

export function getBewaarLabel(status: BewaarStatus): string {
  switch (status) {
    case 'perfect': return '🟢 Nu perfect'
    case 'te_jong': return '🟡 Nog te jong'
    case 'over_hoogtepunt': return '🔴 Over hoogtepunt'
    case 'onbekend': return '⚪ Onbekend'
  }
}

export function getBewaarColor(status: BewaarStatus): string {
  switch (status) {
    case 'perfect': return '#166534'
    case 'te_jong': return '#854d0e'
    case 'over_hoogtepunt': return '#991b1b'
    case 'onbekend': return '#6b7280'
  }
}

export function getBewaarBg(status: BewaarStatus): string {
  switch (status) {
    case 'perfect': return '#dcfce7'
    case 'te_jong': return '#fef9c3'
    case 'over_hoogtepunt': return '#fee2e2'
    case 'onbekend': return '#f3f4f6'
  }
}
