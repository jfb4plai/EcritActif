import { useMemo, useState, type FormEvent } from 'react';
import { AIDES, type AideId } from '../lib/aides';
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
}

const CATEGORIES: { id: CategorieErreur; libelle: string }[] = [
  { id: 'majuscule_debut_phrase', libelle: 'Majuscule au début des phrases' },
  { id: 'point_fin_phrase', libelle: 'Point à la fin du texte' },
  { id: 'mot_repete', libelle: 'Mot écrit deux fois de suite' },
];

const PHASES: { id: Phase; titre: string }[] = [
  { id: 'reflechir', titre: 'Réfléchir' },
  { id: 'relire', titre: 'Relire' },
  { id: 'corriger', titre: 'Corriger' },
];

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

  const suggeres = useMemo(() => suggererItems(consigne, items), [consigne, items]);
  const codes = useMemo(() => (itemIds.length > 0 ? items.filter((i) => itemIds.includes(i.id)) : items).flatMap((i) => i.codes), [items, itemIds]);

  const bascule = <T,>(liste: T[], v: T) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  const retraitIncomplet = Object.values(retirees).some((r) => r.trim() === '');
  const peutEnregistrer = consigne.trim() !== '' && !retraitIncomplet;

  function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!peutEnregistrer) return;
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
        <p className="text-sm">Questions fixes, une à la fois. Seuls les principes validés sont proposés aux élèves.</p>
        <label className="block">
          <input type="checkbox" checked={brouillons} onChange={() => setBrouillons(!brouillons)} /> Afficher les principes en brouillon
        </label>
        {PHASES.map((p) => (
          <div key={p.id}>
            <h3>{p.titre}</h3>
            {principesPour(codes, p.id, { brouillons }).map((pr) => (
              <label key={pr.id} className="block">
                <input type="checkbox" checked={principeIds.includes(pr.id)} onChange={() => setPrincipeIds(bascule(principeIds, pr.id))} /> {pr.question}
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>Signaler à la correction</legend>
        <p className="text-sm">L’app signale seulement ces catégories, sans donner la forme correcte. Choisissez-en peu à la fois.</p>
        {CATEGORIES.map((c) => (
          <label key={c.id} className="block">
            <input type="checkbox" checked={categories.includes(c.id)} onChange={() => setCategories(bascule(categories, c.id))} /> {c.libelle}
          </label>
        ))}
      </fieldset>

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
