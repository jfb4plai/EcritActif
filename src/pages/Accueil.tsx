import { Link } from 'react-router-dom';
import { PALETTE } from '../lib/palette';

export default function Accueil() {
  return (
    <section className="plai-section space-y-6">
      <h1 className="titre-pop">EcritActif</h1>
      <p style={{ fontSize: '1.25rem' }}>Apprendre à réfléchir, écrire, relire et corriger son texte, à son rythme.</p>
      <p>Conçu pour le programme CECP de l’enseignement primaire en Fédération Wallonie-Bruxelles, avec le référentiel de français du tronc commun (P1 à P3, écrire).</p>
      <div className="flex gap-6 flex-wrap">
        <Link to="/eleve" className="plai-btn tuile tuile-grande" style={{ background: PALETTE.eleve.fond, color: PALETTE.eleve.texte }}>
          Je suis élève
        </Link>
        <Link to="/enseignant" className="plai-btn tuile tuile-grande" style={{ background: PALETTE.enseignant.fond, color: PALETTE.enseignant.texte }}>
          Je suis enseignant
        </Link>
      </div>
    </section>
  );
}
