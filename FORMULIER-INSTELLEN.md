# Contactformulier aansluiten

Het formulier is lokaal aangesloten op `/api/contact`. De bestaande velden en opmaak zijn behouden. Er wordt rechtstreeks via Resend verzonden; de browser krijgt de API-key nooit te zien. Turnstile wordt pas geladen bij verzenden. De Worker controleert de invoer, de website-origin, de Turnstile-token/hostname/action en maximaal vijf pogingen per IP per minuut. Deze Cloudflare-rate-limit werkt per locatie, niet als wereldwijde boekhouding.

## Wat jij nu moet doen

Bewaar de Resend API-key. Er hoeft nu niets meer in Resend te worden aangeklikt. De website kan pas echt versturen na een testdeployment en onderstaande instellingen. De code is voorbereid en sluit verzending af zolang instellingen ontbreken.

## Bij de eerste Cloudflare-testdeployment

1. Maak in Cloudflare Turnstile een Managed widget aan voor de exacte testhostname. Gebruik de echte hostname van de Worker, zonder `https://` of paden.
2. Vul in `wrangler.jsonc` de publieke `TURNSTILE_SITE_KEY` in. Dit is geen geheim.
3. Vul `CONTACT_TO` in met het e-mailadres waarmee je bij Resend bent geregistreerd. Met `onboarding@resend.dev` kan alleen naar dat eigen accountadres worden getest. Het definitieve adres van de host komt pas na domeinverificatie.
4. Voeg in Cloudflare bij deze Worker > Settings > Variables and Secrets twee instellingen van type **Secret** toe: `RESEND_API_KEY` en `TURNSTILE_SECRET_KEY`. De tweede krijg je van de Turnstile-widget. Plak geheimen uitsluitend daar, niet in GitHub of de chat.
5. Deploy de testversie. Probeer zowel Contact als Check Availability, en controleer de echte mailbox en Resend-logs. De succesmelding betekent dat Resend de mail heeft aangenomen, niet dat aflevering in de inbox gegarandeerd is.

De eerdere GitHub/Cloudflare-build- en deploycommands blijven gelijk. `worker.mjs` en `wrangler.jsonc` moeten mee naar GitHub. Alleen `/api/*` gebruikt de Worker; pagina's en beelden blijven Static Assets.

## Later met het echte domein

Verifieer je afzenderdomein bij Resend, inclusief de gevraagde DNS-records. Wijzig `CONTACT_FROM` naar een afzender op dat domein en `CONTACT_TO` naar de goedgekeurde ontvanger. Voeg de productiehostname toe aan Turnstile (bij voorkeur een aparte widget voor productie). De bezoeker staat als Reply-To, nooit als afzender. Controleer privacytekst en afhandeling van persoonsgegevens vóór openbare ingebruikname.

Er is nog geen echte mail verstuurd, geen externe instelling gewijzigd en geen browser-/Cloudflare-test gedaan. Automatische controles gebruiken nagebootste providers, zonder netwerkverkeer naar Resend of Turnstile.
