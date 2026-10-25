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
