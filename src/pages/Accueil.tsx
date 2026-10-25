import { Link } from 'react-router-dom';

export default function Accueil() {
  return (
    <section className="plai-section space-y-4">
      <h1>EcritActif</h1>
      <p>Apprendre à réfléchir, écrire, relire et corriger son texte, à son rythme.</p>
      <div className="flex gap-4 flex-wrap">
        <Link to="/eleve" className="plai-btn">
          Je suis élève
        </Link>
        <Link to="/enseignant" className="plai-btn">
          Je suis enseignant
        </Link>
      </div>
    </section>
  );
}
