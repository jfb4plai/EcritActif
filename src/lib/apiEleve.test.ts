import { afterEach, describe, expect, test, vi } from 'vitest';
import { apiEleve, ouvrirSession } from './apiEleve';

afterEach(() => vi.unstubAllGlobals());

function reponse(status: number, corps: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corps) } as Response);
}

describe('ouvrirSession', () => {
  test('envoie les codes en majuscules et renvoie le jeton et les activités', async () => {
    const f = vi.fn(() => reponse(200, { jeton: 'j', activites: [] }));
    vi.stubGlobal('fetch', f);
    const r = await ouvrirSession(' abcdef ', 'kmnpqr');
    expect(r).toEqual({ jeton: 'j', activites: [] });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/eleve/ouvrir');
    expect(JSON.parse(init.body as string)).toEqual({ codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
  });

  test('code inconnu : erreur avec le message du serveur', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reponse(404, { erreur: 'Code inconnu' })));
    await expect(ouvrirSession('AAAAAA', 'BBBBBB')).rejects.toThrow('Code inconnu');
  });

  test('trop d’essais : message clair', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reponse(429, { erreur: 'Trop d’essais, réessaie dans une minute.' })));
    await expect(ouvrirSession('AAAAAA', 'BBBBBB')).rejects.toThrow(/Trop d’essais/);
  });
});

describe('serveur injoignable ou réponse illisible', () => {
  test('une réponse non JSON (page 404 HTML) donne un message simple, pas une erreur technique', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new SyntaxError('Unexpected token <')) } as Response)));
    await expect(ouvrirSession('AAAAAA', 'BBBBBB')).rejects.toThrow('Le serveur ne répond pas. Réessaie dans un moment.');
  });

  test('un réseau coupé donne le même message', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(ouvrirSession('AAAAAA', 'BBBBBB')).rejects.toThrow('Le serveur ne répond pas. Réessaie dans un moment.');
  });
});

describe('apiEleve.sauver', () => {
  test('renvoie la version et les aides', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reponse(200, { version: 1, aides: [] })));
    const r = await apiEleve.sauver({ jeton: 'j', activiteId: 'a', texte: 't', phase: 'ecrire', version: 1, evenements: [] });
    expect(r).toEqual({ version: 1, aides: [] });
  });

  test('une réponse en erreur lève une exception (l’écran passera en « appareil seulement »)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => reponse(401, { erreur: 'Session expirée' })));
    await expect(apiEleve.sauver({ jeton: 'j', activiteId: 'a', texte: 't', phase: 'ecrire', version: 1, evenements: [] })).rejects.toThrow('Session expirée');
  });
});
