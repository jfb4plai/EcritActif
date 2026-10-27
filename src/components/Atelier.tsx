import { useMemo, useState } from 'react';
import { ETAPES_ATELIER, GABARIT_JUSTIFICATION, PRONOMS, type Pronom } from '../lib/atelier';
import { decouperPhrases, morceauxDePhrase } from '../lib/mots';

// Atelier « Je raisonne sur une phrase » (spec 2026-10-27, voie A). L'élève suit une démarche et marque les mots lui-même ;
// l'application pose les questions et garde la trace. Elle ne dit jamais si un choix est bon.
interface Props {
  texte: string;
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

export default function Atelier({ texte, tracer, onModifier, onFermer }: Props) {
  const phrases = useMemo(() => decouperPhrases(texte), [texte]);
  const [numero, setNumero] = useState<number | null>(null);
  const [etape, setEtape] = useState(0);
  const [verbe, setVerbe] = useState<number[]>([]);
  const [sujet, setSujet] = useState<number[]>([]);
  const [pronom, setPronom] = useState<Pronom | ''>('');
  const [fin, setFin] = useState('');
  const [justif, setJustif] = useState<string[] | null>(null);
  const [pasSur, setPasSur] = useState(false);

  const fermer = (
    <button type="button" className="plai-btn tuile" onClick={onFermer}>
      Quitter l’atelier
    </button>
  );

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
                      tracer('atelier:etape:' + ETAPES_ATELIER[0].id);
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

  const phrase = phrases[numero]?.texte ?? '';
  const mots = morceauxDePhrase(phrase).filter((m) => m.motIndex !== null);
  const motsDe = (indices: number[]) =>
    indices
      .slice()
      .sort((a, b) => a - b)
      .map((i) => mots[i]?.texte ?? '')
      .join(' ');
  const bascule = (liste: number[], set: (x: number[]) => void) => (i: number) => set(liste.includes(i) ? liste.filter((x) => x !== i) : [...liste, i]);

  const courante = ETAPES_ATELIER[etape];
  const peutAvancer = courante.id === 'verbe' ? verbe.length > 0 : courante.id === 'sujet' ? sujet.length > 0 && pronom !== '' : true;

  const aller = (n: number) => {
    setEtape(n);
    if (n === 3 && justif === null) setJustif([motsDe(sujet), pronom, motsDe(verbe), fin]);
    tracer('atelier:etape:' + ETAPES_ATELIER[n].id);
  };

  const terminer = (decision: 'garder' | 'modifier') => {
    const [s, p, v, f] = justif ?? [motsDe(sujet), pronom, motsDe(verbe), fin];
    tracer(('atelier:justification:' + [s, p, v, f].join('|')).slice(0, MAX_JUSTIFICATION));
    tracer('atelier:decision:' + decision);
    if (decision === 'modifier') onModifier();
    else onFermer();
  };

  const champs: { id: string; libelle: string }[] = [
    { id: 'j-sujet', libelle: 'Le sujet est' },
    { id: 'j-pronom', libelle: 'Je peux le remplacer par' },
    { id: 'j-verbe', libelle: 'Le verbe' },
    { id: 'j-fin', libelle: 'se termine par' },
  ];

  return (
    <section className="plai-card" aria-label="Atelier de grammaire">
      <h3>Raisonner sur une phrase</h3>
      <ol aria-label="Les étapes" className="etapes-atelier">
        {ETAPES_ATELIER.map((e, i) => (
          <li key={e.id} aria-current={i === etape ? 'step' : undefined}>
            {i + 1}. {e.titre}
          </li>
        ))}
      </ol>
      <h4>{courante.titre}</h4>
      <ul>
        {courante.consignes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      {courante.id === 'verbe' && <MotsCliquables phrase={phrase} choisis={verbe} bloques={sujet} onBascule={bascule(verbe, setVerbe)} />}

      {courante.id === 'sujet' && (
        <>
          <MotsCliquables phrase={phrase} choisis={sujet} bloques={verbe} onBascule={bascule(sujet, setSujet)} />
          <fieldset>
            <legend>Pronom</legend>
            {PRONOMS.map((p) => (
              <label key={p} className="pronom-choix">
                <input type="radio" name="pronom" value={p} checked={pronom === p} onChange={() => setPronom(p)} /> {p}
              </label>
            ))}
          </fieldset>
        </>
      )}

      {courante.id === 'terminaison' && (
        <>
          <p className="phrase-atelier">{phrase}</p>
          <label htmlFor="fin-verbe">Fin du verbe</label>
          <input id="fin-verbe" className="plai-input" maxLength={20} value={fin} onChange={(e) => setFin(e.target.value)} placeholder="ent" aria-describedby="aide-fin" />
          <p id="aide-fin" className="text-sm">Écris seulement les dernières lettres du verbe, comme dans ton texte. Personne ne note cette réponse.</p>
        </>
      )}

      {courante.id === 'justifier' && justif !== null && (
        <>
          <p className="text-sm">{GABARIT_JUSTIFICATION}</p>
          {champs.map((c, i) => (
            <div key={c.id}>
              <label htmlFor={c.id}>{c.libelle}</label>
              <input
                id={c.id}
                className="plai-input"
                maxLength={60}
                value={justif[i]}
                onChange={(e) => setJustif(justif.map((x, k) => (k === i ? e.target.value : x)))}
              />
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
          <button type="button" className="plai-btn tuile" onClick={() => setNumero(null)}>
            Changer de phrase
          </button>
        ) : (
          <button type="button" className="plai-btn tuile" onClick={() => aller(etape - 1)}>
            Étape précédente
          </button>
        )}
        {etape < ETAPES_ATELIER.length - 1 && (
          <button type="button" className="plai-btn tuile" disabled={!peutAvancer} onClick={() => aller(etape + 1)}>
            Étape suivante
          </button>
        )}
        {fermer}
      </div>
    </section>
  );
}
