import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AidesRetireesEditeur from '../components/AidesRetireesEditeur';
import ChoixAnnee from '../components/ChoixAnnee';
import { AIDES, type AideId } from '../lib/aides';
import { itemsParAnnee } from '../lib/cecp';
import {
  ajouterEleves,
  chargerTableau,
  enregistrerActivite,
  listerActivites,
  listerClasses,
  listerEleves,
  modifierAidesRetirees,
  modifierNiveauClasse,
  reglerAides,
  validerItem,
  type ActiviteLigne,
  type ClasseLigne,
  type EleveLigne,
} from '../lib/enseignant';
import { getSupabase } from '../lib/supabase';
import type { Annee } from '../types';
import NouvelleActivite from './NouvelleActivite';
import Tableau, { type LigneEleve } from './Tableau';

export default function Classe() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [classe, setClasse] = useState<ClasseLigne | null>(null);
  const [eleves, setEleves] = useState<EleveLigne[]>([]);
  const [activites, setActivites] = useState<ActiviteLigne[]>([]);
  // Année affichée dans la carte du programme ; par défaut, l'année scolaire de la classe. Distincte de l'année d'une activité.
  const [anneeCarte, setAnneeCarte] = useState<Annee | null>(null);
  const [creation, setCreation] = useState(false);
  const [tableau, setTableau] = useState<{ eleves: LigneEleve[]; activites: { id: string; itemIds: string[] }[]; validations: { eleveId: string; itemId: string }[] } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    const db = getSupabase();
    try {
      setClasse((await listerClasses(db)).find((c) => c.id === id) ?? null);
      setEleves(await listerEleves(db, id));
      setActivites(await listerActivites(db, id));
      setTableau(await chargerTableau(db, id));
    } catch {
      setErreur('Impossible de charger la classe.');
    }
  }, [id]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  if (!classe) return <p>{erreur ?? 'Chargement…'}</p>;

  const carte: Annee = anneeCarte ?? classe.niveau ?? 'P1';

  const basculeAide = async (e: EleveLigne, aide: AideId) => {
    const suite = e.aides.includes(aide) ? e.aides.filter((a) => a !== aide) : [...e.aides, aide];
    await reglerAides(getSupabase(), e.id, suite);
    setEleves(eleves.map((x) => (x.id === e.id ? { ...x, aides: suite } : x)));
  };

  return (
    <section className="plai-section space-y-6">
      <p>
        <Link to="/enseignant" className="plai-btn-ghost lien-bouton">← Retour à mes classes</Link>
      </p>
      <h1>{classe.nom}</h1>
      <p>Code de la classe à donner aux élèves : <strong>{classe.code_classe}</strong></p>
      <section aria-label="Pour commencer" className="plai-card">
        <h2>Pour commencer</h2>
        <ol className="liste-numerotee">
          <li>Ajouter vos élèves : cliquer sur « Ajouter 5 élèves » dans la partie Élèves.</li>
          <li>Créer une activité : cliquer sur « Nouvelle activité » dans la partie Activités.</li>
          <li>Donner à chaque élève le code de la classe et son code personnel, à saisir sur la page des élèves.</li>
          <li>Lire les traces dans le tableau en bas de cette page.</li>
        </ol>
      </section>
      {erreur && <p role="alert">{erreur}</p>}

      {classe.niveau === null ? (
        <section aria-label="Année de la classe">
          <p role="status">Cette classe n’a pas encore d’année scolaire. Choisissez-la avant de créer une activité.</p>
          <ChoixAnnee
            id="niveau-classe"
            libelle="Année scolaire de la classe"
            aide="L'année de vos élèves. Elle sert de valeur de départ à vos nouvelles activités ; vous pourrez la changer pour une activité."
            valeur=""
            invite="Choisir l’année"
            onChange={async (a) => {
              try {
                await modifierNiveauClasse(getSupabase(), id, a);
                recharger();
              } catch {
                setErreur('L’année de la classe n’a pas pu être enregistrée.');
              }
            }}
          />
        </section>
      ) : (
        <section aria-label="Année de la classe">
          <ChoixAnnee
            id="niveau-classe"
            libelle="Année scolaire de la classe"
            aide="Valeur de départ de vos nouvelles activités. La changer (à la rentrée, par exemple) ne modifie pas les activités déjà créées : chacune garde son année."
            valeur={classe.niveau}
            onChange={async (a) => {
              try {
                await modifierNiveauClasse(getSupabase(), id, a);
                recharger();
              } catch {
                setErreur('L’année de la classe n’a pas pu être enregistrée.');
              }
            }}
          />
          <ChoixAnnee
            id="annee-carte"
            libelle="Carte du programme : année affichée"
            aide="Choisissez l'année du programme dont vous voulez suivre les items dans le tableau ci-dessous. Cela ne change pas vos activités."
            valeur={carte}
            onChange={setAnneeCarte}
          />
        </section>
      )}

      <section aria-label="Élèves">
        <h2>Élèves</h2>
        <p className="text-sm">Chaque élève reçoit un code personnel sans son nom. Notez qui a quel code sur une feuille que vous gardez.</p>
        <button type="button" className="plai-btn" onClick={async () => { await ajouterEleves(getSupabase(), id, 5); recharger(); }}>
          Ajouter 5 élèves
        </button>
        <ul>
          {eleves.map((e) => (
            <li key={e.id}>
              <strong>{e.code_eleve}</strong>
              <details>
                <summary>Aides activées pour cet élève</summary>
                {AIDES.map((a) => (
                  <label key={a.id} className="block">
                    <input type="checkbox" checked={e.aides.includes(a.id)} onChange={() => basculeAide(e, a.id)} /> {a.libelle}
                  </label>
                ))}
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Activités">
        <h2>Activités</h2>
        <ul>
          {activites.map((a) => (
            <li key={a.id}>
              <strong>{a.annee}</strong> · {a.consigne}
              <details>
                <summary>Aides retirées pour cette activité ({a.aidesRetirees.length})</summary>
                <p className="text-sm">Un retrait s’applique aussi aux élèves qui écrivent en ce moment : ils voient votre raison à leur prochaine sauvegarde.</p>
                <AidesRetireesEditeur
                  initial={a.aidesRetirees}
                  onEnregistrer={async (r) => {
                    try {
                      await modifierAidesRetirees(getSupabase(), a.id, r);
                      recharger();
                    } catch {
                      setErreur('Les aides retirées n’ont pas pu être enregistrées.');
                    }
                  }}
                />
              </details>
            </li>
          ))}
        </ul>
        {creation && classe.niveau !== null ? (
          <NouvelleActivite
            annee={classe.niveau!}
            niveauClasse={classe.niveau!}
            onEnregistrer={async (a) => {
              if (!user) return;
              await enregistrerActivite(getSupabase(), user.id, id, a);
              setCreation(false);
              recharger();
            }}
          />
        ) : (
          <button type="button" className="plai-btn" disabled={classe.niveau === null} onClick={() => setCreation(true)}>
            Nouvelle activité
          </button>
        )}
      </section>

      {tableau && (
        <Tableau
          annee={carte}
          items={itemsParAnnee(carte)}
          eleves={tableau.eleves}
          activites={tableau.activites}
          validations={tableau.validations}
          onValider={async (eleveId, itemId) => {
            if (!user) return;
            await validerItem(getSupabase(), user.id, eleveId, itemId);
            recharger();
          }}
        />
      )}
    </section>
  );
}
