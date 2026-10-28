import { limitesDesSignaux, type CategorieErreur } from '../lib/retour';

// Dit à l'élève ce que l'application regarde et ce qu'elle ne voit pas, pour que « aucun signal » ne se lise pas « texte correct ».
export default function LimitesApp({ categories, contrainte, listeDeMots, aucunSignal }: { categories: CategorieErreur[]; contrainte: boolean; listeDeMots: boolean; aucunSignal: boolean }) {
  const { regarde, nePasVoit } = limitesDesSignaux(categories, contrainte, listeDeMots);
  return (
    <div className="plai-card" data-testid="limites-app">
      {regarde.length === 0 ? (
        <p>Ici, l’application ne vérifie rien dans ton texte.</p>
      ) : (
        <>
          <p>{aucunSignal ? 'Aucun signal sur :' : 'L’application regarde seulement :'}</p>
          <ul>
            {regarde.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      <p>Elle ne voit pas : {nePasVoit.join(', ')}.</p>
      <p>
        <strong>Aucun signal ne veut pas dire que ton texte est sans erreur. Relis-le toi-même.</strong>
      </p>
    </div>
  );
}
