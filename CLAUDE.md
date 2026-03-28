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

## Beveiliging
- Anthropic API-calls lopen via een Netlify Function proxy (netlify/functions/claude.ts)
- De ANTHROPIC_API_KEY staat alleen server-side (geen VITE_ prefix, niet in de frontend bundle)
- Firestore regels staan in firestore.rules — valideren veldstructuur bij schrijven
- Firebase config (VITE_FIREBASE_*) is by design publiek, dit is acceptabel
- Lokaal testen van de proxy: gebruik `netlify dev` in plaats van `npm run dev`
- Bij nieuwe Anthropic API-calls: altijd via de callClaude() functie in src/utils/anthropic.ts, nooit rechtstreeks naar api.anthropic.com
