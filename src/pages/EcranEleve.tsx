import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import type { ActiviteEleve } from '../../api/_lib/eleve';
import AidesPanel from '../components/AidesPanel';
import Picto from '../components/Picto';
import TexteColore from '../components/TexteColore';
import { AIDES, resoudreAides, type AideActive, type AideId } from '../lib/aides';
import { dicteePossible, dicter, lire, synthesePossible } from '../lib/audio';
import { choisirCritere, decider, initial, retourAutorise, suivant, type Choix, type EtatBoucle } from '../lib/boucle';
import { lireLocal, sauverLocal } from '../lib/brouillonLocal';
import { chargerColorisation, type ModeColorisation } from '../lib/colorisation';
import { ATTRIBUTION_ARASAAC } from '../lib/pictos';
import { principeParId } from '../lib/principes';
import { detecterSignaux, verifierContraintes } from '../lib/retour';
import type { Phase } from '../types';

export interface ApiEleve {
  sauver(p: { jeton: string; activiteId: string; texte: string; phase: Phase | 'rendu'; version: number; evenements: string[] }): Promise<{ version: number; aides: AideActive[]; aidesRetirees?: { id: AideId; raison: string }[] }>;
}

interface Props {
  activite: ActiviteEleve;
  // Identifiant de l'élève : isole la copie locale sur un appareil partagé par plusieurs élèves.
  eleveId: string;
  jeton: string;
  api: ApiEleve;
  delaiSauvegardeMs?: number;
  reessaiMs?: number;
}

const TITRES: Record<Phase, string> = { reflechir: 'Réfléchir', ecrire: 'Écrire', relire: 'Relire', corriger: 'Corriger' };
const MODES: { id: ModeColorisation; libelle: string }[] = [
  { id: 'phonemes', libelle: 'Les sons' },
  { id: 'syllabes', libelle: 'Les syllabes' },
  { id: 'bpdq', libelle: 'b, p, d, q' },
  { id: 'voyelles-consonnes', libelle: 'Voyelles et consonnes' },
];

export default function EcranEleve({ activite, eleveId, jeton, api, delaiSauvegardeMs = 2000, reessaiMs = 5000 }: Props) {
  const cleTexte = `ecrit:${eleveId}:${activite.id}`;
  const locale = useMemo(() => lireLocal(cleTexte), [cleTexte]);
  const versionLocale = useMemo(() => Number(lireLocal(`${cleTexte}:v`)) || 1, [cleTexte]);
  const reprise = activite.reprise;
  const renduAvant = reprise?.phase === 'rendu';

  // Reprise : un texte déjà rendu reste rendu ; sinon la copie de l'appareil, puis celle du serveur.
  const departTexte = renduAvant ? reprise!.texte : (locale ?? reprise?.texte ?? '');
  const departVersion = renduAvant ? reprise!.version : locale !== null ? versionLocale : (reprise?.version ?? 1);
  const departPhase: Phase = renduAvant ? 'corriger' : locale !== null || reprise ? 'ecrire' : 'reflechir';
  const [etat, setEtat] = useState<EtatBoucle>(() => ({ ...initial(), phase: departPhase, versions: departVersion }));
  const [texte, setTexte] = useState(departTexte);
  const [rendu, setRendu] = useState(renduAvant);
  const [essai, setEssai] = useState(0);
  const [horsLigne, setHorsLigne] = useState(false);
  const [aidesServeur, setAidesServeur] = useState<AideActive[]>(activite.aides);
  const [retraitsServeur, setRetraitsServeur] = useState(activite.aidesRetirees);
  const [choisies, setChoisies] = useState<AideId[]>([]);
  const [deja, setDeja] = useState<string[]>([]);
  const [ecoute, setEcoute] = useState(false);
  const [modeColor, setModeColor] = useState<ModeColorisation>('syllabes');
  const [colorPrete, setColorPrete] = useState(false);
  const [collageRefuse, setCollageRefuse] = useState(false);
  const [plan, setPlan] = useState(() => {
    try {
      return { debut: '', ensuite: '', fin: '', ...(JSON.parse(lireLocal(`${cleTexte}:plan`) ?? '{}') as object) };
    } catch {
      return { debut: '', ensuite: '', fin: '' };
    }
  });
  const evenements = useRef<string[]>(['ouverture']);
  const arretDictee = useRef<() => void>(() => {});

  const retirees = useMemo(() => {
    const vues = new Map<string, { id: AideId; raison: string }>();
    for (const r of retraitsServeur) vues.set(r.id, r);
    for (const a of aidesServeur) if (!a.active) vues.set(a.id, { id: a.id, raison: a.raison ?? '' });
    return [...vues.values()];
  }, [retraitsServeur, aidesServeur]);
  const ids = useMemo(() => [...new Set([...aidesServeur.map((a) => a.id), ...choisies])], [aidesServeur, choisies]);
  const resolues = useMemo(() => resoudreAides(ids, retirees), [ids, retirees]);
  const active = (id: AideId) => resolues.some((a) => a.id === id && a.active);

  // Copie locale à chaque changement, envoi au serveur après une pause de frappe.
  useEffect(() => {
    sauverLocal(cleTexte, texte);
    sauverLocal(`${cleTexte}:v`, String(etat.versions));
  }, [texte, etat.versions, cleTexte]);

  useEffect(() => {
    if (renduAvant) return; // ne jamais écraser un texte déjà rendu
    if (etat.phase === 'reflechir' && texte === '' && !rendu) return;
    const t = setTimeout(async () => {
      const envoyes = evenements.current.splice(0);
      try {
        const r = await api.sauver({ jeton, activiteId: activite.id, texte, phase: rendu ? 'rendu' : etat.phase, version: etat.versions, evenements: envoyes });
        setHorsLigne(false);
        setAidesServeur(r.aides);
        if (r.aidesRetirees) setRetraitsServeur(r.aidesRetirees);
      } catch {
        evenements.current.unshift(...envoyes);
        setHorsLigne(true);
      }
    }, delaiSauvegardeMs);
    return () => clearTimeout(t);
  }, [texte, etat.phase, etat.versions, rendu, essai, renduAvant, api, jeton, activite.id, delaiSauvegardeMs]);

  // Réseau coupé : on retente seul, l'élève n'a pas à retaper quoi que ce soit.
  useEffect(() => {
    if (!horsLigne) return;
    const t = setTimeout(() => setEssai((n) => n + 1), reessaiMs);
    return () => clearTimeout(t);
  }, [horsLigne, essai, reessaiMs]);

  useEffect(() => {
    sauverLocal(`${cleTexte}:plan`, JSON.stringify(plan));
  }, [plan, cleTexte]);

  // Aide « Écouter la consigne » : lecture automatique une seule fois, à l'ouverture de l'activité.
  const consigneLue = useRef(false);
  useEffect(() => {
    if (consigneLue.current || !active('audio-consigne') || !synthesePossible()) return;
    consigneLue.current = true;
    lire(activite.consigne);
  }); // eslint-disable-line react-hooks/exhaustive-deps

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

  const questionsPerso = (phase: Phase) => activite.principesPerso.filter((q) => q.phase === phase);

  const principes = (phase: Phase) => activite.principeIds.map((id) => principeParId(id)).filter((p) => p && p.phase === phase) as NonNullable<ReturnType<typeof principeParId>>[];

  const questionsRelire = useMemo(() => {
    const contraintes = verifierContraintes(texte, activite.contraintes)
      .filter((v) => !v.atteinte)
      .map((v) => ({ id: 'contrainte:' + v.contrainte, texte: v.question }));
    const perso = questionsPerso('relire').map((q, i) => ({ id: 'perso:relire:' + i, texte: q.question }));
    return [...contraintes, ...principes('relire').map((p) => ({ id: p.id, texte: p.question })), ...perso];
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

  function ajouterMot(mot: string) {
    setTexte((p) => p + (p && !/\s$/.test(p) ? ' ' : '') + mot);
  }

  // Le collage n'est accepté que pour du texte que l'élève a lui-même écrit.
  function refuserSiEtranger(e: ClipboardEvent | DragEvent, colle: string) {
    if (colle !== '' && !texte.includes(colle)) {
      e.preventDefault();
      setCollageRefuse(true);
      evenements.current.push('collage-refuse');
    }
  }

  const memoIdees = [plan.debut, plan.ensuite, plan.fin].some((x) => x.trim() !== '') && (
    <section aria-label="Mes idées" className="plai-card">
      <h2>Mes idées</h2>
      <ul>
        {plan.debut.trim() !== '' && <li>Au début : {plan.debut}</li>}
        {plan.ensuite.trim() !== '' && <li>Ensuite : {plan.ensuite}</li>}
        {plan.fin.trim() !== '' && <li>À la fin : {plan.fin}</li>}
      </ul>
    </section>
  );

  const zoneTexte = (
    <div>
      {active('organisateur') && memoIdees}
      <label htmlFor="mon-texte">Mon texte</label>
      <textarea
        id="mon-texte"
        className="plai-input"
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.25rem', minHeight: '12rem' }}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onPaste={(e) => refuserSiEtranger(e, e.clipboardData.getData('text'))}
        onDrop={(e) => refuserSiEtranger(e, e.dataTransfer.getData('text'))}
        disabled={rendu}
      />
      {collageRefuse && <p role="status">Écris avec tes mots : on peut seulement coller un morceau de ton propre texte.</p>}
      {active('banque-mots') && !rendu && activite.banqueMots.length > 0 && (
        <div className="flex gap-2 flex-wrap" aria-label="Mots utiles">
          {activite.banqueMots.map((m) => (
            <button key={m} type="button" className="plai-btn" onClick={() => ajouterMot(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
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
            {questionsPerso('reflechir').map((q, i) => (
              <li key={'perso' + i}>{q.question}</li>
            ))}
          </ul>
          {peutLire && principes('reflechir').length + questionsPerso('reflechir').length > 0 && (
            <button type="button" className="plai-btn" onClick={() => lire([...principes('reflechir').map((p) => p.question), ...questionsPerso('reflechir').map((q) => q.question)].join(' '))}>
              Écouter les questions
            </button>
          )}
          {active('organisateur') && (
            <fieldset>
              <legend>Range tes idées</legend>
              <label htmlFor="plan-debut">Au début</label>
              <textarea id="plan-debut" className="plai-input" value={plan.debut} onChange={(e) => setPlan({ ...plan, debut: e.target.value })} />
              <label htmlFor="plan-ensuite">Ensuite</label>
              <textarea id="plan-ensuite" className="plai-input" value={plan.ensuite} onChange={(e) => setPlan({ ...plan, ensuite: e.target.value })} />
              <label htmlFor="plan-fin">À la fin</label>
              <textarea id="plan-fin" className="plai-input" value={plan.fin} onChange={(e) => setPlan({ ...plan, fin: e.target.value })} />
            </fieldset>
          )}
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
                  {peutLire && (
                    <button type="button" className="plai-btn" onClick={() => lire(critere.texte)}>
                      Écouter la question
                    </button>
                  )}
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
          {questionsPerso('corriger').length > 0 && (
            <ul>
              {questionsPerso('corriger').map((q, i) => (
                <li key={'perso' + i}>{q.question}</li>
              ))}
            </ul>
          )}
          {zoneTexte}
          {signauxActifs.length > 0 ? (
            <ul>
              {signauxActifs.map((s, i) => (
                <li key={i}>
                  {s.indice}{' '}
                  <q>
                    {texte.slice(Math.max(0, s.debut - 12), s.debut)}
                    <mark>{texte.slice(s.debut, Math.max(s.fin, s.debut + 1))}</mark>
                    {texte.slice(Math.max(s.fin, s.debut + 1), s.fin + 12)}
                  </q>
                </li>
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
