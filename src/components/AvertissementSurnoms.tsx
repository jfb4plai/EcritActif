// Avertissement affiché avant les champs de surnom (décision de JF, 2026-10-27). Texte d'information, pas un avis juridique :
// l'application ne connaît pas les noms ; la liste « code, enfant » est une donnée personnelle dont l'enseignant est responsable.
export default function AvertissementSurnoms() {
  return (
    <section className="plai-card" aria-label="À propos des surnoms">
      <h3>Surnoms (facultatif)</h3>
      <p>Un surnom permet de reconnaître un élève dans le tableau : « KMNPQR (Léa) ». Vous pouvez aussi vous en passer.</p>
      <ul>
        <li>Le surnom reste dans ce navigateur, sur cet appareil. L’application ne l’envoie pas et ne le conserve pas : elle ne connaît pas le nom de vos élèves.</li>
        <li>Si vous changez de navigateur ou d’appareil, ou si vous videz les données du navigateur, les surnoms disparaissent.</li>
        <li>Notez donc aussi sur papier qui a quel code, et gardez cette feuille en lieu sûr.</li>
        <li>
          Une liste qui relie un code à un enfant est une donnée personnelle (RGPD) : vous restez responsable de sa protection. Écrivez un prénom ou des initiales, pas un nom
          complet, et rien sur la santé ou les difficultés de l’enfant.
        </li>
      </ul>
    </section>
  );
}
