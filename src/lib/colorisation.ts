// Seul point d'entrée du moteur de colorisation pour le reste de l'app (spec §10).
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ModeColorisation = 'phonemes' | 'syllabes' | 'bpdq' | 'voyelles-consonnes';

export interface Segment {
  debut: number;
  fin: number;
  couleur: string;
}

type Rgb = { r: number; g: number; b: number };

let C: any = null;

// Le moteur pèse environ 370 Ko : chargé à la demande, seulement quand la colorisation est activée.
export async function chargerColorisation(): Promise<void> {
  if (C) return;
  await import('../vendor/colorisation/index.js');
  C = (globalThis as any).Colorization;
  C.Config.initCerasRose();
}

export function colorisationPrete(): boolean {
  return C !== null;
}

const hex = (c: Rgb) => '#' + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const MOT = /[a-zàáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúūÿçñ’']+/gi;
const VOYELLE = /[aeiouyàáâäæãåèéêëîïíôöòóœøõûüùúÿ]/i;
const CONSONNE = /[bcdfghjklmnpqrstvwxzç]/i;

export function colorise(texte: string, mode: ModeColorisation): Segment[] {
  if (!C) throw new Error('Colorisation non chargée : appeler chargerColorisation() d’abord.');
  if (texte === '') return [];
  const config = C.Config.current;
  const segments: Segment[] = [];

  if (mode === 'phonemes') {
    for (const mot of C.Automat.analyzeText(texte, config) as { word: string; start: number; phonemes: { phoneme: string; start: number; end: number }[] }[]) {
      for (const ph of mot.phonemes) {
        const couleur = C.Config.getPhonemeColor(ph.phoneme, mot.word.substring(ph.start, ph.end + 1)) as Rgb | null;
        if (couleur) segments.push({ debut: mot.start + ph.start, fin: mot.start + ph.end + 1, couleur: hex(couleur) });
      }
    }
  } else if (mode === 'syllabes') {
    let idx = 0;
    for (const m of texte.matchAll(MOT)) {
      const syllabes = C.Syllables.syllabify(m[0], config) as { start: number; end: number }[];
      if (config.sylIgnoreMono && syllabes.length <= 1) continue;
      for (const s of syllabes) {
        const couleur = config.sylColors[idx % config.sylNumColors] as Rgb;
        segments.push({ debut: (m.index ?? 0) + s.start, fin: (m.index ?? 0) + s.end + 1, couleur: hex(couleur) });
        idx++;
      }
    }
  } else if (mode === 'bpdq') {
    for (let i = 0; i < texte.length; i++) {
      const c = config.bpdq[texte[i].toLowerCase()] as Rgb | undefined;
      if (c) segments.push({ debut: i, fin: i + 1, couleur: hex(c) });
    }
  } else {
    for (let i = 0; i < texte.length; i++) {
      if (VOYELLE.test(texte[i])) segments.push({ debut: i, fin: i + 1, couleur: hex(config.voyelles) });
      else if (CONSONNE.test(texte[i])) segments.push({ debut: i, fin: i + 1, couleur: hex(config.consonnes) });
    }
  }

  return segments.sort((a, b) => a.debut - b.debut);
}
