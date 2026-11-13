# 🌐 LiveLang App

Applicazione web per la **traduzione automatica simultanea e naturale in tempo reale** tra due o più persone con telefoni diversi, potenziata da **Google Gemini AI**.

---

## ✨ Perché è diversa da Google Traduttore o ChatGPT?

1. **Rielaborazione contestuale intelligente**: Non traduce alla lettera parola per parola. Riconosce ed elimina intercalari (*"ehm"*, *"cioè"*, *"tipo"*, *"you know"*), false partenze, balbettii ed esitazioni del parlato, restituendo frasi pulite, naturali e fluide.
2. **Conversazione fluida senza interruzioni a walkie-talkie**: Nessuna scomoda pausa da dover attendere o bottoni da premere continuamente. Il microfono ascolta in continuo.
3. **Lobby Multidispositivo & Multilingua**: Ciascun interlocutore entra nella stessa stanza dal proprio smartphone, seleziona la propria lingua (es. Italiano, Giapponese, Spagnolo, Inglese) e parla liberamente:
   - Il telefono di ciascuno ascolta solo la propria lingua.
   - Traduce istantaneamente ed invia agli altri telefoni la traduzione nella rispettiva lingua scelta.
   - Mostra sia i sottotitoli in tempo reale sia la sintesi vocale (TTS) opzionale per l'ascolto in cuffia.
4. **Condivisione istantanea tramite QR Code**: Basta far inquadrare il QR code generato nella stanza per far entrare subito l'altra persona.

---

## 🚀 Avvio Rapido in Locale

1. **Assicurati di avere le dipendenze installate:**
   ```bash
   npm install
   ```

2. **Verifica la chiave API:**
   Il file `.env.local` contiene già la tua chiave `GEMINI_API_KEY`.
   *(Nota: `.env.local` è protetto da `.gitignore` e NON verrà mai caricato su GitHub).*

3. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```
   Apri il browser su [http://localhost:3000](http://localhost:3000).

   > 💡 **Come provarlo tra due telefoni sulla stessa rete Wi-Fi:**
   > Avvia con `npx next dev -H 0.0.0.0` e apri dal telefono l'indirizzo `http://<IP-DEL-TUO-PC>:3000`.

---

## 📦 Come Caricare su GitHub

Dalla cartella `LiveLang App`:

```bash
git init
git add .
git commit -m "Initial commit: LiveLang App with Gemini AI realtime translation"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/LiveLang-App.git
git push -u origin main
```

---

## ⚡ Come fare il Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi con il tuo account GitHub.
2. Clicca su **"Add New..."** ➔ **"Project"**.
3. Seleziona il repository **`LiveLang-App`**.
4. Nella sezione **Environment Variables**, aggiungi:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `La_Tua_Chiave_Gemini_API`
5. Clicca su **Deploy**! In meno di 1 minuto il tuo sito sarà online con certificato HTTPS (indispensabile per l'accesso al microfono su smartphone).

---

## 🛠️ Architettura Tecnica

- **Framework:** Next.js 14 (App Router, Server Components + Client Hooks)
- **AI Engine:** Google Gemini (Gemini 3.5 Flash / Gemini 3.8 Flash) con failover automatico e output JSON strutturato
- **Speech Engine:** Web Speech API (riconoscimento vocale continuo e reattivo per singola lingua) + Web SpeechSynthesis (audio in cuffia)
- **Realtime Networking:** Connessione ibrida ad alta velocità:
  - **PeerJS (WebRTC DataChannel):** P2P a bassissima latenza (<50ms) tra smartphone
  - **REST / Polling Room Sync (`/api/rooms/[id]`):** Fallback garantito anche sotto reti cellulari 4G/5G con NAT restrittivo
- **Styling:** Tailwind CSS con dark mode, accenti neon e visualizzatore di onde sonore animate
