# Howard Lake Village — Cloudflare Workers

UPDATE: de formulierverwerking is nu lokaal geïmplementeerd. Zie `FORMULIER-INSTELLEN.md` voor de actuele stappen en ontbrekende instellingen. De oorspronkelijke sectie hieronder over nog te bouwen formulierverwerking is achterhaald; echte verzending en browsercontrole staan nog open.

Deze map is het zelfstandige GitHub-project. Alleen `public/` wordt als website aangeboden.
Er is nog niets gedeployed en er zijn geen accounts of domeininstellingen gewijzigd.

## Inhoud

- `site/`: de bewerkbare website, tien pagina's plus CSS, JavaScript en websitebeelden.
- `public/`: automatisch gegenereerde deploymentbestanden; niet handmatig bewerken en niet uploaden naar GitHub.
- `build.cjs`: maakt standaard een testversie met noindex.
- `check.cjs`: controleert lokale verwijzingen, ankers, JavaScript-syntax, canonicals en sitemap.
- `wrangler.jsonc`: Workers Static Assets, geen applicatieserver of framework.
- `.github/workflows/check.yml`: controles bij pushes en pull requests; deployt zelf niets.
- `.gitignore`: houdt gegenereerde bestanden, lokale instellingen en geheimen uit Git.

## Welke versie?

Basis is de bestaande hoofdmap. Vergelijking met de complete FTP-v003-export van 26 oktober 2026 laat zien dat deze dezelfde website vertegenwoordigt, zonder de `/howard2/`-aanpassingen. De herstelmap is slechts een gedeeltelijke reparatie en geen zelfstandige website. Oudere v001/v002- en losse hero-varianten zijn niet samengevoegd.

Originele projectbestanden en foto's blijven intact. Vanaf nu pas je voor dit deploymentproject de bestanden onder `site/` aan. Wijzigingen in de oude hoofdmap worden niet automatisch naar deze kopie overgenomen.

## Lokaal controleren

Met Node.js 24:

```text
node build.cjs
node check.cjs
```

Er zijn geen npm-pakketten nodig voor deze controles. Cloudflare gebruikt Wrangler tijdens de deployment.

## GitHub aansluiten (pas wanneer je wilt publiceren)

1. Maak in je bestaande GitHub-account een lege, bij voorkeur private repository met naam `howard-lake-village`. Kies geen automatisch README-bestand.
2. Upload de INHOUD van deze map als repository-root. Neem `site`, `.github`, `.gitignore`, `package.json`, de twee scripts, deze instructies en `wrangler.jsonc` mee. Laat `public` weg. Upload niet de hele Howard Lake-projectmap met documenten en oude exports.
3. Controleer dat de hoofdbranch `main` heet en dat de GitHub-controle groen wordt.
4. Open in je bestaande Cloudflare-account Workers & Pages, kies een nieuwe Worker en verbind de GitHub-repository. Kies Workers, niet Pages. De knopnamen kunnen veranderen; zoek naar Import repository/Connect Git.
5. Gebruik onderstaande instellingen:

| Instelling | Waarde |
| --- | --- |
| Worker name | `howard-lake-village-test` |
| Production branch | `main` (dit is voorlopig de branch van de TESTwebsite) |
| Root directory | leeg/repository-root |
| Build command | `node build.cjs && node check.cjs` |
| Deploy command | `npx wrangler@4 deploy` |
| Preview command, indien gevraagd | `npx wrangler@4 versions upload` |

6. De uiteindelijke Deploy-knop publiceert daadwerkelijk. Deze voorbereiding heeft die stap niet uitgevoerd. Gebruik voorlopig alleen het aangeboden `workers.dev`-adres; koppel nog geen eigen domein.
7. Na de eerste geslaagde koppeling starten nieuwe commits op `main` automatisch een Cloudflare-build en deployment. Een mislukte controle stopt de deploycommand. GitHub Actions controleert daarnaast onafhankelijk; branchbescherming met verplichte checks kan later worden ingesteld.
8. Controleer op het testadres alle tien pagina's, de menu's, gallery/lightbox en beide formulierdialogen op mobiel, tablet en desktop. Controleer ook een onbestaande URL: die hoort 404 te geven.

## SEO: test nu, productie later

De standaardbuild zet in ALLE HTML `noindex,follow` en in `_headers` een algemene `X-Robots-Tag: noindex, nofollow`. Zo worden ook test- en versie-URL's uitgesloten. Dit is geen wachtwoordbeveiliging.

`robots.txt` laat crawlen toe zodat crawlers noindex kunnen zien. De sitemap en canonical/OG/schema-URL's blijven naar `https://howardlakevillage.com/` verwijzen. De testhost wordt niet in de sitemap opgenomen. De huidige live domeininstellingen en bestanden worden niet aangeraakt.

Voor een LATERE, afzonderlijk goedgekeurde productielancering:

1. Rond inhoudelijke goedkeuring, contactformulier en de project-launchchecklist af.
2. Maak bij voorkeur een aparte productie-Worker met een andere naam en eigen configuratie. Kopieer de testconfiguratie en wijzig de naam; wijzig geen bestaande domeininstellingen zonder launchopdracht.
3. Gebruik daar `node build.cjs --production && node check.cjs` als buildcommand. Dat behoudt de indexeerbare metadata uit `site/` en verwijdert de algemene noindex-header. De hostname-regel voor `workers.dev` blijft bestaan.
4. Bij productie: controleer op het echte domein de HTTP-header EN robots-meta, sitemap, redirects en canonicals. Houd preview-URL's uitgesloten; schakel desnoods publieke versie-URL's uit. Koppel het domein pas bij de goedgekeurde lancering.

Gebruik de testbuild niet op het toekomstige productiedomein: die sluit bewust ieder domein uit. Een productiebuild is een expliciete, andere instelling.

## Contactformulier: nog open

De bestaande handlers controleren velden en tonen vervolgens dat verzending niet is ingeschakeld. Er is geen backend en ook geen werkende voorbereiding van een e-mailbericht, ondanks de bestaande formuliertekst. Dit is bewust behouden bij de hostingmigratie.

Nog nodig: ontvanger bevestigen, een Worker-endpoint/formulierdienst, transactionele e-maildienst, domeinverificatie/SPF/DKIM, servervalidatie, spamcontrole met server-side Turnstile en rate limiting, veilige secrets, fout-/succesmeldingen, privacytekst en een echte afleveringstest. Geen sleutels in GitHub of browser-JavaScript plaatsen. Een formulierendpoint vraagt later een Worker-script naast Static Assets.

## Grenzen van de controle

De lokale controle dekt bestanden, paden, ankers, JavaScript-syntax en SEO-URL's. Er is geen Cloudflare-runtime gestart, geen mail verzonden en geen externe linkbestemming of boeking getest. Browserinteracties en de daadwerkelijke Cloudflare-responses moeten op het testadres nog worden gecontroleerd. Designbestanden zijn behouden; er is geen herontwerp uitgevoerd.

Documentatie: https://developers.cloudflare.com/workers/static-assets/ en https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
