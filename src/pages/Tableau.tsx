import { AIDES } from '../lib/aides';
import { justificationEnPhrase } from '../lib/atelier';
import { REFERENTIEL, REFERENTIEL_ANNEE, SOURCES_CECP } from '../lib/ancrage';
import { statutParItem } from '../lib/statut';
import type { Annee, AutoEvaluation, ItemCecp, Phase } from '../types';
import type { ProductionEleve } from '../lib/lignes';
import { comparerMots, type MotCompare } from '../lib/diff';

export interface LigneEleve {
  id: string;
  code: string;
  dernierePhase: Phase | 'rendu' | null;
  versions: number;
  // Aides que l'élève a ajoutées lui-même (traces) ; `aidesEnseignant` : celles que l'enseignant lui a activées.
  aides: string[];
  aidesEnseignant?: string[];
  itemsTravailles: string[];
  // Littératie à la rétroaction : demandes d'aide (« Je ne comprends pas ») et auto-évaluation avant de rendre.
  clarifications: number;
  autoEvaluation: AutoEvaluation | null;
  // Atelier de raisonnement grammatical : ce que l'élève a fait, sans jugement de l'application sur la grammaire.
  atelier?: { phrases: number; pasSur: number; justifications: string[] };
  // Chasse aux erreurs : erreurs trouvées, indices demandés, essais, justifications de l'élève.
  chasse?: { trouvees: number; indices: number; essais: number; justifications: string[] };
  // Textes de l'élève, par activité : premier jet, version finale, contrainte de lettre.
  productions?: ProductionEleve[];
}


interface Props {
  annee: Annee;
  items: ItemCecp[];
  eleves: LigneEleve[];
  activites: { id: string; itemIds: string[] }[];
  validations: { eleveId: string; itemId: string }[];
  onValider: (eleveId: string, itemId: string) => void;
  // Surnoms facultatifs de l'enseignant, mémorisés dans son navigateur : ils n'arrivent jamais au serveur.
  surnoms?: Record<string, string>;
  // Recharge les textes et les traces : un élève peut écrire pendant que le tableau est ouvert.
  onActualiser?: () => void;
}

function Mots({ mots, balise: Balise }: { mots: MotCompare[]; balise: 'del' | 'ins' }) {
  return (
    <>
      {mots.map((m, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {m.change ? <Balise>{m.mot}</Balise> : m.mot}
        </span>
      ))}
    </>
  );
}

function Production({ p }: { p: ProductionEleve }) {
  const cmp = p.premierJet !== undefined ? comparerMots(p.premierJet, p.final) : null;
  return (
    <details>
      <summary>Lire le texte</summary>
      <p className="text-sm">Consigne : {p.consigne}</p>
      <p className="text-sm">{p.rendu ? 'Texte rendu.' : 'Texte en cours d’écriture.'} Version {p.version}.</p>
      {p.contrainte &&
        (p.contrainte.respectee ? (
          <p>Contrainte de lettre respectée.</p>
        ) : (
          <p>Contrainte de lettre non respectée : {p.contrainte.mots.map((m) => `« ${m} »`).join(', ')}.</p>
        ))}
      {cmp ? (
        <div aria-label="Premier jet" role="group">
          <h4>Premier jet</h4>
          <p><Mots mots={cmp.avant} balise="del" /></p>
        </div>
      ) : (
        <p className="text-sm">Premier jet non conservé (texte écrit avant cette fonction).</p>
      )}
      <div aria-label="Version finale" role="group">
        <h4>{p.rendu ? 'Version finale' : 'Texte actuel'}</h4>
        <p>{cmp ? <Mots mots={cmp.apres} balise="ins" /> : p.final}</p>
      </div>
    </details>
  );
}

const PHASES: Record<Phase | 'rendu', string> = { reflechir: 'Réfléchir', ecrire: 'Écrire', relire: 'Relire', corriger: 'Corriger', rendu: 'Rendu' };

export default function Tableau({ annee, items, eleves, activites, validations, onValider, surnoms, onActualiser }: Props) {
  const statuts = statutParItem(items, activites, validations, eleves.map((e) => e.id));
  const libelleAide = (id: string) => AIDES.find((a) => a.id === id)?.libelle ?? id;
  const itemParId = (id: string) => items.find((i) => i.id === id);
  const avecAtelier = eleves.some((e) => (e.atelier?.phrases ?? 0) > 0 || (e.atelier?.pasSur ?? 0) > 0);
  const avecChasse = eleves.some((e) => (e.chasse?.essais ?? 0) > 0);
  const valide = (eleveId: string, itemId: string) => validations.some((v) => v.eleveId === eleveId && v.itemId === itemId);

  return (
    <div className="space-y-6">
      <section aria-label="Élèves">
        <h2>Élèves (codes anonymes)</h2>
        {onActualiser && (
          <button type="button" className="plai-btn" onClick={onActualiser}>
            Actualiser
          </button>
        )}
        {eleves.length === 0 ? (
          <p>Aucun élève pour le moment : cliquer sur « Ajouter 5 élèves » dans la partie Élèves, plus haut.</p>
        ) : (
          <div className="tableau-defilant">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Où il en est</th>
              <th>Texte</th>
              <th>Aides</th>
              <th>Demandes d’aide</th>
              <th>Auto-évaluation</th>
              {avecAtelier && <th>Atelier de grammaire</th>}
              {avecChasse && <th>Chasse aux erreurs</th>}
              <th>Items travaillés</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.code}
                  {surnoms?.[e.code] && <span> ({surnoms[e.code]})</span>}
                </td>
                <td>
                  {e.dernierePhase ? (
                    <>
                      <span>{PHASES[e.dernierePhase]}</span> · {e.versions} version{e.versions > 1 ? 's' : ''}
                    </>
                  ) : (
                    'Pas encore commencé'
                  )}
                </td>
                <td>
                  {(e.productions ?? []).length === 0 ? 'Pas encore de texte' : (e.productions ?? []).map((p) => <Production key={p.activiteId} p={p} />)}
                </td>
                <td>
                  <p>Activées par vous : {(e.aidesEnseignant ?? []).length > 0 ? (e.aidesEnseignant ?? []).map(libelleAide).join(' ; ') : 'aucune'}</p>
                  <p>Ajoutées par l’élève : {e.aides.length > 0 ? e.aides.map(libelleAide).join(' ; ') : 'aucune'}</p>
                </td>
                <td>{e.clarifications === 0 ? 'Aucune demande d’aide' : `${e.clarifications} demande${e.clarifications > 1 ? 's' : ''} d’aide`}</td>
                <td>
                  {e.autoEvaluation ? (
                    <div>
                      <ul>
                        {e.autoEvaluation.etoiles.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                      {e.autoEvaluation.souhait && <p>Souhait : {e.autoEvaluation.souhait}</p>}
                      {e.autoEvaluation.change && <p>Ce qui est mieux : {e.autoEvaluation.change}</p>}
                    </div>
                  ) : (
                    'Pas d’auto-évaluation'
                  )}
                </td>
                {avecAtelier && (
                  <td>
                    {e.atelier && (e.atelier.phrases > 0 || e.atelier.pasSur > 0) ? (
                      <div>
                        <p>
                          {e.atelier.phrases} phrase{e.atelier.phrases > 1 ? 's' : ''} · {e.atelier.pasSur} « pas sûr »
                        </p>
                        <ul>
                          {e.atelier.justifications.map((j, i) => (
                            <li key={i}>{justificationEnPhrase(j)}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      'Pas utilisé'
                    )}
                  </td>
                )}
                {avecChasse && (
                  <td>
                    {e.chasse && e.chasse.essais > 0 ? (
                      <div>
                        <p>
                          {e.chasse.trouvees} erreur{e.chasse.trouvees > 1 ? 's' : ''} trouvée{e.chasse.trouvees > 1 ? 's' : ''} · {e.chasse.indices} indice{e.chasse.indices > 1 ? 's' : ''} demandé{e.chasse.indices > 1 ? 's' : ''}
                        </p>
                        <ul>
                          {e.chasse.justifications.map((j, i) => (
                            <li key={i}>{j}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      'Pas utilisée'
                    )}
                  </td>
                )}
                <td>
                  {e.itemsTravailles.map((id) => {
                    const item = itemParId(id);
                    if (!item) return null;
                    return (
                      <div key={id}>
                        {item.codes.join(', ')} : {item.contenu}{' '}
                        {valide(e.id, id) ? (
                          <strong>Validé</strong>
                        ) : (
                          <button type="button" className="plai-btn" onClick={() => onValider(e.id, id)}>
                            Valider cet item pour cet élève
                          </button>
                        )}
                      </div>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        )}
      </section>

      <section aria-label={`Programme ${annee}`}>
        <h2>Programme CECP {annee}, écrire</h2>
        <p className="text-sm">
          Source : {SOURCES_CECP[annee].pdf}. {REFERENTIEL} : palier de scripteur attendu en {annee}, {REFERENTIEL_ANNEE[annee].palierScripteur}.
        </p>
        <p className="text-sm">L’app présente les traces. Vous seul décidez qu’un item est acquis.</p>
        <ul>
          {items.map((i) => {
            const s = statuts[i.id];
            return (
              <li key={i.id}>
                {i.codes.join(', ')} : {i.contenu} —{' '}
                {s.statut === 'non-vu' ? 'Pas encore travaillé' : s.statut === 'valide' ? `Validé pour toute la classe` : `Travaillé · ${s.nbValides} sur ${eleves.length} validé${s.nbValides > 1 ? 's' : ''}`}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
