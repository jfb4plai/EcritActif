import { useState, type FormEvent } from 'react';
import type { ActiviteEleve } from '../../api/_lib/eleve';
import { apiEleve, ouvrirSession } from '../lib/apiEleve';
import EcranEleve from './EcranEleve';

export default function PageEleve() {
  const [codeClasse, setCodeClasse] = useState('');
  const [codeEleve, setCodeEleve] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [session, setSession] = useState<{ jeton: string; eleveId: string; activites: ActiviteEleve[] } | null>(null);
  const [choix, setChoix] = useState<ActiviteEleve | null>(null);

  async function entrer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    try {
      setSession(await ouvrirSession(codeClasse, codeEleve));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  }

  if (session && choix) return <EcranEleve activite={choix} eleveId={session.eleveId} jeton={session.jeton} api={apiEleve} />;

  if (session) {
    return (
      <section className="plai-section space-y-3">
        <h1>Mes activités</h1>
        {session.activites.length === 0 && <p>Il n’y a pas encore d’activité. Demande à ton enseignant.</p>}
        {session.activites.map((a) => (
          <button key={a.id} type="button" className="plai-btn block" onClick={() => setChoix(a)}>
            {a.consigne}
          </button>
        ))}
      </section>
    );
  }

  return (
    <section className="plai-section">
      <h1>Entrer</h1>
      <form onSubmit={entrer} className="space-y-4">
        <div>
          <label htmlFor="code-classe">Code de la classe</label>
          <input id="code-classe" className="plai-input" value={codeClasse} onChange={(e) => setCodeClasse(e.target.value)} placeholder="ABC234" autoCapitalize="characters" autoComplete="off" aria-describedby="aide-classe" required />
          <p id="aide-classe" className="text-sm">Ton enseignant te donne ce code. Il a 6 lettres ou chiffres.</p>
        </div>
        <div>
          <label htmlFor="code-eleve">Mon code</label>
          <input id="code-eleve" className="plai-input" value={codeEleve} onChange={(e) => setCodeEleve(e.target.value)} placeholder="KMN567" autoCapitalize="characters" autoComplete="off" aria-describedby="aide-eleve" required />
          <p id="aide-eleve" className="text-sm">C’est ton code à toi. Il ne contient pas ton nom.</p>
        </div>
        <button type="submit" className="plai-btn">
          Entrer
        </button>
        {erreur && <p role="alert">{erreur}</p>}
      </form>
    </section>
  );
}
