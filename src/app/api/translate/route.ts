import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslateApiRequest, TranslateApiResponse } from '@/types';
import { getLanguage } from '@/lib/languages';

const apiKey = process.env.GEMINI_API_KEY || '';

// Lista di modelli in ordine di priorità per resilienza totale (failover automatico)
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
];

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY non configurata sul server.' },
        { status: 500 }
      );
    }

    const body: TranslateApiRequest = await req.json();
    const { text, speakerLang, targetLangs, recentHistory } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const speakerLangObj = getLanguage(speakerLang);
    const targetLangsObj = (targetLangs || [])
      .filter((l) => l !== speakerLang)
      .map((l) => getLanguage(l));

    const historyContext = (recentHistory || [])
      .slice(-6)
      .map((h) => `${h.speaker}: ${h.text}`)
      .join('\n');

    const prompt = `
Sei un interprete simultaneo d'élite per conversazioni dal vivo tra persone che parlano lingue diverse.

CONTESTO DELLA CONVERSAZIONE RECENTE:
${historyContext ? historyContext : '(Inizio conversazione)'}

NUOVO INPUT PARLATO:
- Lingua dell'oratore: ${speakerLangObj.name} (${speakerLangObj.code})
- Trascrizione grezza del microfono: "${text}"
- Lingue di destinazione richieste: ${
      targetLangsObj.length > 0
        ? targetLangsObj.map((l) => `${l.name} (${l.code})`).join(', ')
        : 'Nessuna lingua aggiuntiva richiesta'
    }

IL TUO COMPITO:
1. "cleanedText": Rielabora la frase nella lingua originale (${speakerLangObj.name}). Elimina intercalari inutili (es. "ehm", "cioè", "tipo", "like", "uh", "insomma"), balbettii, ripetizioni involontarie e autocorrezioni tipiche del parlato frettoloso. Rendi la frase naturale, fluida e chiara, preservando al 100% l'intenzione e il tono emotivo di chi parla.
2. "translations": Traduci la frase rielaborata in ciascuna lingua target richiesta (${targetLangsObj.map((l) => l.code).join(', ')}). NON fare una traduzione letterale stile Google Traduttore. Adatta modi di dire, grammatica e sfumature culturali in modo che suoni come parlata da un madrelingua naturale nel contesto del dialogo.
3. Se non ci sono lingue target, "translations" sarà un oggetto vuoto {}.

RISPONDI ESCLUSIVAMENTE con un JSON nel seguente formato:
{
  "cleanedText": "stringa della frase ripulita nella lingua originale",
  "translations": {
    ${targetLangsObj.map((l) => `"${l.code}": "stringa tradotta"`).join(',\n    ')}
  }
}
`;

    let responseText = '';
    let lastError: any = null;

    // Tentativo con failover automatico
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Modello ${modelName} non riuscito, provo il successivo...`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Nessun modello ha risposto');
    }
    
    let parsed: TranslateApiResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        cleanedText: text,
        translations: {},
      };
    }

    parsed.translations = parsed.translations || {};

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Errore API Translate:', error);
    return NextResponse.json(
      { error: error?.message || 'Errore durante la traduzione' },
      { status: 500 }
    );
  }
}
