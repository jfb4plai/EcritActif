import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AidesRetireesEditeur from '../components/AidesRetireesEditeur';
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
  const [annee, setAnnee] = useState<Annee>('P1');
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

  const basculeAide = async (e: EleveLigne, aide: AideId) => {
    const suite = e.aides.includes(aide) ? e.aides.filter((a) => a !== aide) : [...e.aides, aide];
    await reglerAides(getSupabase(), e.id, suite);
    setEleves(eleves.map((x) => (x.id === e.id ? { ...x, aides: suite } : x)));
  };

  return (
    <section className="plai-section space-y-6">
      <p>
        <Link to="/enseignant">Mes classes</Link>
      </p>
      <h1>{classe.nom}</h1>
      <p>Code de la classe à donner aux élèves : <strong>{classe.code_classe}</strong></p>
      {erreur && <p role="alert">{erreur}</p>}

      <div>
        <label htmlFor="annee">Année du programme CECP</label>
        <select id="annee" value={annee} onChange={(e) => setAnnee(e.target.value as Annee)} aria-describedby="aide-annee">
          {(['P1', 'P2', 'P3'] as Annee[]).map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <p id="aide-annee" className="text-sm">Détermine les items proposés pour vos activités et la carte du programme ci-dessous.</p>
      </div>

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
              {a.consigne}
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
        {creation ? (
          <NouvelleActivite
            annee={annee}
            onEnregistrer={async (a) => {
              if (!user) return;
              await enregistrerActivite(getSupabase(), user.id, id, a);
              setCreation(false);
              recharger();
            }}
          />
        ) : (
          <button type="button" className="plai-btn" onClick={() => setCreation(true)}>
            Nouvelle activité
          </button>
        )}
      </section>

      {tableau && (
        <Tableau
          annee={annee}
          items={itemsParAnnee(annee)}
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
