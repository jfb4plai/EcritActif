// Synthèse et dictée vocales du navigateur, avec détection de support : une API absente
// masque l'aide, elle ne provoque jamais d'erreur (Review Focus 3).
/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;

export function choisirVoix<T extends { lang: string }>(voix: T[], langue = 'fr-BE'): T | null {
  return voix.find((v) => v.lang === langue) ?? voix.find((v) => v.lang.toLowerCase().startsWith('fr')) ?? null;
}

export function synthesePossible(): boolean {
  return 'speechSynthesis' in g && typeof g.SpeechSynthesisUtterance === 'function';
}

export function lire(texte: string, opts: { langue?: 'fr-BE' | 'fr-FR' } = {}): void {
  if (!synthesePossible() || texte.trim() === '') return;
  const langue = opts.langue ?? 'fr-BE';
  const enonce = new g.SpeechSynthesisUtterance(texte);
  const voix = choisirVoix(g.speechSynthesis.getVoices() as { lang: string }[], langue);
  if (voix) {
    enonce.voice = voix;
    enonce.lang = voix.lang;
  } else {
    enonce.lang = langue;
  }
  g.speechSynthesis.cancel();
  g.speechSynthesis.speak(enonce);
}

export function arreter(): void {
  if (synthesePossible()) g.speechSynthesis.cancel();
}

function constructeurReconnaissance(): (new () => any) | null {
  return g.SpeechRecognition ?? g.webkitSpeechRecognition ?? null;
}

export function dicteePossible(): boolean {
  return constructeurReconnaissance() !== null;
}

export function dicter(onTexte: (t: string) => void, onFin: () => void): () => void {
  const Reco = constructeurReconnaissance();
  if (!Reco) return () => {};
  const reco = new Reco();
  reco.lang = 'fr-BE';
  reco.interimResults = false;
  reco.continuous = false;
  reco.onresult = (e: any) => {
    const t = e?.results?.[0]?.[0]?.transcript;
    if (typeof t === 'string') onTexte(t);
  };
  reco.onend = () => onFin();
  reco.onerror = () => onFin();
  reco.start();
  return () => reco.stop();
}
