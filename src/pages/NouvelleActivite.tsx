import { useMemo, useState, type FormEvent } from 'react';
import { AIDES, type AideId } from '../lib/aides';
import RepereProgramme from '../components/RepereProgramme';
import { TEMPS_CECP } from '../lib/ancrage';
import { ANNEES_ATELIER } from '../lib/atelier';
import { ERREURS_MAX, localiserErreurs, MOTS_MAX, TYPES_ERREUR, type ChasseBrute, type LigneErreurSaisie, type TypeErreur } from '../lib/chasse';
import { itemsParAnnee } from '../lib/cecp';
import { principesPour } from '../lib/principes';
import type { CategorieErreur, Contraintes } from '../lib/retour';
import { suggererItems } from '../lib/suggestion';
import type { Annee, Phase } from '../types';

export interface ActiviteNouvelle {
  annee: Annee;
  consigne: string;
  contraintes: Contraintes;
  itemIds: string[];
  principeIds: string[];
  categories: CategorieErreur[];
  aidesRetirees: { id: AideId; raison: string }[];
  banqueMots: string[];
  principesPerso: { phase: Phase; question: string }[];
  atelier: boolean;
  // Option pédagogique : noms et pronoms de Grammaire 3D pour les fonctions de l'atelier.
  grammaire3d: boolean;
  chasse: ChasseBrute | null;
}

const CATEGORIES: { id: CategorieErreur; libelle: string }[] = [
  { id: 'majuscule_debut_phrase', libelle: 'Majuscule au début des phrases' },
  { id: 'point_fin_phrase', libelle: 'Point à la fin du texte' },
  { id: 'mot_repete', libelle: 'Mot écrit deux fois de suite' },
];

const PHASES: { id: Phase; titre: string; verbe: string; exemple: string }[] = [
  { id: 'reflechir', titre: 'Réfléchir', verbe: 'réfléchir', exemple: 'Comment s’appelle ton animal ?' },
  { id: 'relire', titre: 'Relire', verbe: 'relire', exemple: 'As-tu décrit son pelage ?' },
  { id: 'corriger', titre: 'Corriger', verbe: 'corriger', exemple: 'As-tu relu les noms propres ?' },
];

const ligneVide = (): LigneErreurSaisie => ({ mot: '', rang: 1, attendu: '', type: 'accord-verbe', indice: '' });

export default function NouvelleActivite({ annee, onEnregistrer }: { annee: Annee; onEnregistrer: (a: ActiviteNouvelle) => void }) {
  const items = useMemo(() => itemsParAnnee(annee), [annee]);
  const [consigne, setConsigne] = useState('');
  const [minMots, setMinMots] = useState('');
  const [maxMots, setMaxMots] = useState('');
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [principeIds, setPrincipeIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategorieErreur[]>([]);
  const [retirees, setRetirees] = useState<Record<string, string>>({});
  const [brouillons, setBrouillons] = useState(false);
  const [motsUtiles, setMotsUtiles] = useState('');
  const [perso, setPerso] = useState<Record<string, string>>({});
  const [atelier, setAtelier] = useState(false);
  const [grammaire3d, setGrammaire3d] = useState(false);
  const [avecChasse, setAvecChasse] = useState(false);
  const [texteChasse, setTexteChasse] = useState('');
  const [lignesChasse, setLignesChasse] = useState<LigneErreurSaisie[]>([ligneVide()]);
  const [erreurChasse, setErreurChasse] = useState('');
  const atelierPossible = ANNEES_ATELIER.includes(annee);

  const suggeres = useMemo(() => suggererItems(consigne, items), [consigne, items]);
  const codes = useMemo(() => (itemIds.length > 0 ? items.filter((i) => itemIds.includes(i.id)) : items).flatMap((i) => i.codes), [items, itemIds]);

  const bascule = <T,>(liste: T[], v: T) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  const retraitIncomplet = Object.values(retirees).some((r) => r.trim() === '');
  const peutEnregistrer = consigne.trim() !== '' && !retraitIncomplet;

  function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!peutEnregistrer) return;
    let chasse: ChasseBrute | null = null;
    if (atelierPossible && avecChasse) {
      const r = localiserErreurs(texteChasse, lignesChasse);
      if (!r.ok) {
        setErreurChasse(r.message);
        return;
      }
      chasse = r.chasse;
    }
    setErreurChasse('');
    const contraintes: Contraintes = {};
    if (minMots !== '') contraintes.minMots = Number(minMots);
    if (maxMots !== '') contraintes.maxMots = Number(maxMots);
    onEnregistrer({
      annee,
      consigne: consigne.trim(),
      contraintes,
      itemIds,
      principeIds,
      categories,
      aidesRetirees: Object.entries(retirees).map(([id, raison]) => ({ id: id as AideId, raison: raison.trim() })),
      banqueMots: motsUtiles.split(',').map((m) => m.trim()).filter((m) => m !== ''),
      principesPerso: PHASES.map((p) => ({ phase: p.id, question: (perso[p.id] ?? '').trim() })).filter((q) => q.question !== ''),
      atelier: atelierPossible && atelier,
      grammaire3d: atelierPossible && grammaire3d,
      chasse,
    });
  }

  return (
    <form onSubmit={soumettre} className="space-y-6">
      <div>
        <label htmlFor="consigne">Consigne pour les élèves</label>
        <textarea id="consigne" className="plai-input" rows={3} value={consigne} onChange={(e) => setConsigne(e.target.value)} placeholder="Écrire trois phrases pour présenter mon animal préféré." aria-describedby="aide-consigne" />
        <p id="aide-consigne" className="text-sm">Écrivez la consigne avec vos mots. Elle est lue telle quelle aux élèves, et l’app s’en sert pour proposer des items du programme.</p>
      </div>

      <div>
        <label htmlFor="min">Nombre minimum de mots</label>
        <input id="min" type="number" min={0} className="plai-input" value={minMots} onChange={(e) => setMinMots(e.target.value)} placeholder="15" aria-describedby="aide-min" />
        <p id="aide-min" className="text-sm">Laisser vide pour ne pas fixer de minimum. L’élève verra la question « Ton texte est-il assez long ? » à la relecture.</p>
      </div>
      <div>
        <label htmlFor="max">Nombre maximum de mots</label>
        <input id="max" type="number" min={0} className="plai-input" value={maxMots} onChange={(e) => setMaxMots(e.target.value)} placeholder="40" aria-describedby="aide-max" />
        <p id="aide-max" className="text-sm">Laisser vide pour ne pas fixer de maximum. Utile pour les élèves qui écrivent beaucoup et se perdent.</p>
      </div>

      <fieldset>
        <legend>Items du programme CECP travaillés ({annee})</legend>
        <p className="text-sm">Ces items alimentent la carte du programme. Vous restez seul juge : l’app propose, vous choisissez.</p>
        {suggeres.length > 0 && (
          <p className="text-sm">
            Suggestions d’après votre consigne : {suggeres.map((s) => s.codes.join(' ')).join(' ; ')}
          </p>
        )}
        <details>
          <summary>Ce que le référentiel attend à l’écrit en {annee}</summary>
          <RepereProgramme annee={annee} items={[]} />
        </details>
        <details>
          <summary>Voir les {items.length} items « écrire »</summary>
          {items.map((i) => (
            <label key={i.id} className="block">
              <input type="checkbox" checked={itemIds.includes(i.id)} onChange={() => setItemIds(bascule(itemIds, i.id))} /> {i.codes.join(', ')} : {i.contenu}
            </label>
          ))}
        </details>
      </fieldset>

      <fieldset>
        <legend>Principes posés à l’élève</legend>
        <p className="text-sm">Questions fixes, une à la fois. Les principes en brouillon n’ont pas encore été validés : vous les utilisez sous votre responsabilité.</p>
        <label className="block">
          <input type="checkbox" checked={brouillons} onChange={() => setBrouillons(!brouillons)} /> Afficher les principes en brouillon
        </label>
        {PHASES.map((p) => (
          <div key={p.id}>
            <h3>
              {p.id === 'corriger' && annee === 'P1' ? 'Corriger (avec Relire en P1)' : `${p.titre} (${TEMPS_CECP[p.id].terme})`}
            </h3>
            {p.id === 'corriger' && annee === 'P1' && (
              <p className="text-sm">En P1, ce temps est fusionné avec Relire : le référentiel ne nomme la correction qu’à partir de P2. Ces questions s’affichent pendant la relecture.</p>
            )}
            {principesPour(codes, p.id, { brouillons }).map((pr) => (
              <label key={pr.id} className="block">
                <input type="checkbox" checked={principeIds.includes(pr.id)} onChange={() => setPrincipeIds(bascule(principeIds, pr.id))} /> {pr.question}{pr.statut === 'brouillon' ? ' (brouillon)' : ''} <small>Programme : {pr.codes.join(', ')}</small>
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Vos propres questions</legend>
        <p className="text-sm">Ajoutez votre voix : vos questions s’affichent avec les questions fixes. Laissez vide pour n’en poser aucune.</p>
        {PHASES.map((p) => (
          <div key={p.id}>
            <label htmlFor={`perso-${p.id}`}>Ma question pour {p.verbe}</label>
            <input
              id={`perso-${p.id}`}
              className="plai-input"
              value={perso[p.id] ?? ''}
              onChange={(e) => setPerso({ ...perso, [p.id]: e.target.value })}
              placeholder={p.exemple}
              maxLength={140}
              aria-describedby={`aide-perso-${p.id}`}
            />
            <p id={`aide-perso-${p.id}`} className="text-sm">Une question courte, à la deuxième personne. Elle apparaît au temps « {p.titre} » pour tous les élèves de cette activité.</p>
          </div>
        ))}
      </fieldset>

      <div>
        <label htmlFor="mots-utiles">Mots utiles pour cette activité</label>
        <input id="mots-utiles" className="plai-input" value={motsUtiles} onChange={(e) => setMotsUtiles(e.target.value)} placeholder="chat, dormir, poil, moustaches" aria-describedby="aide-mots" />
        <p id="aide-mots" className="text-sm">Séparez les mots par des virgules. Les élèves qui ont l’aide « Chercher des mots dans une liste » peuvent les insérer d’un clic.</p>
      </div>

      <fieldset>
        <legend>Signaler à la correction</legend>
        <p className="text-sm">L’app signale seulement ces catégories, sans donner la forme correcte. Choisissez-en peu à la fois.</p>
        {CATEGORIES.map((c) => (
          <label key={c.id} className="block">
            <input type="checkbox" checked={categories.includes(c.id)} onChange={() => setCategories(bascule(categories, c.id))} /> {c.libelle}
          </label>
        ))}
      </fieldset>

      {atelierPossible && (
        <fieldset>
          <legend>Grammaire</legend>
          <label className="block">
            <input type="checkbox" checked={atelier} onChange={() => setAtelier(!atelier)} aria-describedby="aide-atelier" /> Atelier de raisonnement grammatical
          </label>
          <p id="aide-atelier" className="text-sm">
            Au temps « Corriger », l’élève peut choisir une phrase de son texte et suivre une démarche : trouver le verbe, trouver le sujet, regarder la terminaison, justifier. L’application ne dit jamais si ses choix sont bons : vous voyez les étapes faites, sa justification et ses « Je ne suis pas sûr ».
          </p>
        
          <label className="block">
            <input type="checkbox" checked={grammaire3d} onChange={() => setGrammaire3d(!grammaire3d)} aria-describedby="aide-grammaire3d" /> Grammaire 3D
          </label>
          <p id="aide-grammaire3d" className="text-sm">
            Option pédagogique pour les fonctions des groupes : l’élève voit les noms de Grammaire 3D (par exemple « complément de phrase ») et les pronoms utiles pour chaque fonction. Le programme reste la référence : toutes les fonctions du programme restent proposées, et sans cette case l’atelier emploie les noms du programme.
          </p>
          <p className="text-sm">
            Les verbes pronominaux ne figurent pas dans l’atelier : le programme exclut l’accord de leur participe passé (F627, F834).
          </p>
        </fieldset>
      )}

      {atelierPossible && (
        <fieldset>
          <legend>Chasse aux erreurs</legend>
          <label className="block">
            <input type="checkbox" checked={avecChasse} onChange={() => setAvecChasse(!avecChasse)} aria-describedby="aide-chasse" /> Proposer une chasse aux erreurs
          </label>
          <p id="aide-chasse" className="text-sm">
            Vous écrivez un court texte avec des erreurs que vous avez placées. L’élève cherche, corrige et justifie. L’application dit seulement s’il a trouvé ou non, avec un indice : le corrigé n’est jamais affiché à l’élève, et il n’y a pas de note.
          </p>
          {avecChasse && (
            <div>
              <label htmlFor="chasse-texte">Texte à corriger</label>
              <textarea
                id="chasse-texte"
                className="plai-input"
                value={texteChasse}
                onChange={(e) => setTexteChasse(e.target.value)}
                placeholder="Les élèves de 4e année prépare leur sortie à la Citadelle de Namur. Ils emporte un pique-nique."
                aria-describedby="aide-chasse-texte"
              />
              <p id="aide-chasse-texte" className="text-sm">
                Écrivez le texte avec ses erreurs, {MOTS_MAX} mots au plus. L’élève le lit tel quel et cherche ce qui ne va pas.
              </p>
              {lignesChasse.map((l, i) => {
                const maj = (c: Partial<LigneErreurSaisie>) => setLignesChasse(lignesChasse.map((x, k) => (k === i ? { ...x, ...c } : x)));
                return (
                  <fieldset key={i}>
                    <legend>Erreur {i + 1}</legend>
                    <label htmlFor={`chasse-mot-${i}`}>Mot tel qu’il est écrit dans le texte</label>
                    <input id={`chasse-mot-${i}`} className="plai-input" value={l.mot} onChange={(e) => maj({ mot: e.target.value })} placeholder="prépare" aria-describedby={`aide-chasse-mot-${i}`} />
                    <p id={`aide-chasse-mot-${i}`} className="text-sm">Le mot erroné, écrit exactement comme dans le texte. L’application le cherche et vérifie qu’il s’y trouve.</p>
                    <label htmlFor={`chasse-rang-${i}`}>Occurrence du mot dans le texte</label>
                    <input id={`chasse-rang-${i}`} type="number" min={1} className="plai-input" value={l.rang} onChange={(e) => maj({ rang: Number(e.target.value) })} placeholder="1" aria-describedby={`aide-chasse-rang-${i}`} />
                    <p id={`aide-chasse-rang-${i}`} className="text-sm">1 si le mot n’apparaît qu’une fois ; 2 pour la deuxième fois qu’il apparaît, etc.</p>
                    <label htmlFor={`chasse-attendu-${i}`}>Forme attendue</label>
                    <input id={`chasse-attendu-${i}`} className="plai-input" value={l.attendu} onChange={(e) => maj({ attendu: e.target.value })} placeholder="préparent" aria-describedby={`aide-chasse-attendu-${i}`} />
                    <p id={`aide-chasse-attendu-${i}`} className="text-sm">La forme que l’élève doit écrire. Elle reste sur le serveur : l’élève ne la voit jamais. Les accents doivent être exacts.</p>
                    <label htmlFor={`chasse-type-${i}`}>Type d’erreur</label>
                    <select id={`chasse-type-${i}`} value={l.type} onChange={(e) => maj({ type: e.target.value as TypeErreur })}>
                      {TYPES_ERREUR.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.libelle}
                        </option>
                      ))}
                    </select>
                    <label htmlFor={`chasse-indice-${i}`}>Mon indice (facultatif)</label>
                    <input id={`chasse-indice-${i}`} className="plai-input" value={l.indice} maxLength={140} onChange={(e) => maj({ indice: e.target.value })} placeholder="Qui prépare la sortie ?" aria-describedby={`aide-chasse-indice-${i}`} />
                    <p id={`aide-chasse-indice-${i}`} className="text-sm">Une phrase courte, à la deuxième personne, sans donner la réponse. Si vous laissez vide, l’application propose un indice selon le type d’erreur.</p>
                    {lignesChasse.length > 1 && (
                      <button type="button" className="plai-btn" onClick={() => setLignesChasse(lignesChasse.filter((_, k) => k !== i))}>
                        Retirer cette erreur
                      </button>
                    )}
                  </fieldset>
                );
              })}
              {lignesChasse.length < ERREURS_MAX && (
                <button type="button" className="plai-btn" onClick={() => setLignesChasse([...lignesChasse, ligneVide()])}>
                  Ajouter une erreur
                </button>
              )}
              {erreurChasse && <p role="alert">{erreurChasse}</p>}
            </div>
          )}
        </fieldset>
      )}

      <fieldset>
        <legend>Aides à retirer pour cette activité</legend>
        <p className="text-sm">Retirez une aide quand elle fausserait la compétence vérifiée. L’élève verra la raison que vous écrivez.</p>
        {AIDES.map((a) => (
          <div key={a.id}>
            <label className="block">
              <input
                type="checkbox"
                aria-label={`Retirer : ${a.libelle}`}
                checked={a.id in retirees}
                onChange={(e) => {
                  const suite = { ...retirees };
                  if (e.target.checked) suite[a.id] = '';
                  else delete suite[a.id];
                  setRetirees(suite);
                }}
              />{' '}
              {a.libelle}
            </label>
            {a.id in retirees && (
              <input
                aria-label={`Raison du retrait : ${a.libelle}`}
                className="plai-input"
                value={retirees[a.id]}
                onChange={(e) => setRetirees({ ...retirees, [a.id]: e.target.value })}
                placeholder="On vérifie le geste d’écrire à la main."
              />
            )}
          </div>
        ))}
      </fieldset>

      <button type="submit" className="plai-btn" disabled={!peutEnregistrer}>
        Enregistrer l’activité
      </button>
    </form>
  );
}
