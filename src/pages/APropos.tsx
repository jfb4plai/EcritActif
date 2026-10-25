import { ATTRIBUTION_ARASAAC } from '../lib/pictos';

export default function APropos() {
  return (
    <section className="plai-section">
      <h1>À propos</h1>
      <h2>Colorisation du texte</h2>
      <p>
        Le moteur de colorisation est un port JavaScript de Jean-François Beguin du projet Colorization de Pierre-Alain
        Etique (https://github.com/paColor/Colorization), distribué sous licence GPL-3.0. Ce projet est lui-même
        profondément inspiré par LireCouleur (https://lirecouleur.arkaline.fr/). Le code du moteur est dans le dossier
        src/vendor/colorisation de cette application ; les fichiers de ce dossier gardent leurs en-têtes de licence.
      </p>
      <h2>Pictogrammes</h2>
      <p>{ATTRIBUTION_ARASAAC}</p>
      <h2>Programme</h2>
      <p>
        Les compétences viennent des programmes CECP de l’enseignement primaire (Wallonie-Bruxelles Enseignement). Le
        texte officiel est cité tel quel, sans reformulation.
      </p>
    </section>
  );
}
