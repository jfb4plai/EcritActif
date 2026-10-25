import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActiviteEleve } from '../../api/_lib/eleve';
import AidesPanel from '../components/AidesPanel';
import Picto from '../components/Picto';
import TexteColore from '../components/TexteColore';
import { AIDES, resoudreAides, type AideActive, type AideId } from '../lib/aides';
import { dicteePossible, dicter, lire, synthesePossible } from '../lib/audio';
import { choisirCritere, decider, initial, retourAutorise, suivant, type Choix } from '../lib/boucle';
import { lireLocal, sauverLocal } from '../lib/brouillonLocal';
import { chargerColorisation, type ModeColorisation } from '../lib/colorisation';
import { ATTRIBUTION_ARASAAC } from '../lib/pictos';
import { principeParId } from '../lib/principes';
import { detecterSignaux, verifierContraintes } from '../lib/retour';
import type { Phase } from '../types';

export interface ApiEleve {
  sauver(p: { jeton: string; activiteId: string; texte: string; phase: Phase; version: number; evenements: string[] }): Promise<{ version: number; aides: AideActive[] }>;
}

interface Props {
  activite: ActiviteEleve;
  jeton: string;
  api: ApiEleve;
  delaiSauvegardeMs?: number;
}

const TITRES: Record<Phase, string> = { reflechir: 'Réfléchir', ecrire: 'Écrire', relire: 'Relire', corriger: 'Corriger' };
const MODES: { id: ModeColorisation; libelle: string }[] = [
  { id: 'phonemes', libelle: 'Les sons' },
  { id: 'syllabes', libelle: 'Les syllabes' },
  { id: 'bpdq', libelle: 'b, p, d, q' },
  { id: 'voyelles-consonnes', libelle: 'Voyelles et consonnes' },
];

export default function EcranEleve({ activite, jeton, api, delaiSauvegardeMs = 2000 }: Props) {
  const cleTexte = `ecrit:${activite.id}`;
  const locale = useMemo(() => lireLocal(cleTexte), [cleTexte]);
  const versionLocale = useMemo(() => Number(lireLocal(`${cleTexte}:v`)) || 1, [cleTexte]);

  // Texte retrouvé sur l'appareil : on reprend directement à l'écriture.
  const [etat, setEtat] = useState(() => ({ ...initial(), phase: (locale !== null ? 'ecrire' : 'reflechir') as Phase, versions: versionLocale }));
  const [texte, setTexte] = useState(locale ?? '');
  const [rendu, setRendu] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  const [aidesServeur, setAidesServeur] = useState<AideActive[]>(activite.aides);
  const [choisies, setChoisies] = useState<AideId[]>([]);
  const [deja, setDeja] = useState<string[]>([]);
  const [ecoute, setEcoute] = useState(false);
  const [modeColor, setModeColor] = useState<ModeColorisation>('syllabes');
  const [colorPrete, setColorPrete] = useState(false);
  const evenements = useRef<string[]>(['ouverture']);
  const arretDictee = useRef<() => void>(() => {});

  const retirees = useMemo(() => {
    const vues = new Map<string, { id: AideId; raison: string }>();
    for (const r of activite.aidesRetirees) vues.set(r.id, r);
    for (const a of aidesServeur) if (!a.active) vues.set(a.id, { id: a.id, raison: a.raison ?? '' });
    return [...vues.values()];
  }, [activite.aidesRetirees, aidesServeur]);
  const ids = useMemo(() => [...new Set([...aidesServeur.map((a) => a.id), ...choisies])], [aidesServeur, choisies]);
  const resolues = useMemo(() => resoudreAides(ids, retirees), [ids, retirees]);
  const active = (id: AideId) => resolues.some((a) => a.id === id && a.active);

  // Copie locale à chaque changement, envoi au serveur après une pause de frappe.
  useEffect(() => {
    sauverLocal(cleTexte, texte);
    sauverLocal(`${cleTexte}:v`, String(etat.versions));
  }, [texte, etat.versions, cleTexte]);

  useEffect(() => {
    if (etat.phase === 'reflechir' && texte === '' && !rendu) return;
    const t = setTimeout(async () => {
      const envoyes = evenements.current.splice(0);
      try {
        const r = await api.sauver({ jeton, activiteId: activite.id, texte, phase: etat.phase, version: etat.versions, evenements: envoyes });
        setHorsLigne(false);
        setAidesServeur(r.aides);
      } catch {
        evenements.current.unshift(...envoyes);
        setHorsLigne(true);
      }
    }, delaiSauvegardeMs);
    return () => clearTimeout(t);
  }, [texte, etat.phase, etat.versions, rendu, api, jeton, activite.id, delaiSauvegardeMs]);

  useEffect(() => {
    if (active('colorisation')) chargerColorisation().then(() => setColorPrete(true));
  }, [resolues]); // eslint-disable-line react-hooks/exhaustive-deps

  function aller(phase: 'suivant' | Choix) {
    if (phase === 'suivant') {
      setEtat((e) => suivant(e));
      evenements.current.push('phase:' + suivant(etat).phase);
      return;
    }
    const r = decider(etat, phase);
    setEtat(r.etat);
    evenements.current.push('choix:' + phase);
    if (r.rendu) setRendu(true);
  }

  function basculerGene(gene: string) {
    const lies = AIDES.filter((a) => a.gene === gene).map((a) => a.id);
    // Trace pour le tableau de bord : seules les aides que l'élève active sont enregistrées.
    if (!lies.every((id) => choisies.includes(id))) for (const id of lies) evenements.current.push('aide:' + id);
    setChoisies((c) => (lies.every((id) => c.includes(id)) ? c.filter((id) => !lies.includes(id)) : [...new Set([...c, ...lies])]));
  }

  const principes = (phase: Phase) => activite.principeIds.map((id) => principeParId(id)).filter((p) => p && p.phase === phase) as NonNullable<ReturnType<typeof principeParId>>[];

  const questionsRelire = useMemo(() => {
    const contraintes = verifierContraintes(texte, activite.contraintes)
      .filter((v) => !v.atteinte)
      .map((v) => ({ id: 'contrainte:' + v.contrainte, texte: v.question }));
    return [...contraintes, ...principes('relire').map((p) => ({ id: p.id, texte: p.question }))];
  }, [texte, activite]); // eslint-disable-line react-hooks/exhaustive-deps
  const critereId = choisirCritere(questionsRelire.map((q) => q.id), deja);
  const critere = questionsRelire.find((q) => q.id === critereId);

  const signaux = useMemo(() => detecterSignaux(texte, activite.categories), [texte, activite.categories]);
  const categorieActive = signaux[0]?.categorie;
  const signauxActifs = signaux.filter((s) => s.categorie === categorieActive);

  function dicterTexte() {
    if (ecoute) {
      arretDictee.current();
      setEcoute(false);
      return;
    }
    setEcoute(true);
    arretDictee.current = dicter(
      (t) => setTexte((p) => p + (p && !p.endsWith(' ') ? ' ' : '') + t),
      () => setEcoute(false),
    );
  }

  const mots = activite.consigne.match(/[\p{L}]{4,}/gu)?.slice(0, 8) ?? [];
  const peutLire = synthesePossible();

  const consigneBloc = (
    <div className="plai-card">
      <p>{activite.consigne}</p>
      {peutLire && (
        <button type="button" className="plai-btn" onClick={() => lire(activite.consigne)}>
          Écouter la consigne
        </button>
      )}
      {active('pictogrammes') && (
        <div>
          <div className="flex gap-2 flex-wrap">
            {mots.map((m) => (
              <Picto key={m} mot={m} />
            ))}
          </div>
          <p className="text-sm">{ATTRIBUTION_ARASAAC}</p>
        </div>
      )}
    </div>
  );

  const zoneTexte = (
    <div>
      <label htmlFor="mon-texte">Mon texte</label>
      <textarea id="mon-texte" className="plai-input" style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.25rem', minHeight: '12rem' }} value={texte} onChange={(e) => setTexte(e.target.value)} disabled={rendu} />
      {active('dictee-vocale') &&
        (dicteePossible() ? (
          <button type="button" className="plai-btn" onClick={dicterTexte}>
            {ecoute ? 'Arrêter' : 'Parler pour écrire'}
          </button>
        ) : (
          <p className="text-sm">Ton navigateur ne peut pas écrire ce que tu dis.</p>
        ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <ol className="flex gap-2" aria-label="Les quatre temps">
        {(Object.keys(TITRES) as Phase[]).map((p) => (
          <li key={p} aria-current={etat.phase === p ? 'step' : undefined} style={{ fontWeight: etat.phase === p ? 700 : 400 }}>
            {TITRES[p]}
          </li>
        ))}
      </ol>
      {horsLigne && <p role="status">Texte enregistré seulement sur cet appareil. Garde cette page ouverte.</p>}

      {etat.phase === 'reflechir' && (
        <section>
          {consigneBloc}
          <ul>
            {principes('reflechir').map((p) => (
              <li key={p.id}>{p.question}</li>
            ))}
          </ul>
          <button type="button" className="plai-btn" onClick={() => aller('suivant')}>
            Commencer à écrire
          </button>
        </section>
      )}

      {etat.phase === 'ecrire' && (
        <section>
          {consigneBloc}
          {zoneTexte}
          <button type="button" className="plai-btn" onClick={() => aller('suivant')}>
            J’ai fini d’écrire
          </button>
        </section>
      )}

      {etat.phase === 'relire' && (
        <section>
          {consigneBloc}
          {texte.trim() === '' ? (
            <div>
              <p>Écris d’abord quelques mots.</p>
              <button type="button" className="plai-btn" onClick={() => aller('continuer')}>
                Retourner écrire
              </button>
            </div>
          ) : (
            <div>
              {active('colorisation') && (
                <label>
                  Colorer{' '}
                  <select value={modeColor} onChange={(e) => setModeColor(e.target.value as ModeColorisation)}>
                    {MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.25rem' }}>{active('colorisation') && colorPrete ? <TexteColore texte={texte} mode={modeColor} /> : texte}</p>
              {active('audio-relecture') &&
                (peutLire ? (
                  <button type="button" className="plai-btn" onClick={() => lire(texte)}>
                    Écouter mon texte
                  </button>
                ) : (
                  <p className="text-sm">Ton navigateur ne peut pas lire à voix haute.</p>
                ))}
              {retourAutorise(etat.phase) && critere ? (
                <div className="plai-card">
                  <p>{critere.texte}</p>
                  <button type="button" className="plai-btn" onClick={() => setDeja([...deja, critere.id])}>
                    J’ai regardé
                  </button>
                </div>
              ) : (
                <p>Tu as regardé toutes les questions.</p>
              )}
              <button type="button" className="plai-btn" onClick={() => aller('suivant')}>
                Passer à la correction
              </button>
            </div>
          )}
        </section>
      )}

      {etat.phase === 'corriger' && (
        <section>
          {zoneTexte}
          {signauxActifs.length > 0 ? (
            <ul>
              {signauxActifs.map((s, i) => (
                <li key={i}>{s.indice}</li>
              ))}
            </ul>
          ) : (
            <p>Rien à signaler pour le moment.</p>
          )}
          {!rendu ? (
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="plai-btn" onClick={() => aller('continuer')}>
                Continuer à écrire
              </button>
              <button type="button" className="plai-btn" onClick={() => aller('reecrire')}>
                Écrire une nouvelle version
              </button>
              <button type="button" className="plai-btn" onClick={() => aller('rendre')}>
                Rendre mon texte
              </button>
            </div>
          ) : (
            <p role="status">Ton texte est rendu. Bravo !</p>
          )}
        </section>
      )}

      <AidesPanel choisies={choisies} resolues={resolues} onBasculerGene={basculerGene} />
    </div>
  );
}
