import { Link } from 'react-router-dom';
import type { ClasseLigne } from '../lib/enseignant';

// Liste des classes de l'enseignant. Chaque classe s'ouvre par un vrai bouton, nommé et décrit : un lien en texte
// ordinaire n'est pas reconnu comme cliquable (remarque de JF, 2026-10-27).
export default function ListeClasses({ classes }: { classes: ClasseLigne[] }) {
  if (classes.length === 0) {
    return <p>Vous n’avez pas encore de classe. Créez-en une avec le formulaire ci-dessus.</p>;
  }
  return (
    <section aria-label="Mes classes créées">
      <h2>Mes classes créées</h2>
      <p>Cliquer sur « Ouvrir la classe » pour ajouter vos élèves et créer vos activités.</p>
      <ul className="liste-classes">
        {classes.map((c) => (
          <li key={c.id} className="plai-card">
            <p>
              <strong>{c.nom}</strong> · {c.niveau ?? 'année à préciser'}
            </p>
            <p>
              Code à donner aux élèves : <strong>{c.code_classe}</strong>
            </p>
            <Link to={`/enseignant/classe/${c.id}`} className="plai-btn">
              Ouvrir la classe<span className="visuellement-cache"> {c.nom}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
