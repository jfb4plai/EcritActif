import { ANNEES_PROPOSEES } from '../types';
import { PROGRAMME, REFERENTIEL, REFERENTIEL_ANNEE, SOURCES_CECP } from '../lib/ancrage';
import { itemsParAnnee } from '../lib/cecp';
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
      <h2>Liste de mots du français</h2>
      <p>
        Le signal « mot absent de la liste » s’appuie sur les dictionnaires orthographiques français de Grammalecte (https://grammalecte.net/, version 7.5), licence MPL 2.0, utilisés
        avec le moteur nspell. Les fichiers sont dans le dossier public/dictionnaire, avec leur licence. La liste signale les mots qu’elle ne connaît pas ; elle ne vérifie ni les accords ni
        le choix entre deux mots qui existent.
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
        <li>Gérer ses émotions face à un retour : un mot sur l’erreur et un temps pour respirer, facultatif (essai avec des élèves à faire).</li>
        <li>Agir après un retour : « Essayer autrement » garde la version d’avant à côté de la nouvelle.</li>
      </ul>
      <h2>Ancrage dans le programme de la Fédération Wallonie-Bruxelles</h2>
      <p>
        L’application s’appuie sur deux textes officiels, combinés. Pour ce que l’élève doit pouvoir faire à l’écrit :{' '}
        {REFERENTIEL}. Pour les items découpés par année, avec leurs codes : {PROGRAMME}. Le texte officiel est cité tel quel, sans reformulation.
      </p>
      <ul>
        {ANNEES_PROPOSEES.map((a) => (
          <li key={a}>
            {a} : {itemsParAnnee(a).length} items « écrire » du programme, fichier {SOURCES_CECP[a].pdf} ; référentiel, p. {REFERENTIEL_ANNEE[a].pages}.
          </li>
        ))}
      </ul>
      <p>
        En P1, le référentiel nomme trois composantes de la production d’écrit (planification, mise en texte, révision) ; la correction s’ajoute en P2. Le
        programme les nomme aussi (F282, P3). Les quatre temps de l’application les reprennent : Réfléchir, Écrire, Relire, Corriger.
      </p>
      <p>Les messages adressés à l’élève n’emploient que le vocabulaire que le programme fait nommer à son année.</p>
    </section>
  );
}
