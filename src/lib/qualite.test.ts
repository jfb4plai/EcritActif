import { describe, expect, test } from 'vitest';
import { evaluerQualite, type Retour } from './qualite';
import { detecterSignaux, verifierContraintes, recapRendu, type CategorieErreur } from './retour';
import { explicationDe } from './explications';

const ok = (r: Retour) => evaluerQualite(r);

describe('qualité de la rétroaction : ce qu’un bon retour est (articles de JF, RISS : hal-05348650, hal-04646895)', () => {
  test('un retour précis, centré sur le texte et qui propose une action est accepté', () => {
    expect(ok({ texte: 'Regarde la première lettre de cette phrase.', localise: true })).toEqual({ ok: true, manques: [] });
    expect(ok({ texte: 'Ta deuxième phrase n’a pas de verbe : relis-la et ajoute ce que fait le chat.' }).ok).toBe(true);
  });

  test('dire « pas encore » est permis : une bonne rétroaction peut pointer un écart', () => {
    expect(ok({ texte: 'Ton texte n’est pas encore terminé : ajoute une dernière phrase.' }).ok).toBe(true);
  });

  test('un compliment sur la personne est refusé : centré sur la personne, pas sur la tâche', () => {
    const r = ok({ texte: 'Bravo, tu es très doué !' });
    expect(r.ok).toBe(false);
    expect(r.manques).toContain('sur-la-tache');
  });

  test('« Bien. » seul est une louange vide', () => {
    const r = ok({ texte: 'Bien.' });
    expect(r.ok).toBe(false);
    expect(r.manques).toContain('sans-louange-vide');
  });

  test('la validation complaisante est refusée, même si elle semble bienveillante', () => {
    const r = ok({ texte: 'Tu as raison de penser ça, je suis fier de toi.' });
    expect(r.ok).toBe(false);
    expect(r.manques).toContain('sans-louange-vide');
  });

  test('un retour vague est refusé : il ne dit pas où', () => {
    const r = ok({ texte: 'Améliore ton texte.' });
    expect(r.ok).toBe(false);
    expect(r.manques).toContain('precis');
  });

  test('un constat sans piste d’action est refusé pour un retour correctif, accepté pour un bilan', () => {
    const constat = 'Il y a un problème dans ta deuxième phrase.';
    expect(ok({ texte: constat }).manques).toContain('actionnable');
    expect(ok({ texte: 'Ton texte est rendu : 12 mots, 2 versions.', genre: 'bilan' }).ok).toBe(true);
  });

  test('un compliment sans rien de précis est refusé, un compliment qui porte sur le travail est accepté', () => {
    expect(ok({ texte: 'Super travail !' }).ok).toBe(false);
    expect(ok({ texte: 'Bien relu : ajoute un point à la fin de la phrase.' }).ok).toBe(true);
  });

  test('une note chiffrée est refusée', () => {
    const r = ok({ texte: 'Ton texte vaut 12/20 : relis la fin.', localise: true });
    expect(r.manques).toContain('sans-note');
  });
});

describe('tout ce que l’app dit à l’élève sur son travail respecte ces critères', () => {
  const categories: CategorieErreur[] = ['majuscule_debut_phrase', 'point_fin_phrase', 'mot_repete'];

  test('les indices des signaux', () => {
    const s = detecterSignaux('il pleut. le le chat', categories);
    expect(s.length).toBeGreaterThanOrEqual(3);
    for (const x of s) expect(ok({ texte: x.indice, localise: true }), x.indice).toEqual({ ok: true, manques: [] });
  });

  test('les retours sur la longueur disent les chiffres et proposent quoi faire', () => {
    const [court] = verifierContraintes('Un chat.', { minMots: 5 });
    expect(court.message).toBe('Ton texte a 2 mots ; il en faut au moins 5. Ajoute une phrase.');
    expect(ok({ texte: court.message })).toEqual({ ok: true, manques: [] });
    const [long] = verifierContraintes('un deux trois quatre', { maxMots: 2 });
    expect(long.message).toBe('Ton texte a 4 mots ; il en faut au plus 2. Garde l’essentiel.');
    expect(ok({ texte: long.message })).toEqual({ ok: true, manques: [] });
  });

  test('le bilan du texte rendu est un fait sur le travail, sans « bravo »', () => {
    const un = recapRendu('Un chat roux.', 1);
    expect(un).toBe('Ton texte est rendu : 3 mots, 1 version.');
    expect(recapRendu('Un chat roux dort.', 2)).toBe('Ton texte est rendu : 4 mots, 2 versions. Regarde ce qui a changé dans « Ma version d’avant ».');
    expect(un.toLowerCase()).not.toContain('bravo');
    expect(ok({ texte: recapRendu('Un chat roux dort.', 2), genre: 'bilan' }).ok).toBe(true);
  });

  test('les explications « je ne comprends pas » : courtes et conformes, pour chaque année', () => {
    for (const annee of ['P1', 'P2', 'P3'] as const) {
      for (const cat of categories) {
        const e = explicationDe(cat, annee);
        expect(e.split(/\s+/).length, `${annee} ${cat}`).toBeLessThanOrEqual(35);
        expect(ok({ texte: e, localise: true }), e).toEqual({ ok: true, manques: [] });
      }
    }
  });
});
