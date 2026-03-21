export type WijnKleur = 'Rood' | 'Wit' | 'Rosé' | 'Oranje'

export interface Wijn {
  id?: string
  naam: string
  wijnhuis: string
  jaartal: number
  land: string
  kleur: WijnKleur
  druivensoorten: string[]
  prijs: number
  aankoopjaar: number
  smaakomschrijving: string
  flessenSamen: number
  flessenSam: number
  flessenRiv: number
  drinkVanaf?: number
  drinkVoor?: number
}

export interface Wijnhuis {
  id?: string
  naam: string
  informatie: string
}

export type BewaarStatus = 'perfect' | 'te_jong' | 'over_hoogtepunt' | 'onbekend'

export interface Filters {
  voorWie: 'alle' | 'samen' | 'sam' | 'riv'
  landen: string[]
  kleuren: string[]
  druivensoorten: string[]
  prijsklasse: string[]
  wijnhuizen: string[]
}
