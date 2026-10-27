import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Tableau from './Tableau';
import type { ItemCecp } from '../types';

const base = { annee: 'P1' as const, type: 'Savoir-faire' as const, rubrique: null, pagePdf: 1, attendus: ['x'] };
const I1: ItemCecp = { ...base, id: 'P1:F114+F115', codes: ['F114', 'F115'], contenu: 'Réviser sa production écrite' };
const I2: ItemCecp = { ...base, id: 'P1:F39+F40', codes: ['F39', 'F40'], contenu: 'Utiliser la majuscule et le point' };

function afficher(validations: { eleveId: string; itemId: string }[] = []) {
  const onValider = vi.fn();
  render(
    <Tableau
      annee="P1"
      items={[I1, I2]}
      eleves={[
        { id: 'e1', code: 'KMNPQR', dernierePhase: 'relire', versions: 2, aides: ['colorisation'], itemsTravailles: ['P1:F114+F115'], clarifications: 2, autoEvaluation: { etoiles: ['J’ai décrit mon chat', 'J’ai mis un point'], souhait: 'Écrire une phrase de plus' } },
        { id: 'e2', code: 'STUVWX', dernierePhase: null, versions: 0, aides: [], itemsTravailles: [], clarifications: 0, autoEvaluation: null },
      ]}
      activites={[{ id: 'a1', itemIds: ['P1:F114+F115'] }]}
      validations={validations}
      onValider={onValider}
    />,
  );
  return { onValider };
}

describe('Tableau', () => {
  test('affiche les codes anonymes, la dernière phase atteinte et les versions', () => {
    afficher();
    const ligne = screen.getByText('KMNPQR').closest('tr') as HTMLElement;
    expect(within(ligne).getByText('Relire')).toBeInTheDocument();
    expect(within(ligne).getByText(/2 versions/)).toBeInTheDocument();
    expect(within(screen.getByText('STUVWX').closest('tr') as HTMLElement).getByText(/pas encore commencé/i)).toBeInTheDocument();
  });

  test('le repère du référentiel (palier de scripteur attendu) accompagne la carte du programme', () => {
    afficher();
    expect(screen.getByText(/scripteur émergent vers scripteur débutant/i)).toBeInTheDocument();
    expect(screen.getByText(/Référentiel de français et langues anciennes/)).toBeInTheDocument();
  });

  test('la carte du programme cite son fichier source', () => {
    afficher();
    expect(screen.getByText(/Programme P1-Version interactive\.pdf/)).toBeInTheDocument();
  });

  test('un texte rendu est indiqué « Rendu »', () => {
    render(
      <Tableau annee="P1" items={[I1]} eleves={[{ id: 'e1', code: 'KMNPQR', dernierePhase: 'rendu', versions: 1, aides: [], itemsTravailles: [], clarifications: 0, autoEvaluation: null }]} activites={[]} validations={[]} onValider={() => {}} />,
    );
    expect(screen.getByText('Rendu')).toBeInTheDocument();
  });

  test('affiche les demandes d’aide et l’auto-évaluation de l’élève', () => {
    afficher();
    const ligne = screen.getByText('KMNPQR').closest('tr') as HTMLElement;
    expect(within(ligne).getByText(/2 demandes d.aide/i)).toBeInTheDocument();
    expect(within(ligne).getByText(/J’ai décrit mon chat/)).toBeInTheDocument();
    expect(within(ligne).getByText(/Écrire une phrase de plus/)).toBeInTheDocument();
    const autre = screen.getByText('STUVWX').closest('tr') as HTMLElement;
    expect(within(autre).getByText(/pas d.auto-évaluation/i)).toBeInTheDocument();
  });

  test('affiche les aides utilisées par libellé', () => {
    afficher();
    expect(within(screen.getByText('KMNPQR').closest('tr') as HTMLElement).getByText(/Colorer les sons ou les syllabes/)).toBeInTheDocument();
  });

  test('l’enseignant valide un item pour un élève ; l’app ne le fait jamais seule', async () => {
    const { onValider } = afficher();
    expect(onValider).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /valider cet item pour cet élève/i }));
    expect(onValider).toHaveBeenCalledWith('e1', 'P1:F114+F115');
  });

  test('un item déjà validé est marqué et n’a plus de bouton', () => {
    afficher([{ eleveId: 'e1', itemId: 'P1:F114+F115' }]);
    expect(screen.queryByRole('button', { name: /valider cet item pour cet élève/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^Validé$/)).toBeInTheDocument();
  });

  test('la carte du programme distingue pas encore travaillé et travaillé', () => {
    afficher();
    const carte = screen.getByRole('region', { name: /programme/i });
    expect(within(carte).getAllByText(/F114, F115/).length).toBeGreaterThan(0);
    expect(within(carte).getByText(/Pas encore travaillé/)).toBeInTheDocument();
    expect(within(carte).getByText(/Travaillé · 0 sur 2 validé/)).toBeInTheDocument();
  });
});

describe('Tableau : atelier de grammaire', () => {
  const unAtelier = { phrases: 2, pasSur: 1, justifications: ['verbe-sujet:élèves|ils|prépare|e', 'groupe-nominal:chats|masculin|plusieurs|Les|s'] };
  const montrer = (atelier?: { phrases: number; pasSur: number; justifications: string[] }) =>
    render(
      <Tableau
        annee="P4"
        items={[I1]}
        eleves={[{ id: 'e1', code: 'KMNPQR', dernierePhase: 'corriger', versions: 1, aides: [], itemsTravailles: [], clarifications: 0, autoEvaluation: null, ...(atelier ? { atelier } : {}) }]}
        activites={[{ id: 'a1', itemIds: [] }]}
        validations={[]}
        onValider={vi.fn()}
      />,
    );

  test('la colonne apparaît quand un élève a travaillé l’atelier : phrases et « pas sûr »', () => {
    montrer(unAtelier);
    expect(screen.getByRole('columnheader', { name: /atelier de grammaire/i })).toBeInTheDocument();
    const ligne = screen.getByText('KMNPQR').closest('tr') as HTMLElement;
    expect(within(ligne).getByText(/2 phrases/)).toBeInTheDocument();
    expect(within(ligne).getByText(/1 « pas sûr »/)).toBeInTheDocument();
  });

  test('la justification de l’élève est lisible, en phrase', () => {
    montrer(unAtelier);
    expect(screen.getByText(/Le sujet est élèves\. Je peux le remplacer par ils\. Le verbe prépare se termine par e\./)).toBeInTheDocument();
    expect(screen.getByText(/Le nom est chats\. Il est masculin et plusieurs\./)).toBeInTheDocument();
  });

  test('aucun élève n’a utilisé l’atelier : pas de colonne', () => {
    montrer({ phrases: 0, pasSur: 0, justifications: [] });
    expect(screen.queryByRole('columnheader', { name: /atelier de grammaire/i })).not.toBeInTheDocument();
  });

  test('ligne sans information d’atelier (ancienne donnée) : pas de colonne, pas d’erreur', () => {
    montrer();
    expect(screen.queryByRole('columnheader', { name: /atelier de grammaire/i })).not.toBeInTheDocument();
  });
});

describe('Tableau : chasse aux erreurs', () => {
  const montrer = (chasse?: { trouvees: number; indices: number; essais: number; justifications: string[] }) =>
    render(
      <Tableau
        annee="P4"
        items={[I1]}
        eleves={[{ id: 'e1', code: 'KMNPQR', dernierePhase: 'corriger', versions: 1, aides: [], itemsTravailles: [], clarifications: 0, autoEvaluation: null, ...(chasse ? { chasse } : {}) }]}
        activites={[{ id: 'a1', itemIds: [] }]}
        validations={[]}
        onValider={vi.fn()}
      />,
    );

  test('la colonne apparaît quand un élève a essayé : erreurs trouvées, indices, justification', () => {
    montrer({ trouvees: 2, indices: 3, essais: 7, justifications: ['Le sujet est élèves.'] });
    expect(screen.getByRole('columnheader', { name: /chasse aux erreurs/i })).toBeInTheDocument();
    const ligne = screen.getByText('KMNPQR').closest('tr') as HTMLElement;
    expect(within(ligne).getByText(/2 erreurs trouvées/)).toBeInTheDocument();
    expect(within(ligne).getByText(/3 indices demandés/)).toBeInTheDocument();
    expect(within(ligne).getByText('Le sujet est élèves.')).toBeInTheDocument();
  });

  test('aucun essai : pas de colonne', () => {
    montrer({ trouvees: 0, indices: 0, essais: 0, justifications: [] });
    expect(screen.queryByRole('columnheader', { name: /chasse aux erreurs/i })).not.toBeInTheDocument();
  });

  test('ligne sans information de chasse : pas de colonne, pas d’erreur', () => {
    montrer();
    expect(screen.queryByRole('columnheader', { name: /chasse aux erreurs/i })).not.toBeInTheDocument();
  });
});

