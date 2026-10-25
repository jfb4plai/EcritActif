import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Connexion() {
  const { seConnecter, creerCompte } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function agir(e: FormEvent, action: 'connexion' | 'creation') {
    e.preventDefault();
    setOccupe(true);
    setMessage(null);
    try {
      if (action === 'connexion') {
        await seConnecter(email, mdp);
        navigate('/enseignant');
      } else {
        await creerCompte(email, mdp);
        setMessage('Un courriel vous a été envoyé. Ouvrir le lien pour confirmer, puis se connecter.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section className="plai-section">
      <h1>Espace enseignant</h1>
      <form onSubmit={(e) => agir(e, 'connexion')} className="space-y-4">
        <div>
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" className="plai-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@ecole.be" aria-describedby="aide-email" required />
          <p id="aide-email" className="text-sm">Cette adresse sert à vous connecter et à confirmer votre compte. Elle n’est jamais visible des élèves.</p>
        </div>
        <div>
          <label htmlFor="mdp">Mot de passe</label>
          <input id="mdp" type="password" className="plai-input" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="8 caractères ou plus" minLength={8} aria-describedby="aide-mdp" required />
          <p id="aide-mdp" className="text-sm">Choisir au moins 8 caractères. Il protège les textes de vos élèves.</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="plai-btn" disabled={occupe}>Se connecter</button>
          <button type="button" className="plai-btn" disabled={occupe} onClick={(e) => agir(e, 'creation')}>Créer mon compte</button>
        </div>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}
