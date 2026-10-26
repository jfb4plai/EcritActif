import { PROGRAMME, REFERENTIEL, REFERENTIEL_ANNEE, SOURCES_CECP } from '../lib/ancrage';
import type { Annee, ItemCecp } from '../types';

// Cite ensemble, pour une année, ce que dit le référentiel du tronc commun et ce que dit le programme CECP (items choisis).
export default function RepereProgramme({ annee, items }: { annee: Annee; items: ItemCecp[] }) {
  const r = REFERENTIEL_ANNEE[annee];
  return (
    <div className="space-y-2">
      <p>
        <strong>{REFERENTIEL}</strong>, section français, p. {r.pages}.
      </p>
      <p>
        Palier de scripteur attendu : {r.palierScripteur}
        {r.formesCorrectes !== null ? ` ; ${r.formesCorrectes} % de formes correctes en fin d’année` : ''}.
      </p>
      <p>À l’écrit, l’élève doit pouvoir : « {r.attenduEcrire} »</p>
      <p>Composantes de la production d’écrit nommées cette année : {r.composantes.join(' ; ')}.</p>
      {items.length > 0 && (
        <>
          <p>
            <strong>{PROGRAMME}</strong>, fichier {SOURCES_CECP[annee].pdf}.
          </p>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                {i.codes.join(', ')} : {i.contenu}
                {i.attendus.map((a, k) => (
                  <span key={k} className="block">
                    {a}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
