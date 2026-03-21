import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import { db } from './config'
import type { Wijn, Wijnhuis } from '../types'

const wijnhuizenData: Omit<Wijnhuis, 'id'>[] = [
  { naam: 'Soalheiro', informatie: 'Onbekend, gekregen' },
  { naam: 'Domaine Asseray', informatie: 'Goedkope groothandel-wijnmaker. Volle ruikende verkoper die met vriend aan het drinken was. Kon weinig vertellen over de wijn. Goedkope rosés, wel prima.' },
  { naam: 'Markus Molitor', informatie: 'Commercieel groot en deftig. Proeverij aan lange houten tafel, 12 wijnen, vrouw fluisterde.' },
  { naam: 'G. Tribaut', informatie: 'Gekregen' },
  { naam: 'Domaine Roche Ville', informatie: 'Groter commerciëler wijnhuis met terras bovenop de berg. Minder persoonlijk, 3 proeven. Was wel lekker maar niet sfeervol.' },
  { naam: 'Staffelterhof', informatie: 'Natuurwijnmaker uit Duitsland. Jan is hier tien jaar mee bezig. We zaten op zijn terras en hebben 2,5 uur gepraat over hun wijn, in de zon.' },
  { naam: 'Weingut Karl Erbes', informatie: 'Tip via Zoey, leuke wijnhandelaar in de Moeselregio. Wijnlokaal overstroomt jaarlijks. Veel uitleg en geproefd, beperkt Engels (Duitse vrouw).' },
  { naam: 'Domaine Dittiere', informatie: 'Leuke kleinere wijnmaker, vriendelijk, sprak geen Engels. Aan de bar verschillende wijnen geproefd. Getipt door eigenaar landhuis waar we verbleven aan de Loire.' },
  { naam: 'Chateau Soucherie', informatie: 'Kasteel in Frankrijk waar we ook hebben overnacht, prachtig tussen wijnranken. Veel muggen. Oefenen voor Riv\'s sollicitatie met uitzicht op de heuvels.' },
  { naam: 'Bodegas Rubicón', informatie: 'Naast de albasten kuilen' },
  { naam: 'Domaine Langlois-Chateau', informatie: 'Groot commercieel in de Loire, rondleiding door de grotten, veel bubbels.' },
  { naam: 'De Amsteltuin', informatie: 'Wijnhuis in Amstelveen, wijngaard zit daar. High wine.' },
  { naam: 'Domaine de Bablut', informatie: 'Een soort tuin met oude gebouwen, in kleine oude molen staand geproefd, zoon van de familie met experimentele wijnen. Wijnetiketten in diamantvorm.' },
  { naam: 'Gabriel Meffre', informatie: '' },
]

const wijnenData: Omit<Wijn, 'id'>[] = [
  { naam: "'t Bruisende Genieten", wijnhuis: 'De Amsteltuin', jaartal: 2023, land: 'Nederland', kleur: 'Rood', druivensoorten: ['Pinotin', 'Cabernet Cortis'], prijs: 16.50, aankoopjaar: 2024, smaakomschrijving: 'Bruisend, droog, fruitig, lichte kleur, feestelijk karakter', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Amalia', wijnhuis: 'Bodegas Rubicón', jaartal: 2023, land: 'Spanje', kleur: 'Wit', druivensoorten: ['Malvasía Volcánica'], prijs: 17.00, aankoopjaar: 2025, smaakomschrijving: 'Droog, fris, mineraal karakter door vulkanische bodem. Meegenomen uit Lanzarote.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Clos des perrieres', wijnhuis: 'Chateau Soucherie', jaartal: 2022, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 30.60, aankoopjaar: 2024, smaakomschrijving: 'Witte wijn uit Savennieres. Best apart, kan nog langer liggen. Wijnstokken van 25j. Bodem leisteen, vulkanisch gesteente, zandsteen. Eikenhouten vaten 500L, 12 maanden rijping. 10-12j te bewaren.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Vacqueyras Saint-Barthélémy', wijnhuis: 'Gabriel Meffre', jaartal: 2022, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Syrah', 'Grenache'], prijs: 28.00, aankoopjaar: 2024, smaakomschrijving: 'Rood fruit, eiken, braambes, lekker maar beetje stroef. Cadeau van Fleur en Sanne voor 30 verjaardag', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'La Clos de la Thibaudiere', wijnhuis: 'Domaine Roche Ville', jaartal: 2022, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 24.90, aankoopjaar: 2024, smaakomschrijving: 'Witte Saumur-wijn uit 2022. Mineralig. Eikenhout negen maanden. Kalrijke bodem. Biologisch. Karaf is aanbevolen. Smaak is fris, verfijnd, mineraliteit.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Irancy', wijnhuis: 'Domaine Saint Germain (Christophe Ferrari)', jaartal: 2019, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Pinot Noir'], prijs: 16.00, aankoopjaar: 2023, smaakomschrijving: 'Droog, licht kruidig, goede zuurgraad. Vakantie met Riv.', flessenSamen: 0, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Haus Klosterberg', wijnhuis: 'Markus Molitor', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Pinot Blanc'], prijs: 11.90, aankoopjaar: 2025, smaakomschrijving: 'Licht en rond. Lekker op terras of boot. Korte afdronk.', flessenSamen: 0, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Party Panda Petnat', wijnhuis: 'Staffelterhof', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Bacchus', 'Riesling'], prijs: 19.00, aankoopjaar: 2025, smaakomschrijving: 'Natuurwijn van riesling en bacchus. Stallig, niet te droog, niet te zuur.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: "Mayor's Choice", wijnhuis: 'Chateau Amsterdam', jaartal: 2023, land: 'Nederland', kleur: 'Rood', druivensoorten: ['Grenache'], prijs: 22.00, aankoopjaar: 2024, smaakomschrijving: 'Vol, fruitig, fris, gerijpt op Frans eiken, 14% alcohol. Gekocht na proeverij door Sam.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Chablis 1er Cru Beauroy', wijnhuis: 'Domaine Verret', jaartal: 2021, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chardonnay'], prijs: 29.00, aankoopjaar: 2023, smaakomschrijving: 'Rijk, complex, tonen van hazelnoot, truffel, rijp fruit. Vakantie met Riv.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Blauer Zweigelt', wijnhuis: 'Familie Bauer', jaartal: 2022, land: 'Oostenrijk', kleur: 'Rood', druivensoorten: ['Pinot noir'], prijs: 9.00, aankoopjaar: 2024, smaakomschrijving: 'Cherry and currant nose; cherry and elderberry flavor on the palate; elegant finish.', flessenSamen: 0, flessenSam: 0, flessenRiv: 1 },
  { naam: 'Müller Time', wijnhuis: 'Staffelterhof', jaartal: 2023, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Müller-Thurgau'], prijs: 15.00, aankoopjaar: 2025, smaakomschrijving: 'Müller-Thurgau. Fruitiger dan 2022, meer zuren, aromatischer.', flessenSamen: 1, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Alvarinho', wijnhuis: 'Soalheiro', jaartal: 2020, land: 'Portugal', kleur: 'Wit', druivensoorten: ['Alvarinho'], prijs: 17.50, aankoopjaar: 2024, smaakomschrijving: 'Fris, aromatisch, elegant, citrus en mineraliteit (Vinho Verde stijl). We kunnen niet meer thuisbrengen van wie we deze kregen.', flessenSamen: 0, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Irancy La Bergère', wijnhuis: 'Domaine Saint Germain (Christophe Ferrari)', jaartal: 2020, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Pinot Noir'], prijs: 20.00, aankoopjaar: 2023, smaakomschrijving: 'Droog, geschikt bij eend, rood vlees, sausgerechten. Vakantie met Riv.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Limburg Pinot Noir', wijnhuis: 'Hoeve Nekum', jaartal: 2020, land: 'Nederland', kleur: 'Rood', druivensoorten: ['Pinot Noir'], prijs: 15.00, aankoopjaar: 2024, smaakomschrijving: 'Droog, helder rood, fris rood fruit, lichte houttoets, kersen, bramen, zachte zuren. Cadeau voor Sam van Riv uit Limburg.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Little Bastard', wijnhuis: 'Staffelterhof', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling', 'Sauvignon Blanc'], prijs: 17.00, aankoopjaar: 2025, smaakomschrijving: 'Natuurwijn. Zuurder, strakker, toegankelijk.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Ürziger in der Kranklei Riesling Spätlese (2023)', wijnhuis: 'Weingut Karl Erbes', jaartal: 2023, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling'], prijs: 11.80, aankoopjaar: 2025, smaakomschrijving: 'Riesling Spätlese. Oude stokken. 13% alcohol. Bloemig, rond, meer mineralig.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Nieuwe Haarlem', wijnhuis: 'Cape Wine Company', jaartal: 2022, land: 'Zuid-Afrika', kleur: 'Rood', druivensoorten: ['Pinotage'], prijs: 15.00, aankoopjaar: 2024, smaakomschrijving: 'Vol, kruidig, fruitig, 14% alcohol, Coastal Region-herkomst. Cadeau van Ger.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Rocca Nigra', wijnhuis: 'Domaine de Bablut', jaartal: 2019, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Cabernet Sauvignon'], prijs: 16.80, aankoopjaar: 2024, smaakomschrijving: 'Ronder en krachtig. Biologische wijn. Donkere vruchten, drop, hout, geroosterd, krachtig en rond. Goed bij vlees en kazen.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Premium', wijnhuis: 'Domaine Dittiere', jaartal: 2018, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Cabernet Sauvignon'], prijs: 11.30, aankoopjaar: 2024, smaakomschrijving: 'Rode wijn uit 2018, rood, 1j eikenhout. Zwart fruit, kruidig, zoethout, tanines.', flessenSamen: 2, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Zeltinger Sonnenuhr Kabinett – Fuder 6', wijnhuis: 'Markus Molitor', jaartal: 2018, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling'], prijs: 33.00, aankoopjaar: 2025, smaakomschrijving: 'Riesling. Complex, rond, vanille. Gerijpt in groot eiken vat (Fuder 6) met veel smaak.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Sancerre-Langlois', wijnhuis: 'Domaine Langlois-Chateau', jaartal: 2020, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Pinot noir'], prijs: 17.80, aankoopjaar: 2024, smaakomschrijving: 'Rode wijn uit Sancerre. Fruitig. 3-5 jaar.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: "Rosé d'Anjou", wijnhuis: 'Domaine Asseray', jaartal: 2023, land: 'Frankrijk', kleur: 'Rosé', druivensoorten: ['Grolleau', 'Gamay'], prijs: 5.70, aankoopjaar: 2024, smaakomschrijving: 'Rosé, iets zoeter. Als aperitief, bij gegrild eten en wit vlees.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Zeltinger Schlossberg Spätlese', wijnhuis: 'Markus Molitor', jaartal: 2018, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling'], prijs: 24.00, aankoopjaar: 2025, smaakomschrijving: 'Riesling. Aardetint, mineralig, klein ijssuur.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Finca Las Palmeras', wijnhuis: 'Bodegas Stratvs', jaartal: 2022, land: 'Spanje', kleur: 'Wit', druivensoorten: ['Malvasía Volcánica'], prijs: 25.00, aankoopjaar: 2025, smaakomschrijving: 'Droog, mineraal, fris, vulkanisch karakter. Cadeau voor Riv uit Lanzarote.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Saint-Émilion Grand Cru', wijnhuis: 'Château Trimoulet', jaartal: 2015, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Merlot', 'Cabernet Franc'], prijs: 15.00, aankoopjaar: 2023, smaakomschrijving: 'Rijp, krachtig, met structuur en bewaarpotentieel. Waarschijnlijk cadeau van Ha.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Clos Saint-Florent', wijnhuis: 'Domaine Langlois-Chateau', jaartal: 2020, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 20.95, aankoopjaar: 2024, smaakomschrijving: 'Witte wijn uit Saumur. Best veel hout. Twaalf maanden op eikenhout. Kalk-grond. 8 tot 10 jaar.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Grand Cru', wijnhuis: 'Champagne Bernard Tornay', jaartal: 2009, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Pinot Noir', 'Chardonnay'], prijs: 35.00, aankoopjaar: 2023, smaakomschrijving: 'Brut, fris en droog, met rijpingstonen. Vakantie Champagne met Riv.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Rosé de Loire', wijnhuis: 'Domaine Asseray', jaartal: 2023, land: 'Frankrijk', kleur: 'Rosé', druivensoorten: ['Cabernet Franc', 'Gamay'], prijs: 5.70, aankoopjaar: 2024, smaakomschrijving: 'Rosé, minder zoet dan ander. Aanbevolen bij vlees, salades, gegrild eten.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Petra Alba', wijnhuis: 'Domaine de Bablut', jaartal: 2020, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Cabernet Franc'], prijs: 16.80, aankoopjaar: 2024, smaakomschrijving: 'Rood fruit, minder hoekig. Dieprode wijn, aroma\'s van framboos, braam en bosbes. Smaak is rond, vlezig en vol.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Vallée de la Loire', wijnhuis: 'Chateau Soucherie', jaartal: 2019, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Cabernet Franc'], prijs: 14.00, aankoopjaar: 2024, smaakomschrijving: 'Kruidige rode wijn met veel tannines. Niet houtgerijpt. Stokken zijn 40 jaar, bodem is leisteenachtig zandsteen. 5-10j bewaarpotentieel.', flessenSamen: 1, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Blanc de Noirs Premier Cru', wijnhuis: 'G. Tribaut', jaartal: 2023, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Pinot Noir'], prijs: 32.00, aankoopjaar: 2024, smaakomschrijving: 'Brut, fris en vol, witte champagne van blauwe druiven. Cadeau van Zoey voor Riv.', flessenSamen: 0, flessenSam: 0, flessenRiv: 1 },
  { naam: 'Blanc Ivoire', wijnhuis: 'Chateau Soucherie', jaartal: 2022, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 14.00, aankoopjaar: 2024, smaakomschrijving: 'Beetje houtig, maar ook mineralig. Klei en leisteen bodem. Eikenhouten vaten 500L, rijping 10-12 maanden. 3 jaar bewaren.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Il Sapiente', wijnhuis: 'Masseria Torricella', jaartal: 2019, land: 'Italië', kleur: 'Rood', druivensoorten: ['Primitivo', 'Cabernet Sauvignon'], prijs: 19.00, aankoopjaar: 2024, smaakomschrijving: 'Vol, fruitig, kruidig, harmonieus, stevige structuur. Cadeau van Riv voor Sam uit Italië.', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Ordovicien', wijnhuis: 'Domaine de Bablut', jaartal: 2019, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 16.80, aankoopjaar: 2024, smaakomschrijving: 'Witte droge wijn uit Anjou regio, honingachtig. Gul en krachtig, aroma\'s van lindebloesem, acacia, abrikoos, gekonfijte kweepeer.', flessenSamen: 1, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Müller time Sanders Struck', wijnhuis: 'Staffelterhof', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Müller-Thurgau', 'Riesling'], prijs: 15.00, aankoopjaar: 2025, smaakomschrijving: 'Schilfermentatie (1/3). Stallig, aardetinten, fruitig. Erg lekker.', flessenSamen: 1, flessenSam: 2, flessenRiv: 0 },
  { naam: 'Prosecco Frizzante', wijnhuis: 'Sartori di Verona', jaartal: 2024, land: 'Italië', kleur: 'Wit', druivensoorten: ['Glera'], prijs: 9.00, aankoopjaar: 2024, smaakomschrijving: 'Licht mousserend (frizzante), fris, fruitig, 11% alcohol', flessenSamen: 1, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Clos de la Grouas', wijnhuis: 'Domaine Dittiere', jaartal: 2018, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Cabernet Franc'], prijs: 8.20, aankoopjaar: 2024, smaakomschrijving: 'Rode wijn uit 2019, prijs gewonnen, rood fruit en krachtig, zachte tannines.', flessenSamen: 2, flessenSam: 0, flessenRiv: 0 },
  { naam: "L'Ame du Domaine", wijnhuis: 'Domaine Verret', jaartal: 2020, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chardonnay'], prijs: 25.00, aankoopjaar: 2023, smaakomschrijving: 'Fris-droog, mineralig, rijk en verfijnd (Premier Cru Beauroy)', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Sisters', wijnhuis: 'Staffelterhof', jaartal: 2024, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Chenin Blanc'], prijs: 16.00, aankoopjaar: 2025, smaakomschrijving: 'Neus van peer, zoetige geur maar droge, ronde smaak zonder zuren.', flessenSamen: 0, flessenSam: 0, flessenRiv: 1 },
  { naam: 'Orange Utan', wijnhuis: 'Staffelterhof', jaartal: 2022, land: 'Duitsland', kleur: 'Oranje', druivensoorten: ['Muscateller', 'Riesling', 'Sauvignier Gris'], prijs: 30.00, aankoopjaar: 2025, smaakomschrijving: 'Oranje wijn van Sauvignier Gris, Muscateller en Riesling. Droog, weinig tannines.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Einstern', wijnhuis: 'Markus Molitor', jaartal: 2017, land: 'Duitsland', kleur: 'Rood', druivensoorten: ['Pinot Noir'], prijs: 22.00, aankoopjaar: 2025, smaakomschrijving: 'Aards. Op stainless steel én oak barrels gerijpt.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Les Creisses', wijnhuis: 'Philippe Chesnelong', jaartal: 2022, land: 'Frankrijk', kleur: 'Rood', druivensoorten: ['Syrah', 'Grenache', 'Cabernet Sauvignon'], prijs: 22.00, aankoopjaar: 2024, smaakomschrijving: 'Vol, rijp fruit, kruidig, krachtig (14,5%). Gekocht in Parijs, met Roos.', flessenSamen: 0, flessenSam: 0, flessenRiv: 0 },
  { naam: 'Langlois - Crémant de Loire brut vintage', wijnhuis: 'Domaine Langlois-Chateau', jaartal: 2018, land: 'Frankrijk', kleur: 'Wit', druivensoorten: ['Chenin Blanc', 'Chardonnay', 'Cabernet Franc', 'Grolleau'], prijs: 15.95, aankoopjaar: 2024, smaakomschrijving: 'Bubbel uit Langlois. 4 jaar gerijpt.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Elpídio Superior', wijnhuis: 'Caves São Domingos', jaartal: 2017, land: 'Portugal', kleur: 'Wit', druivensoorten: ['Onbekend'], prijs: 19.00, aankoopjaar: 2024, smaakomschrijving: 'Brut, fris, fijne mousse, rijping 36 maanden. O&N fles van Riv.', flessenSamen: 0, flessenSam: 0, flessenRiv: 1 },
  { naam: 'Ürziger Würzgarten Riesling Spätlese', wijnhuis: 'Weingut Karl Erbes', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling'], prijs: 11.80, aankoopjaar: 2025, smaakomschrijving: 'Riesling Spätlese feinherb. Zoeter, 10% alcohol. Zoetig, floraal, gebalanceerd door zuur. Goed bij de BBQ.', flessenSamen: 0, flessenSam: 1, flessenRiv: 0 },
  { naam: 'Ürziger in der Kranklei Riesling Spätlese (2022)', wijnhuis: 'Weingut Karl Erbes', jaartal: 2022, land: 'Duitsland', kleur: 'Wit', druivensoorten: ['Riesling'], prijs: 11.80, aankoopjaar: 2025, smaakomschrijving: 'Oude stokken (80-90 jaar). Rond, persikachtig, mineraal, niet zuur.', flessenSamen: 1, flessenSam: 0, flessenRiv: 1 },
]

export async function seedDatabase(): Promise<{ seeded: boolean }> {
  const wijnenRef = collection(db, 'wijnen')
  const snapshot = await getDocs(wijnenRef)
  if (!snapshot.empty) {
    return { seeded: false }
  }

  // Seed wijnhuizen
  const batch1 = writeBatch(db)
  for (const wh of wijnhuizenData) {
    const ref = doc(collection(db, 'wijnhuizen'))
    batch1.set(ref, wh)
  }
  await batch1.commit()

  // Seed wijnen in batches of 20
  const batchSize = 20
  for (let i = 0; i < wijnenData.length; i += batchSize) {
    const batch = writeBatch(db)
    const chunk = wijnenData.slice(i, i + batchSize)
    for (const wijn of chunk) {
      const ref = doc(collection(db, 'wijnen'))
      batch.set(ref, wijn)
    }
    await batch.commit()
  }

  return { seeded: true }
}
