import { useMemo, useState } from 'react';
import { demarchesPour, type Demarche, type Depuis, type Element } from '../lib/atelier';
import { consignesPour, type AtelierPerso } from '../lib/atelierPerso';
import { decouperPhrases, morceauxDePhrase } from '../lib/mots';
import type { Annee } from '../types';

// Atelier « Je raisonne sur une phrase » (spec 2026-10-27, voie A). L'élève choisit une phrase et une démarche, marque
// les mots lui-même ; l'application pose les questions et garde la trace. Elle ne dit jamais si un choix est bon.
interface Props {
  texte: string;
  // Année de l'activité : elle détermine les démarches proposées (le programme avant tout).
  annee: Annee;
  // Option pédagogique de l'enseignant : noms et pronoms de Grammaire 3D pour les fonctions.
  grammaire3d?: boolean;
  // « Ma formulation » : consignes de l'enseignant, qui remplacent celles de l'application étape par étape.
  perso?: AtelierPerso;
  tracer: (evenement: string) => void;
  onModifier: () => void;
  onFermer: () => void;
}

const MAX_JUSTIFICATION = 300;

function MotsCliquables({ phrase, choisis, bloques, onBascule }: { phrase: string; choisis: number[]; bloques: number[]; onBascule: (i: number) => void }) {
  return (
    <p className="phrase-atelier">
      {morceauxDePhrase(phrase).map((m, i) =>
        m.motIndex === null ? (
          <span key={i}>{m.texte}</span>
        ) : (
          <button
            key={i}
            type="button"
            className="mot-cliquable"
            aria-pressed={choisis.includes(m.motIndex)}
            disabled={bloques.includes(m.motIndex)}
            onClick={() => onBascule(m.motIndex!)}
          >
            {m.texte}
          </button>
        ),
      )}
    </p>
  );
}

export default function Atelier({ texte, annee, grammaire3d = false, perso, tracer, onModifier, onFermer }: Props) {
  const phrases = useMemo(() => decouperPhrases(texte), [texte]);
  const demarches = useMemo(() => demarchesPour(annee, { grammaire3d }), [annee, grammaire3d]);
  const [numero, setNumero] = useState<number | null>(null);
  const [demarche, setDemarche] = useState<Demarche | null>(null);
  const [etape, setEtape] = useState(0);
  const [mots, setMots] = useState<Record<string, number[]>>({});
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [coches, setCoches] = useState<Record<string, string[]>>({});
  const [textes, setTextes] = useState<Record<string, string>>({});
  const [justif, setJustif] = useState<string[] | null>(null);
  const [pasSur, setPasSur] = useState(false);

  const fermer = (
    <button type="button" className="plai-btn tuile" onClick={onFermer}>
      Quitter l’atelier
    </button>
  );

  function reinitialiser() {
    setMots({});
    setChoix({});
    setCoches({});
    setTextes({});
    setJustif(null);
    setPasSur(false);
    setEtape(0);
  }

  if (numero === null) {
    return (
      <section className="plai-card" aria-label="Atelier de grammaire">
        <h3>Raisonner sur une phrase</h3>
        {phrases.length === 0 ? (
          <p>Écris d’abord quelques mots.</p>
        ) : (
          <>
            <p>Cliquer sur une phrase de mon texte.</p>
            <ul className="liste-phrases">
              {phrases.map((p, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="plai-btn tuile"
                    onClick={() => {
                      setNumero(i);
                      tracer('atelier:phrase:' + (i + 1));
                    }}
                  >
                    Phrase {i + 1} : {p.texte}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {fermer}
      </section>
    );
  }

  if (demarche === null) {
    return (
      <section className="plai-card" aria-label="Atelier de grammaire">
        <h3>Raisonner sur une phrase</h3>
        <p className="phrase-atelier">{phrases[numero]?.texte}</p>
        <p>Choisir ce que je veux vérifier.</p>
        <ul className="liste-phrases">
          {demarches.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="plai-btn tuile"
                onClick={() => {
                  setDemarche(d);
                  reinitialiser();
                  tracer('atelier:demarche:' + d.id);
                  tracer('atelier:etape:' + d.etapes[0].id);
                }}
              >
                {d.titre}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="plai-btn tuile" onClick={() => setNumero(null)}>
            Changer de phrase
          </button>
          {fermer}
        </div>
      </section>
    );
  }

  const phrase = phrases[numero]?.texte ?? '';
  const motsPhrase = morceauxDePhrase(phrase).filter((m) => m.motIndex !== null);
  const motsDe = (cle: string) =>
    (mots[cle] ?? [])
      .slice()
      .sort((a, b) => a - b)
      .map((i) => motsPhrase[i]?.texte ?? '')
      .join(' ');
  const valeurDe = (d: Depuis) => (d.kind === 'mots' ? motsDe(d.cle) || (d.sinon ? motsDe(d.sinon) : '') : d.kind === 'choix' ? (choix[d.cle] ?? '') : d.kind === 'texte' ? (textes[d.cle] ?? '') : '');

  const courante = demarche.etapes[etape];
  const visible = (el: Element) => !el.si || choix[el.si.cle] === el.si.valeur;
  const visibles = courante.elements.filter(visible);
  const selon = (courante.selon ?? []).filter((s) => choix[s.cle] === s.valeur);
  const siennes = consignesPour(demarche, courante, perso);
  // Mise à jour fonctionnelle : deux appuis très rapprochés (écran tactile) ne s'écrasent pas.
  const bascule = (cle: string) => (i: number) =>
    setMots((m) => ({ ...m, [cle]: (m[cle] ?? []).includes(i) ? (m[cle] ?? []).filter((x) => x !== i) : [...(m[cle] ?? []), i] }));
  const bloquesPour = (cle: string) => Object.entries(mots).filter(([k]) => k !== cle).flatMap(([, v]) => v);
  const complet = (el: Element) => (el.kind === 'marquer' ? (mots[el.cle] ?? []).length >= el.min : el.kind === 'choisir' ? (choix[el.cle] ?? '') !== '' : true);
  const peutAvancer = visibles.every(complet);

  // Changer un choix efface ce qui en dépendait (mots marqués et choix d'un autre cas).
  function choisir(cle: string, valeur: string) {
    const dependants = demarche!.etapes.flatMap((e) => e.elements).filter((el) => el.si?.cle === cle);
    const motsRestants = { ...mots };
    const choixRestants = { ...choix, [cle]: valeur };
    for (const el of dependants) {
      if (el.kind === 'marquer') delete motsRestants[el.cle];
      if (el.kind === 'choisir') delete choixRestants[el.cle];
    }
    setMots(motsRestants);
    setChoix(choixRestants);
    setJustif(null);
  }

  const aller = (n: number) => {
    setEtape(n);
    if (demarche.etapes[n].id === 'justifier' && justif === null) setJustif(demarche.champs.map((c) => valeurDe(c.depuis)));
    tracer('atelier:etape:' + demarche.etapes[n].id);
  };

  const terminer = (decision: 'garder' | 'modifier') => {
    const valeurs = justif ?? demarche.champs.map((c) => valeurDe(c.depuis));
    tracer(`atelier:justification:${demarche.id}:${valeurs.join('|')}`.slice(0, MAX_JUSTIFICATION));
    tracer('atelier:decision:' + decision);
    if (decision === 'modifier') onModifier();
    else onFermer();
  };

  return (
    <section className="plai-card" aria-label="Atelier de grammaire">
      <h3>Raisonner sur une phrase</h3>
      <ol aria-label="Les étapes" className="etapes-atelier">
        {demarche.etapes.map((e, i) => (
          <li key={e.id} aria-current={i === etape ? 'step' : undefined}>
            {i + 1}. {e.titre}
          </li>
        ))}
      </ol>
      <h4>{courante.titre}</h4>
      {siennes.perso ? (
        // Les mots de l'enseignant remplacent toutes les consignes de l'étape ; les rappels de règle restent.
        <>
          <ul>
            {siennes.consignes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {selon.map((s) => s.rappel && <p key={s.valeur} className="rappel-atelier">{s.rappel}</p>)}
        </>
      ) : (
        <>
          {courante.consignes.length > 0 && (
            <ul>
              {courante.consignes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {selon.map((s) => (
            <div key={s.valeur}>
              <ul>
                {s.consignes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {s.rappel && <p className="rappel-atelier">{s.rappel}</p>}
            </div>
          ))}
        </>
      )}

      {visibles.map((el, k) => {
        const cle = `${el.cle}-${k}`;
        if (el.kind === 'marquer') {
          return (
            <div key={cle}>
              {el.legende && <p className="text-sm">{el.legende}</p>}
              <MotsCliquables phrase={phrase} choisis={mots[el.cle] ?? []} bloques={bloquesPour(el.cle)} onBascule={bascule(el.cle)} />
            </div>
          );
        }
        if (el.kind === 'choisir') {
          return (
            <fieldset key={cle}>
              <legend>{el.legende}</legend>
              {el.options.map((o) => (
                <label key={o} className="pronom-choix">
                  <input type="radio" name={el.cle} value={o} checked={choix[el.cle] === o} onChange={() => choisir(el.cle, o)} /> {o}
                </label>
              ))}
            </fieldset>
          );
        }
        if (el.kind === 'cocher') {
          return (
            <fieldset key={cle}>
              <legend>{el.legende}</legend>
              {el.options.map((o) => (
                <label key={o} className="block">
                  <input
                    type="checkbox"
                    checked={(coches[el.cle] ?? []).includes(o)}
                    onChange={() => setCoches((c) => ({ ...c, [el.cle]: (c[el.cle] ?? []).includes(o) ? (c[el.cle] ?? []).filter((x) => x !== o) : [...(c[el.cle] ?? []), o] }))}
                  />{' '}
                  {o}
                </label>
              ))}
            </fieldset>
          );
        }
        return (
          <div key={cle}>
            <p className="phrase-atelier">{phrase}</p>
            <label htmlFor={`ecrire-${el.cle}`}>{el.libelle}</label>
            <input
              id={`ecrire-${el.cle}`}
              className="plai-input"
              maxLength={20}
              value={textes[el.cle] ?? ''}
              onChange={(e) => setTextes({ ...textes, [el.cle]: e.target.value })}
              placeholder={el.placeholder}
              aria-describedby={`aide-${el.cle}`}
            />
            <p id={`aide-${el.cle}`} className="text-sm">
              {el.aide}
            </p>
          </div>
        );
      })}

      {courante.id === 'justifier' && justif !== null && (
        <>
          <p className="text-sm">{demarche.gabarit}</p>
          {demarche.champs.map((c, i) => (
            <div key={c.libelle}>
              <label htmlFor={`j-${i}`}>{c.libelle}</label>
              <input id={`j-${i}`} className="plai-input" maxLength={60} value={justif[i]} onChange={(e) => setJustif(justif.map((x, k) => (k === i ? e.target.value : x)))} />
            </div>
          ))}
        </>
      )}

      {courante.id === 'decider' && (
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="plai-btn tuile" onClick={() => terminer('garder')}>
            Garder la phrase
          </button>
          <button type="button" className="plai-btn tuile" onClick={() => terminer('modifier')}>
            Modifier mon texte
          </button>
          <button
            type="button"
            className="plai-btn tuile"
            aria-pressed={pasSur}
            onClick={() => {
              setPasSur(true);
              tracer('atelier:pas-sur');
            }}
          >
            Je ne suis pas sûr
          </button>
          {pasSur && <p role="status">Ton enseignant le verra et pourra t’aider.</p>}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {etape === 0 ? (
          <button type="button" className="plai-btn tuile" onClick={() => setDemarche(null)}>
            Changer de démarche
          </button>
        ) : (
          <button type="button" className="plai-btn tuile" onClick={() => aller(etape - 1)}>
            Étape précédente
          </button>
        )}
        {etape < demarche.etapes.length - 1 && (
          <button type="button" className="plai-btn tuile" disabled={!peutAvancer} onClick={() => aller(etape + 1)}>
            Étape suivante
          </button>
        )}
        {fermer}
      </div>
    </section>
  );
}
