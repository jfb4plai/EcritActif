import { afterEach, describe, expect, test, vi } from 'vitest';
import { choisirVoix, dicteePossible, dicter, lire, synthesePossible } from './audio';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('choisirVoix', () => {
  test('préfère fr-BE, sinon une voix fr-*, sinon rien', () => {
    expect(choisirVoix([{ lang: 'fr-FR' }, { lang: 'fr-BE' }], 'fr-BE')).toEqual({ lang: 'fr-BE' });
    expect(choisirVoix([{ lang: 'en-US' }, { lang: 'fr-CA' }], 'fr-BE')).toEqual({ lang: 'fr-CA' });
    expect(choisirVoix([{ lang: 'en-US' }], 'fr-BE')).toBeNull();
  });
});

describe('sans API vocale (Review Focus 3)', () => {
  test('synthèse et dictée sont déclarées impossibles et ne lèvent pas d’erreur', () => {
    expect(synthesePossible()).toBe(false);
    expect(dicteePossible()).toBe(false);
    expect(() => lire('Bonjour')).not.toThrow();
    const stop = dicter(() => {}, () => {});
    expect(() => stop()).not.toThrow();
  });
});

describe('avec synthèse vocale', () => {
  test('lit avec la voix fr-BE quand elle existe', () => {
    const parle = vi.fn();
    const voixBE = { lang: 'fr-BE', name: 'Belge' };
    class Enonce {
      voice: unknown = null;
      lang = '';
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Enonce);
    vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'fr-FR' }, voixBE], speak: parle, cancel: vi.fn() });
    vi.stubGlobal('window', globalThis);
    expect(synthesePossible()).toBe(true);
    lire('Bonjour');
    expect(parle).toHaveBeenCalledOnce();
    expect((parle.mock.calls[0][0] as Enonce).voice).toBe(voixBE);
  });

  test('ne lit pas un texte vide', () => {
    const parle = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', class {});
    vi.stubGlobal('speechSynthesis', { getVoices: () => [], speak: parle, cancel: vi.fn() });
    lire('   ');
    expect(parle).not.toHaveBeenCalled();
  });
});

describe('avec dictée vocale', () => {
  test('transmet le texte reconnu puis la fin, et stop() arrête la reconnaissance', () => {
    const instances: Reco[] = [];
    class Reco {
      lang = '';
      interimResults = false;
      continuous = false;
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        instances.push(this);
      }
    }
    vi.stubGlobal('SpeechRecognition', Reco);
    vi.stubGlobal('window', globalThis);
    expect(dicteePossible()).toBe(true);
    const textes: string[] = [];
    const fin = vi.fn();
    const stop = dicter((t) => textes.push(t), fin);
    const reco = instances[0];
    expect(reco.lang).toBe('fr-BE');
    expect(reco.start).toHaveBeenCalled();
    reco.onresult?.({ results: [[{ transcript: 'le chat dort' }]] });
    reco.onend?.();
    expect(textes).toEqual(['le chat dort']);
    expect(fin).toHaveBeenCalled();
    stop();
    expect(reco.stop).toHaveBeenCalled();
  });
});
