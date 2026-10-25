import { afterEach, describe, expect, test, vi } from 'vitest';
import { ATTRIBUTION_ARASAAC, urlPicto } from './pictos';

afterEach(() => {
  vi.unstubAllGlobals();
});

function reponse(corps: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(corps) } as Response);
}

describe('urlPicto', () => {
  test('renvoie l’URL de l’image du premier résultat', async () => {
    const f = vi.fn(() => reponse([{ _id: 6964 }, { _id: 2317 }]));
    vi.stubGlobal('fetch', f);
    expect(await urlPicto('maison')).toBe('https://static.arasaac.org/pictograms/6964/6964_300.png');
    expect(f).toHaveBeenCalledWith('https://api.arasaac.org/v1/pictograms/fr/search/maison');
  });

  test('encode les mots accentués dans l’URL de recherche', async () => {
    const f = vi.fn(() => reponse([{ _id: 1 }]));
    vi.stubGlobal('fetch', f);
    await urlPicto('école');
    expect(f).toHaveBeenCalledWith('https://api.arasaac.org/v1/pictograms/fr/search/%C3%A9cole');
  });

  test('aucun résultat : null', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reponse([])));
    expect(await urlPicto('xyzxyz')).toBeNull();
  });

  test('erreur réseau : null sans exception, et pas mise en cache', async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new Error('réseau'))
      .mockImplementationOnce(() => reponse([{ _id: 5 }]));
    vi.stubGlobal('fetch', f);
    expect(await urlPicto('chat')).toBeNull();
    expect(await urlPicto('chat')).toBe('https://static.arasaac.org/pictograms/5/5_300.png');
    expect(f).toHaveBeenCalledTimes(2);
  });

  test('deux appels pour le même mot : un seul fetch', async () => {
    const f = vi.fn(() => reponse([{ _id: 9 }]));
    vi.stubGlobal('fetch', f);
    await urlPicto('livre');
    await urlPicto('livre');
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe('attribution', () => {
  test('reprend la formule officielle ARASAAC', () => {
    expect(ATTRIBUTION_ARASAAC).toContain('Sergio Palao');
    expect(ATTRIBUTION_ARASAAC).toContain('ARASAAC');
    expect(ATTRIBUTION_ARASAAC).toContain('CC (BY-NC-SA)');
    expect(ATTRIBUTION_ARASAAC).toContain('Gouvernement d’Aragon');
  });
});
