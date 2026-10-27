import { useMemo, useState } from 'react';
import { lireLocal, sauverLocal } from '../lib/brouillonLocal';
import type { Verdict } from '../lib/chasse';
import { GABARIT_JUSTIFICATION } from '../lib/atelier';
import { morceauxDePhrase } from '../lib/mots';

// Chasse aux erreurs (spec 2026-10-27, voie B). Le texte vient de l'enseignant ; le corrigé reste côté serveur.
// Réponses qualitatives : jamais de note, de pourcentage ni de jugement.
interface Props {
  // Clé de la copie locale de la progression (isolée par élève et par activité).
  cle: string;
  texte: string;
  nbErreurs: number;
  essayer: (p: { motIndex: number; forme: string; justification: string }) => Promise<Verdict>;
  onFermer?: () => void;
}

interface Progression {
  trouvees: number[]; // numéros des mots trouvés
  essais: Record<string, number>; // indices demandés par erreur
}

const AIDE_APRES = 3;

function lire(cle: string): Progression {
  try {
    const p = JSON.parse(lireLocal(cle) ?? '');
    if (Array.isArray(p.trouvees) && typeof p.essais === 'object' && p.essais !== null) return p as Progression;
  } catch {
    /* pas de progression enregistrée */
  }
  return { trouvees: [], essais: {} };
}

const pluriel = (n: number) => `${n} erreur${n > 1 ? 's' : ''}`;

export default function Chasse({ cle, texte, nbErreurs, essayer, onFermer }: Props) {
  const morceaux = useMemo(() => morceauxDePhrase(texte), [texte]);
  const [prog, setProg] = useState<Progression>(() => lire(cle));
  const [choisi, setChoisi] = useState<number | null>(null);
  const [forme, setForme] = useState('');
  const [justification, setJustification] = useState('');
  const [message, setMessage] = useState('');
  const [probleme, setProbleme] = useState('');
  const [attente, setAttente] = useState(false);

  const restantes = nbErreurs - prog.trouvees.length;

  function garder(p: Progression) {
    setProg(p);
    sauverLocal(cle, JSON.stringify(p));
  }

  function selectionner(i: number) {
    if (i !== choisi) {
      setForme('');
      setJustification('');
    }
    setChoisi(i);
    setMessage('');
    setProbleme('');
  }

  async function verifier() {
    if (choisi === null || forme.trim() === '' || attente) return;
    setAttente(true);
    setProbleme('');
    try {
      const v = await essayer({ motIndex: choisi, forme: forme.trim(), justification: justification.trim() });
      if (v.resultat === 'trouve') {
        garder({ ...prog, trouvees: [...new Set([...prog.trouvees, choisi])] });
        setMessage('Tu as trouvé une erreur.');
        setChoisi(null);
      } else if (v.resultat === 'indice') {
        const n = (prog.essais[v.erreurId] ?? 0) + 1;
        garder({ ...prog, essais: { ...prog.essais, [v.erreurId]: n } });
        setMessage(n >= AIDE_APRES ? `${v.indice} Demande de l’aide à ton enseignant.` : v.indice);
      } else {
        setMessage('Ce n’est pas un des mots à corriger. Cherche encore.');
        setChoisi(null);
      }
    } catch (e) {
      setProbleme(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setAttente(false);
    }
  }

  return (
    <section className="plai-card" aria-label="Chasse aux erreurs">
      <h3>Chasse aux erreurs</h3>
      <ul>
        <li>Lire le texte.</li>
        <li>Cliquer sur un mot qui ne va pas.</li>
        <li>Écrire la forme corrigée.</li>
        <li>Compléter la justification, si possible.</li>
        <li>Cliquer sur « Vérifier ».</li>
      </ul>
      <p className="phrase-atelier" style={{ whiteSpace: 'pre-wrap' }}>
        {morceaux.map((m, i) => {
          if (m.motIndex === null) return <span key={i}>{m.texte}</span>;
          const trouve = prog.trouvees.includes(m.motIndex);
          return (
            <button key={i} type="button" className="mot-cliquable" aria-pressed={choisi === m.motIndex} disabled={trouve} onClick={() => selectionner(m.motIndex!)}>
              {m.texte}
              {trouve && <span className="visuellement-cache"> (trouvé)</span>}
              {trouve && <span aria-hidden="true"> ✓</span>}
            </button>
          );
        })}
      </p>
      <p>{restantes <= 0 ? 'Tu as trouvé toutes les erreurs.' : prog.trouvees.length === 0 ? `Il y a ${pluriel(nbErreurs)} dans le texte.` : `Il reste ${pluriel(restantes)} dans le texte.`}</p>

      {choisi !== null && (
        <div>
          <label htmlFor="chasse-forme">Forme corrigée</label>
          <input id="chasse-forme" className="plai-input" maxLength={60} value={forme} onChange={(e) => setForme(e.target.value)} />
          <label htmlFor="chasse-justification">Ma justification (facultatif)</label>
          <input id="chasse-justification" className="plai-input" maxLength={300} value={justification} onChange={(e) => setJustification(e.target.value)} aria-describedby="aide-chasse-justification" />
          <p id="aide-chasse-justification" className="text-sm">
            Écris une phrase pour expliquer ton choix, par exemple : {GABARIT_JUSTIFICATION}
          </p>
          <button type="button" className="plai-btn tuile" disabled={forme.trim() === '' || attente} onClick={verifier}>
            Vérifier
          </button>
        </div>
      )}
      {probleme && <p role="alert">{probleme}</p>}
      <p role="status">{message}</p>
      {onFermer && (
        <button type="button" className="plai-btn tuile" onClick={onFermer}>
          Fermer la chasse
        </button>
      )}
    </section>
  );
}
