import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ListeClasses from '../components/ListeClasses';
import ChoixAnnee from '../components/ChoixAnnee';
import { useAuth } from '../auth/AuthContext';
import { creerClasse, listerClasses, type ClasseLigne } from '../lib/enseignant';
import { getSupabase } from '../lib/supabase';
import type { Annee } from '../types';

export default function Enseignant() {
  const { user, seDeconnecter } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClasseLigne[]>([]);
  const [nom, setNom] = useState('');
  const [niveau, setNiveau] = useState<Annee | ''>('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerClasses(getSupabase()).then(setClasses).catch(() => setErreur('Impossible de charger vos classes.'));
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (!user || nom.trim() === '' || niveau === '') return;
    try {
      const c = await creerClasse(getSupabase(), user.id, nom.trim(), niveau);
      setClasses([c, ...classes]);
      // On entre directement dans la classe créée : la suite (élèves, activités) s'y trouve.
      navigate(`/enseignant/classe/${c.id}`);
      setNom('');
      setNiveau('');
    } catch {
      setErreur('La classe n’a pas pu être créée.');
    }
  }

  return (
    <section className="plai-section space-y-4">
      <h1>Mes classes</h1>
      <form onSubmit={creer} className="space-y-2">
        <label htmlFor="nom-classe">Nom de la classe</label>
        <input id="nom-classe" className="plai-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="2e primaire, école Sainte-Walburge" aria-describedby="aide-nom" />
        <p id="aide-nom" className="text-sm">Ce nom ne sert qu’à vous. Les élèves voient seulement le code de la classe.</p>
        <ChoixAnnee
          id="niveau-classe"
          libelle="Année scolaire de la classe"
          aide="Obligatoire. L'année de vos élèves. Elle sert de valeur de départ à vos nouvelles activités ; vous pourrez la changer pour une activité si votre classe travaille le programme d'une autre année."
          valeur={niveau}
          onChange={setNiveau}
          invite="Choisir l’année"
        />
        <button type="submit" className="plai-btn" disabled={nom.trim() === '' || niveau === ''}>
          Créer la classe
        </button>
      </form>
      {erreur && <p role="alert">{erreur}</p>}
      <ListeClasses classes={classes} />
      <button type="button" className="plai-btn" onClick={() => seDeconnecter()}>
        Se déconnecter
      </button>
    </section>
  );
}
