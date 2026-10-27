import { describe, expect, test } from 'vitest';
import { PROGRAMME, REFERENTIEL, REFERENTIEL_ANNEE, SOURCES_CECP, TEMPS_CECP } from './ancrage';
import { itemParCode, itemParId, itemsParAnnee } from './cecp';
import type { Annee, Phase } from '../types';

const normaliser = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');

describe('les quatre temps de l’app reprennent les composantes de la production d’écrit du programme', () => {
  test.each(['reflechir', 'ecrire', 'relire', 'corriger'] as Phase[])('« %s » correspond à un terme de F282', (temps) => {
    const { terme, code } = TEMPS_CECP[temps];
    const item = itemParCode(code);
    expect(item, code).toBeDefined();
    expect(item!.annee).toBe('P3');
    expect(normaliser(item!.attendus.join(' '))).toContain(normaliser(terme));
  });

  test('les quatre termes sont planification, mise en texte, révision, correction', () => {
    expect(Object.values(TEMPS_CECP).map((t) => t.terme)).toEqual(['planification', 'mise en texte', 'révision', 'correction']);
  });
});

describe('sources du programme', () => {
  test('le programme est nommé comme dans les données extraites', () => {
    expect(PROGRAMME).toBe('Programme d’études de l’enseignement primaire (CECP, Wallonie-Bruxelles Enseignement)');
  });

  test.each(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as Annee[])('%s : fichier source et date d’extraction renseignés', (annee) => {
    const s = SOURCES_CECP[annee];
    expect(s.pdf).toMatch(/\.pdf$/);
    expect(s.extraitLe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('le fichier de P3 est celui qui a été lu', () => {
    expect(SOURCES_CECP.P3.pdf).toBe('P3_Montage_10-12-2024_INT.pdf');
  });
});

describe('référentiel de français du tronc commun (FWB) : ce que l’école doit faire écrire', () => {
  test('le référentiel est nommé comme dans la source extraite', () => {
    expect(REFERENTIEL).toBe('Référentiel de français et langues anciennes (tronc commun, Fédération Wallonie-Bruxelles)');
  });

  test('pages de la section français de chaque année', () => {
    expect(REFERENTIEL_ANNEE.P1.pages).toBe('37-52');
    expect(REFERENTIEL_ANNEE.P2.pages).toBe('53-69');
    expect(REFERENTIEL_ANNEE.P3.pages).toBe('70-87');
    expect(REFERENTIEL_ANNEE.P4.pages).toBe('88-108');
    expect(REFERENTIEL_ANNEE.P5.pages).toBe('109-131');
    expect(REFERENTIEL_ANNEE.P6.pages).toBe('132-153');
  });

  test('palier de scripteur attendu par année', () => {
    expect(REFERENTIEL_ANNEE.P1.palierScripteur).toBe('scripteur émergent vers scripteur débutant');
    expect(REFERENTIEL_ANNEE.P2.palierScripteur).toBe('scripteur débutant');
    expect(REFERENTIEL_ANNEE.P3.palierScripteur).toBe('scripteur en transition');
    expect(REFERENTIEL_ANNEE.P4.palierScripteur).toBe('scripteur en transition');
    expect(REFERENTIEL_ANNEE.P5.palierScripteur).toBe('scripteur confirmé (en cheminement vers)');
    expect(REFERENTIEL_ANNEE.P6.palierScripteur).toContain('scripteur confirmé (en cheminement vers)');
  });

  test('50 % de formes correctes en fin de P2, 60 % en P4, 80 % en P6 ; rien de chiffré dans le fichier pour P1, P3 et P5', () => {
    expect(REFERENTIEL_ANNEE.P2.formesCorrectes).toBe(50);
    expect(REFERENTIEL_ANNEE.P4.formesCorrectes).toBe(60);
    expect(REFERENTIEL_ANNEE.P5.formesCorrectes).toBeNull();
    expect(REFERENTIEL_ANNEE.P6.formesCorrectes).toBe(80);
    expect(REFERENTIEL_ANNEE.P1.formesCorrectes).toBeNull();
    expect(REFERENTIEL_ANNEE.P3.formesCorrectes).toBeNull();
  });

  test('les composantes de la production d’écrit : trois en P1, la correction s’ajoute en P2', () => {
    expect(REFERENTIEL_ANNEE.P1.composantes).toEqual(['planification', 'mise en texte', 'révision']);
    expect(REFERENTIEL_ANNEE.P2.composantes).toEqual(['planification', 'mise en texte', 'révision', 'correction']);
    for (const a of ['P3', 'P4', 'P5', 'P6'] as const) {
      expect(REFERENTIEL_ANNEE[a].composantes).toEqual(['planification', 'mise en texte', 'révision', 'correction']);
    }
  });

  test('l’attendu officiel de l’écrit est cité tel quel', () => {
    expect(REFERENTIEL_ANNEE.P1.attenduEcrire).toContain('en utilisant la majuscule et le point');
    expect(REFERENTIEL_ANNEE.P1.attenduEcrire).toContain('en respectant la segmentation en mots');
    expect(REFERENTIEL_ANNEE.P3.attenduEcrire).toContain('en utilisant les organisateurs textuels adéquats');
  });
});

describe('itemParId', () => {
  test('retrouve un item par son identifiant et renvoie undefined sinon', () => {
    const premier = itemsParAnnee('P1')[0];
    expect(itemParId(premier.id)).toEqual(premier);
    expect(itemParId('P9:F0')).toBeUndefined();
  });
});
