import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { creerClasse, listerClasses, type ClasseLigne } from '../lib/enseignant';
import { getSupabase } from '../lib/supabase';

export default function Enseignant() {
  const { user, seDeconnecter } = useAuth();
  const [classes, setClasses] = useState<ClasseLigne[]>([]);
  const [nom, setNom] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerClasses(getSupabase()).then(setClasses).catch(() => setErreur('Impossible de charger vos classes.'));
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    if (!user || nom.trim() === '') return;
    try {
      const c = await creerClasse(getSupabase(), user.id, nom.trim());
      setClasses([c, ...classes]);
      setNom('');
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
        <button type="submit" className="plai-btn" disabled={nom.trim() === ''}>
          Créer la classe
        </button>
      </form>
      {erreur && <p role="alert">{erreur}</p>}
      <ul>
        {classes.map((c) => (
          <li key={c.id}>
            <Link to={`/enseignant/classe/${c.id}`}>{c.nom}</Link> : code de classe {c.code_classe}
          </li>
        ))}
      </ul>
      <button type="button" className="plai-btn" onClick={() => seDeconnecter()}>
        Se déconnecter
      </button>
    </section>
  );
}
