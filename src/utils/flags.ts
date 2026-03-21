const flagMap: Record<string, string> = {
  'Frankrijk': '🇫🇷',
  'Spanje': '🇪🇸',
  'Portugal': '🇵🇹',
  'Italië': '🇮🇹',
  'Nederland': '🇳🇱',
  'Duitsland': '🇩🇪',
  'Zuid-Afrika': '🇿🇦',
  'Oostenrijk': '🇦🇹',
}

export function getFlag(land: string): string {
  return flagMap[land] ?? '🍷'
}
