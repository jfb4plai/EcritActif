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
      <h2>Apprendre à utiliser les retours</h2>
      <p>
        Un retour ne sert que si l’élève sait s’en servir. L’application travaille quatre compétences, selon le modèle de Carless et Boud (2018) tel que résumé par
        Hausman et al. (2025, Université de Liège) :
      </p>
      <ul>
        <li>Comprendre la rétroaction : l’élève peut dire « Je ne comprends pas » et reçoit une explication.</li>
        <li>Porter un jugement sur son travail : « Deux étoiles et un souhait » avant de rendre.</li>
        <li>Gérer ses émotions face à un retour : pas encore travaillée dans l’application.</li>
        <li>Agir après un retour : « Essayer autrement » garde la version d’avant à côté de la nouvelle.</li>
      </ul>
      <h2>Programme</h2>
      <p>
        Les compétences viennent des programmes CECP de l’enseignement primaire (Wallonie-Bruxelles Enseignement). Le
        texte officiel est cité tel quel, sans reformulation.
      </p>
    </section>
  );
}
