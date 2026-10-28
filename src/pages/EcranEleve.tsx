import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import type { ActiviteEleve } from '../../api/_lib/eleve';
import AidesPanel from '../components/AidesPanel';
import Atelier from '../components/Atelier';
import Chasse from '../components/Chasse';
import Picto from '../components/Picto';
import RepereProgramme from '../components/RepereProgramme';
import TexteColore from '../components/TexteColore';
import { AIDES, resoudreAides, type AideActive, type AideId } from '../lib/aides';
import { dicteePossible, dicter, lire, synthesePossible } from '../lib/audio';
import { choisirCritere, decider, initial, phaseFinale, phasesDe, retourAutorise, suivant, type Choix, type EtatBoucle } from '../lib/boucle';
import { ANNEES_ATELIER } from '../lib/atelier';
import { lireLocal, sauverLocal } from '../lib/brouillonLocal';
import { itemParId } from '../lib/cecp';
import type { Verdict } from '../lib/chasse';
import { chargerColorisation, type ModeColorisation } from '../lib/colorisation';
import { MODES_COLORISATION, phraseMode } from '../lib/reglagesColorisation';
import { PALETTE, TEXTE_SOMBRE } from '../lib/palette';
import { ATTRIBUTION_ARASAAC } from '../lib/pictos';
import { principeParId } from '../lib/principes';
import { EXPLICATION_QUESTION, explicationDe } from '../lib/explications';
import LimitesApp from '../components/LimitesApp';
import MotsDoutes from '../components/MotsDoutes';
import { chargerDictionnaire, type EstConnu } from '../lib/dictionnaire';
import { detecterSignaux, motsFautifs, recapRendu, verifierContraintes } from '../lib/retour';
import type { AutoEvaluation, Phase } from '../types';

export interface ApiEleve {
  chasse(p: { jeton: string; activiteId: string; motIndex: number; forme: string; justification: string }): Promise<Verdict>;
  sauver(p: { jeton: string; activiteId: string; texte: string; phase: Phase | 'rendu'; version: number; evenements: string[]; autoEvaluation?: AutoEvaluation }): Promise<{ version: number; aides: AideActive[]; aidesRetirees?: { id: AideId; raison: string }[] }>;
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

// Teinte d'une zone : les boutons qu'elle contient prennent la couleur du temps (variables lues par pop.css).
const teinte = (p: Phase) => ({ background: PALETTE[p].pale, borderColor: PALETTE[p].fond, '--tuile-fond': PALETTE[p].fond, '--tuile-texte': PALETTE[p].texte }) as React.CSSProperties;

export default function EcranEleve({ activite, eleveId, jeton, api, delaiSauvegardeMs = 2000, reessaiMs = 5000 }: Props) {
  const cleTexte = `ecrit:${eleveId}:${activite.id}`;
  const locale = useMemo(() => lireLocal(cleTexte), [cleTexte]);
  const versionLocale = useMemo(() => Number(lireLocal(`${cleTexte}:v`)) || 1, [cleTexte]);
  const reprise = activite.reprise;
  const renduAvant = reprise?.phase === 'rendu';

  // Reprise : un texte déjà rendu reste rendu ; sinon la copie de l'appareil, puis celle du serveur.
  const departTexte = renduAvant ? reprise!.texte : (locale ?? reprise?.texte ?? '');
  const departVersion = renduAvant ? reprise!.version : locale !== null ? versionLocale : (reprise?.version ?? 1);
  const departPhase: Phase = renduAvant ? phaseFinale(activite.annee) : locale !== null || reprise ? 'ecrire' : 'reflechir';
  const [etat, setEtat] = useState<EtatBoucle>(() => ({ ...initial(), phase: departPhase, versions: departVersion }));
  const [texte, setTexte] = useState(departTexte);
  const [rendu, setRendu] = useState(renduAvant);
  const [essai, setEssai] = useState(0);
  const [atelierOuvert, setAtelierOuvert] = useState(false);
  const [chasseOuverte, setChasseOuverte] = useState(false);
  const [horsLigne, setHorsLigne] = useState(false);
  const [aidesServeur, setAidesServeur] = useState<AideActive[]>(activite.aides);
  const [retraitsServeur, setRetraitsServeur] = useState(activite.aidesRetirees);
  const [choisies, setChoisies] = useState<AideId[]>([]);
  const [deja, setDeja] = useState<string[]>([]);
  const [ecoute, setEcoute] = useState(false);
  const [modeColor, setModeColor] = useState<ModeColorisation>(activite.colorisation?.defaut ?? 'syllabes');
  const [colorPrete, setColorPrete] = useState(false);
  // Liste de mots du français : chargée seulement si l'activité signale les mots absents ; `listeEchec` si le chargement a échoué.
  const [connu, setConnu] = useState<EstConnu | null>(null);
  const [listeEchec, setListeEchec] = useState(false);
  const [doutes, setDoutes] = useState<string[]>([]);
  const [collageRefuse, setCollageRefuse] = useState(false);
  const [plan, setPlan] = useState(() => {
    try {
      return { debut: '', ensuite: '', fin: '', ...(JSON.parse(lireLocal(`${cleTexte}:plan`) ?? '{}') as object) };
    } catch {
      return { debut: '', ensuite: '', fin: '' };
    }
  });
  const [bump, setBump] = useState(0);
  const [explique, setExplique] = useState<string[]>([]);
  const [precedente, setPrecedente] = useState(() => lireLocal(`${cleTexte}:prec`) ?? '');
  const [etoile1, setEtoile1] = useState('');
  const [etoile2, setEtoile2] = useState('');
  const [souhait, setSouhait] = useState('');
  const [change, setChange] = useState('');
  const autoEnvoyee = useRef<AutoEvaluation | undefined>(undefined);
  const evenements = useRef<string[]>(['ouverture']);

  // Une trace hors frappe (aide, demande d'aide, collage refusé) déclenche aussi un envoi.
  function tracer(ev: string) {
    evenements.current.push(ev);
    setBump((n) => n + 1);
  }
  const arretDictee = useRef<() => void>(() => {});

  const retirees = useMemo(() => {
    const vues = new Map<string, { id: AideId; raison: string }>();
    for (const r of retraitsServeur) vues.set(r.id, r);
    for (const a of aidesServeur) if (!a.active) vues.set(a.id, { id: a.id, raison: a.raison ?? '' });
    return [...vues.values()];
  }, [retraitsServeur, aidesServeur]);
  const ids = useMemo(() => [...new Set([...aidesServeur.map((a) => a.id), ...choisies])], [aidesServeur, choisies]);
  const resolues = useMemo(() => resoudreAides(ids, retirees), [ids, retirees]);
  // Modes de colorisation que l'enseignant autorise pour cet élève (tous, sans réglage).
  const modesColorisation = MODES_COLORISATION.filter((m) => !activite.colorisation || activite.colorisation.permis.includes(m.id));
  const active = (id: AideId) => resolues.some((a) => a.id === id && a.active);

  // Copie locale à chaque changement, envoi au serveur après une pause de frappe.
  useEffect(() => {
    // Rien d'écrit et encore en « réfléchir » : ne pas laisser une copie vide qui ferait sauter ce temps à la réouverture.
    if (etat.phase === 'reflechir' && texte === '') return;
    sauverLocal(cleTexte, texte);
    sauverLocal(`${cleTexte}:v`, String(etat.versions));
  }, [texte, etat.versions, etat.phase, cleTexte]);

  useEffect(() => {
    if (renduAvant) return; // ne jamais écraser un texte déjà rendu
    if (etat.phase === 'reflechir' && texte === '' && !rendu) return;
    const t = setTimeout(async () => {
      const envoyes = evenements.current.splice(0);
      try {
        const r = await api.sauver({ jeton, activiteId: activite.id, texte, phase: rendu ? 'rendu' : etat.phase, version: etat.versions, evenements: envoyes, autoEvaluation: rendu ? autoEnvoyee.current : undefined });
        setHorsLigne(false);
        setAidesServeur(r.aides);
        if (r.aidesRetirees) setRetraitsServeur(r.aidesRetirees);
      } catch {
        evenements.current.unshift(...envoyes);
        setHorsLigne(true);
      }
    }, delaiSauvegardeMs);
    return () => clearTimeout(t);
  }, [texte, etat.phase, etat.versions, rendu, essai, bump, renduAvant, api, jeton, activite.id, delaiSauvegardeMs]);

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
    if (activite.categories.includes('mot_inconnu')) chargerDictionnaire().then((f) => setConnu(() => f), () => setListeEchec(true));
  }, [resolues]); // eslint-disable-line react-hooks/exhaustive-deps

  function aller(phase: 'suivant' | Choix) {
    if (phase === 'suivant') {
      setEtat((e) => suivant(e, activite.annee));
      evenements.current.push('phase:' + suivant(etat, activite.annee).phase);
      return;
    }
    if (phase === 'reecrire') {
      // « Essayer autrement » : la version d'avant reste visible à côté, pour voir ce qui change.
      setPrecedente(texte);
      sauverLocal(`${cleTexte}:prec`, texte);
    }
    if (phase === 'rendre') {
      const etoiles = [etoile1, etoile2].map((x) => x.trim()).filter((x) => x !== '');
      const s = souhait.trim();
      const c = change.trim();
      if (etoiles.length > 0 || s !== '' || c !== '') {
        autoEnvoyee.current = { etoiles, souhait: s, ...(c !== '' ? { change: c } : {}) };
        evenements.current.push('auto-evaluation:faite');
      }
    }
    const r = decider(etat, phase);
    setEtat(r.etat);
    evenements.current.push('choix:' + phase);
    if (r.rendu) setRendu(true);
  }

  function clarifier(id: string) {
    if (explique.includes(id)) return;
    setExplique([...explique, id]);
    tracer('clarification:' + id);
  }

  function basculerGene(gene: string) {
    const lies = AIDES.filter((a) => a.gene === gene).map((a) => a.id);
    // Trace pour le tableau de bord : seules les aides que l'élève active sont enregistrées.
    if (!lies.every((id) => choisies.includes(id))) for (const id of lies) tracer('aide:' + id);
    setChoisies((c) => (lies.every((id) => c.includes(id)) ? c.filter((id) => !lies.includes(id)) : [...new Set([...c, ...lies])]));
  }

  const phases = phasesDe(activite.annee);

  const questionsPerso = (phase: Phase) => activite.principesPerso.filter((q) => q.phase === phase);

  const principes = (phase: Phase) => activite.principeIds.map((id) => principeParId(id)).filter((p) => p && p.phase === phase) as NonNullable<ReturnType<typeof principeParId>>[];

  const questionsRelire = useMemo(() => {
    const contraintes = verifierContraintes(texte, activite.contraintes)
      .filter((v) => !v.atteinte)
      .map((v) => ({ id: 'contrainte:' + v.contrainte, texte: v.message }));
    const perso = questionsPerso('relire').map((q, i) => ({ id: 'perso:relire:' + i, texte: q.question }));
    // En P1, « corriger » est fusionné avec « relire » : ses questions arrivent ici.
    const fusion = activite.annee === 'P1';
    const fixes = [...principes('relire'), ...(fusion ? principes('corriger') : [])].map((p) => ({ id: p.id, texte: p.question }));
    const persoFusion = fusion ? questionsPerso('corriger').map((q, i) => ({ id: 'perso:corriger:' + i, texte: q.question })) : [];
    return [...contraintes, ...fixes, ...perso, ...persoFusion];
  }, [texte, activite]); // eslint-disable-line react-hooks/exhaustive-deps
  const critereId = choisirCritere(questionsRelire.map((q) => q.id), deja);
  const critere = questionsRelire.find((q) => q.id === critereId);

  const signaux = useMemo(() => detecterSignaux(texte, activite.categories, connu ?? undefined), [texte, activite.categories, connu]);
  // Contrainte d'écriture (jeu de lettre) : les mots fautifs sont montrés, jamais remplacés.
  const fautifs = useMemo(() => motsFautifs(texte, activite.contraintes), [texte, activite.contraintes]);
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
        <button type="button" className="plai-btn tuile" onClick={() => lire(activite.consigne)}>
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

  function basculerDoute(mot: string, marque: boolean) {
    const cle = mot.toLowerCase();
    setDoutes((d) => (marque ? [...d, cle] : d.filter((x) => x !== cle)));
    tracer(`${marque ? 'doute' : 'doute-retire'}:${cle}`);
  }

  function ajouterMot(mot: string) {
    setTexte((p) => p + (p && !/\s$/.test(p) ? ' ' : '') + mot);
  }

  // Le collage n'est accepté que pour du texte que l'élève a lui-même écrit.
  function refuserSiEtranger(e: ClipboardEvent | DragEvent, colle: string) {
    if (colle !== '' && !texte.includes(colle)) {
      e.preventDefault();
      setCollageRefuse(true);
      tracer('collage-refuse');
    }
  }

  // Gérer ses émotions face à un retour : l'erreur dédramatisée, et un temps pour respirer, facultatif.
  // RISS : l'erreur est une occasion d'apprendre (hal-04646895) ; réévaluer plutôt que supprimer ses émotions (W4412804449) ;
  // respiration guidée régulière, menée par l'enseignant : moins d'agitation en CP et CM1 (dumas-05337696). Un bouton ponctuel
  // dans une app n'est étayé par aucune source lue : il reste une option, jamais un passage obligé.
  const momentCalme = !rendu && (
    <div className="plai-card">
      <p>Se tromper, c’est normal : on apprend en essayant autrement.</p>
      <details>
        <summary>Prendre un moment avant de lire les retours</summary>
        <ul>
          <li>D’abord : gonfle doucement ton ventre en comptant jusqu’à 4.</li>
          <li>Ensuite : souffle doucement en comptant jusqu’à 4.</li>
          <li>Recommence 3 fois, puis relis.</li>
        </ul>
        <button type="button" className="plai-btn tuile" onClick={() => tracer('respiration:faite')}>
          J’ai respiré
        </button>
      </details>
    </div>
  );

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
      {precedente !== '' && etat.versions > 1 && (
        <details>
          <summary>Ma version d’avant</summary>
          <p className="texte-relu">{precedente}</p>
        </details>
      )}
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
            <button key={m} type="button" className="plai-btn tuile" onClick={() => ajouterMot(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
      {active('dictee-vocale') &&
        (dicteePossible() ? (
          <button type="button" className="plai-btn tuile" onClick={dicterTexte}>
            {ecoute ? 'Arrêter' : 'Parler pour écrire'}
          </button>
        ) : (
          <p className="text-sm">Ton navigateur ne peut pas écrire ce que tu dis.</p>
        ))}
    </div>
  );

  // Atelier de grammaire : option de l'enseignant, pour les années où le programme demande d'accorder (P4 à P6).
  const atelierDispo = activite.atelier && ANNEES_ATELIER.includes(activite.annee);

  // Chasse aux erreurs : texte de l'enseignant, mêmes années que l'atelier. Le corrigé reste côté serveur.
  const chasseDispo = !!activite.chasse && ANNEES_ATELIER.includes(activite.annee);

  // Choix du mode, phrase explicative et texte en couleurs : lecture seule, partagés par « Relire » et « Corriger ».
  const vueColoree = (
    <>
        {active('colorisation') && modesColorisation.length > 1 && (
          <label>
            Colorer{' '}
            <select value={modeColor} onChange={(e) => setModeColor(e.target.value as ModeColorisation)}>
              {modesColorisation.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.libelle}
                </option>
              ))}
            </select>
          </label>
        )}
        {active('colorisation') && <p className="text-sm">{phraseMode(modeColor)}</p>}
        <p className="texte-relu">{active('colorisation') && colorPrete ? <TexteColore texte={texte} mode={modeColor} /> : texte}</p>
    </>
  );

  const blocCorriger = (
    <>
          {signauxActifs.length > 0 ? (
            <ul>
              {signauxActifs.map((s, i) => (
                <li key={i}>
                  {s.indice}{' '}
                  <q>
                    {texte.slice(Math.max(0, s.debut - 12), s.debut)}
                    <mark>{texte.slice(s.debut, Math.max(s.fin, s.debut + 1))}</mark>
                    {texte.slice(Math.max(s.fin, s.debut + 1), s.fin + 12)}
                  </q>{' '}
                  <button type="button" className="plai-btn tuile" onClick={() => clarifier(s.categorie)}>
                    Je ne comprends pas
                  </button>
                  {explique.includes(s.categorie) && (
                    <div>
                      <p>{explicationDe(s.categorie, activite.annee)}</p>
                      <p>Demander de l’aide, c’est apprendre.</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            fautifs.length === 0 && (
              <>
                {activite.categories.includes('mot_inconnu') && !connu && <p>{listeEchec ? 'La liste de mots n’a pas pu être chargée : les mots ne sont pas vérifiés.' : 'La liste de mots se charge…'}</p>}
              </>
            )
          )}
          {fautifs.length > 0 && (
            <ul>
              {fautifs.map((f, i) => (
                <li key={'lettre' + i}>
                  Ce mot ne respecte pas la contrainte de lettre :{' '}
                  <q>
                    {texte.slice(Math.max(0, f.debut - 12), f.debut)}
                    <mark>{texte.slice(f.debut, f.fin)}</mark>
                    {texte.slice(f.fin, f.fin + 12)}
                  </q>
                </li>
              ))}
            </ul>
          )}
          <LimitesApp
            categories={activite.categories}
            contrainte={!!(activite.contraintes?.initiale || activite.contraintes?.lettreInterdite)}
            listeDeMots={connu !== null}
            aucunSignal={signauxActifs.length === 0 && fautifs.length === 0}
          />
          <MotsDoutes texte={texte} doutes={doutes} onBasculer={basculerDoute} />
          {chasseDispo && !rendu && (
            <div>
              {chasseOuverte ? (
                <Chasse
                  cle={`${cleTexte}:chasse`}
                  texte={activite.chasse!.texte}
                  nbErreurs={activite.chasse!.nbErreurs}
                  essayer={(p) => api.chasse({ jeton, activiteId: activite.id, ...p })}
                  onFermer={() => setChasseOuverte(false)}
                />
              ) : (
                <button type="button" className="plai-btn tuile" onClick={() => setChasseOuverte(true)}>
                  Chasse aux erreurs
                </button>
              )}
            </div>
          )}
          {atelierDispo && !rendu && (
            <div>
              {atelierOuvert ? (
                <Atelier
                  texte={texte}
                  annee={activite.annee}
                  grammaire3d={activite.grammaire3d === true}
                  perso={activite.atelierPerso}
                  tracer={tracer}
                  onFermer={() => setAtelierOuvert(false)}
                  onModifier={() => {
                    setAtelierOuvert(false);
                    document.getElementById('mon-texte')?.focus();
                  }}
                />
              ) : (
                <button type="button" className="plai-btn tuile" onClick={() => setAtelierOuvert(true)}>
                  Raisonner sur une phrase
                </button>
              )}
            </div>
          )}
          {!rendu && (
            <fieldset>
              <legend>Deux étoiles et un souhait</legend>
              <p className="text-sm">Avant de rendre : dis ce qui est réussi et ce que tu voudrais améliorer. Tu peux laisser vide.</p>
              <label htmlFor="etoile1">Une chose réussie</label>
              <input id="etoile1" className="plai-input" maxLength={200} value={etoile1} onChange={(e) => setEtoile1(e.target.value)} placeholder="J’ai décrit mon animal." />
              <label htmlFor="etoile2">Une autre chose réussie</label>
              <input id="etoile2" className="plai-input" maxLength={200} value={etoile2} onChange={(e) => setEtoile2(e.target.value)} placeholder="J’ai mis un point à la fin." />
              <label htmlFor="souhait">Un souhait pour la prochaine fois</label>
              <input id="souhait" className="plai-input" maxLength={200} value={souhait} onChange={(e) => setSouhait(e.target.value)} placeholder="Écrire une phrase de plus." />
              {precedente !== '' && etat.versions > 1 && (
                <>
                  <label htmlFor="change">Ce qui est mieux dans ma nouvelle version</label>
                  <input id="change" className="plai-input" maxLength={300} value={change} onChange={(e) => setChange(e.target.value)} placeholder="J’ai ajouté ce que fait mon animal." />
                </>
              )}
            </fieldset>
          )}
          {!rendu ? (
            <div className="flex gap-2 flex-wrap">
              <button type="button" className="plai-btn tuile" onClick={() => aller('continuer')}>
                Continuer à écrire
              </button>
              <button type="button" className="plai-btn tuile" onClick={() => aller('reecrire')}>
                Essayer autrement : une nouvelle version
              </button>
              <button type="button" className="plai-btn tuile" onClick={() => aller('rendre')}>
                Rendre mon texte
              </button>
            </div>
          ) : (
            <>
              <p role="status">{recapRendu(texte, etat.versions)}</p>
              {activite.contraintes.recopier && (
                <div role="group" aria-label="Ta dernière version sur une feuille">
                  <p>Ta dernière version, sur une feuille :</p>
                  <ul>
                    <li>Prendre une feuille et un stylo.</li>
                    <li>Recopier la version finale à la main.</li>
                  </ul>
                </div>
              )}
            </>
          )}
    </>
  );

  return (
    <div className="space-y-4">
      <ol className="tuiles-temps" aria-label={phases.length === 3 ? 'Les trois temps' : 'Les quatre temps'}>
        {phases.map((p, i) => {
          const actif = etat.phase === p;
          return (
            <li
              key={p}
              className="tuile-temps"
              aria-current={actif ? 'step' : undefined}
              style={{ background: actif ? PALETTE[p].fond : PALETTE[p].pale, color: actif ? PALETTE[p].texte : TEXTE_SOMBRE, borderColor: PALETTE[p].fond }}
            >
              {i + 1} {TITRES[p]}
            </li>
          );
        })}
      </ol>
      {horsLigne && <p role="status">Texte enregistré seulement sur cet appareil. Garde cette page ouverte.</p>}

      {etat.phase === 'reflechir' && (
        <section data-phase="reflechir" className="zone-temps" style={teinte('reflechir')}>
          {consigneBloc}
          <details>
            <summary>Dans le programme (pour les adultes)</summary>
            <RepereProgramme annee={activite.annee} items={activite.itemIds.map((id) => itemParId(id)).filter((i): i is NonNullable<typeof i> => i !== undefined)} />
          </details>
          <ul>
            {principes('reflechir').map((p) => (
              <li key={p.id}>{p.question}</li>
            ))}
            {questionsPerso('reflechir').map((q, i) => (
              <li key={'perso' + i}>{q.question}</li>
            ))}
          </ul>
          {peutLire && principes('reflechir').length + questionsPerso('reflechir').length > 0 && (
            <button type="button" className="plai-btn tuile" onClick={() => lire([...principes('reflechir').map((p) => p.question), ...questionsPerso('reflechir').map((q) => q.question)].join(' '))}>
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
          <button type="button" className="plai-btn tuile" onClick={() => aller('suivant')}>
            Commencer à écrire
          </button>
        </section>
      )}

      {etat.phase === 'ecrire' && (
        <section data-phase="ecrire" className="zone-temps" style={teinte('ecrire')}>
          {consigneBloc}
          {zoneTexte}
          <button type="button" className="plai-btn tuile" onClick={() => aller('suivant')}>
            J’ai fini d’écrire
          </button>
        </section>
      )}

      {etat.phase === 'relire' && (
        <section data-phase="relire" className="zone-temps" style={teinte('relire')}>
          {consigneBloc}
          {texte.trim() === '' ? (
            <div>
              <p>Écris d’abord quelques mots.</p>
              <button type="button" className="plai-btn tuile" onClick={() => aller('continuer')}>
                Retourner écrire
              </button>
            </div>
          ) : (
            <div>
              {vueColoree}
              {active('audio-relecture') &&
                (peutLire ? (
                  <button type="button" className="plai-btn tuile" onClick={() => lire(texte)}>
                    Écouter mon texte
                  </button>
                ) : (
                  <p className="text-sm">Ton navigateur ne peut pas lire à voix haute.</p>
                ))}
              {momentCalme}
              {retourAutorise(etat.phase) && critere ? (
                <div className="plai-card">
                  <p>{critere.texte}</p>
                  {peutLire && (
                    <button type="button" className="plai-btn tuile" onClick={() => lire(critere.texte)}>
                      Écouter la question
                    </button>
                  )}
                  <button type="button" className="plai-btn tuile" onClick={() => clarifier(critere.id)}>
                    Je ne comprends pas
                  </button>
                  <button type="button" className="plai-btn tuile" onClick={() => setDeja([...deja, critere.id])}>
                    J’ai regardé
                  </button>
                  {explique.includes(critere.id) && (
                    <div>
                      <p>{EXPLICATION_QUESTION}</p>
                      <p>Demander de l’aide, c’est apprendre.</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>Tu as regardé toutes les questions.</p>
              )}
              {activite.annee === 'P1' ? (
                <>
                  {zoneTexte}
                  {blocCorriger}
                </>
              ) : (
                <button type="button" className="plai-btn tuile" onClick={() => aller('suivant')}>
                  Passer à la correction
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {etat.phase === 'corriger' && (
        <section data-phase="corriger" className="zone-temps" style={teinte('corriger')}>
          {principes('corriger').length + questionsPerso('corriger').length > 0 && (
            <ul>
              {principes('corriger').map((p) => (
                <li key={p.id}>{p.question}</li>
              ))}
              {questionsPerso('corriger').map((q, i) => (
                <li key={'perso' + i}>{q.question}</li>
              ))}
            </ul>
          )}
          {zoneTexte}
          {active('colorisation') && (
            <div role="group" aria-label="Ton texte en couleurs">
              {vueColoree}
            </div>
          )}
          {momentCalme}
          {blocCorriger}
        </section>
      )}

      <AidesPanel choisies={choisies} resolues={resolues} onBasculerGene={basculerGene} />
    </div>
  );
}
