# Onze Wijnkelder

## Stack
- Vite + React + TypeScript
- Firebase/Firestore (project: wijnkelder-d095f)
- Anthropic API (claude-sonnet-4-20250514, dangerouslyAllowBrowser)
- Lucide icons, mobiel-first
- Kleurenschema: dieprood #8B1A2F, crème #FAF8F5

## Live
- URL: https://onzewijnkelder.netlify.app
- GitHub: https://github.com/SamAI3/wijnkelder
- Deploy: git push → Netlify auto-deployt

## Structuur
- src/components/kelder/ — overzicht, filters, wijnkaarten
- src/components/detail/ — detailpagina
- src/components/forms/ — toevoegen/bewerken formulier
- src/components/dashboard/ — statistieken
- src/components/eten/ — wijnadvies bij maaltijd
- src/utils/anthropic.ts — alle Anthropic API calls
- src/firebase/ — config en seed
- src/types/ — TypeScript types

## Datamodel
Collectie `wijnen`: naam, wijnhuis, jaartal, land, kleur, druivensoorten, prijs, aankoopjaar, smaakomschrijving, flessenSamen, flessenSam, flessenRiv, drinkVanaf, drinkVoor
Collectie `wijnhuizen`: naam, informatie

## Ontwerpprincipes
- Altijd Nederlands
- Mobiel-first
- Geen externe chart-bibliotheken (SVG/CSS)
- JSON responses van Anthropic API, nooit platte tekst
