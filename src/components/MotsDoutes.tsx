import { useState } from 'react';

// L'élève touche les mots dont il n'est pas sûr. L'application ne dit pas si le mot est bon ou faux : elle garde la trace pour l'enseignant.
export function motsDuTexte(texte: string): string[] {
  const vus = new Map<string, string>();
  for (const m of texte.matchAll(/\p{L}+(?:['’-]\p{L}+)*/gu)) {
    const cle = m[0].toLowerCase();
    if (!vus.has(cle)) vus.set(cle, m[0]);
  }
  return [...vus.values()];
}

export default function MotsDoutes({ texte, doutes, onBasculer }: { texte: string; doutes: string[]; onBasculer: (mot: string, marque: boolean) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const mots = motsDuTexte(texte);
  if (mots.length === 0) return null;
  // Fermé par défaut : ces mots ressemblent aux mots cliquables de l'atelier de grammaire et ne doivent pas s'y mêler.
  if (!ouvert) {
    return (
      <button type="button" className="plai-btn tuile" onClick={() => setOuvert(true)}>
        Marquer un mot dont je doute{doutes.length > 0 ? ` (${doutes.length})` : ''}
      </button>
    );
  }
  return (
    <div className="plai-card" role="group" aria-label="Mots dont je doute">
      <p>
        <strong>Les mots dont je doute</strong>
      </p>
      <button type="button" className="plai-btn tuile" onClick={() => setOuvert(false)}>
        Fermer
      </button>
      <p className="text-sm">Toucher un mot dont tu n’es pas sûr de l’écriture. Ton enseignant verra ces mots. L’application ne dit pas si un mot est juste ou faux.</p>
      <div className="flex gap-2 flex-wrap">
        {mots.map((m) => {
          const marque = doutes.includes(m.toLowerCase());
          return (
            <button key={m} type="button" className="plai-btn tuile" aria-pressed={marque} onClick={() => onBasculer(m, !marque)}>
              {marque ? '? ' : ''}
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
