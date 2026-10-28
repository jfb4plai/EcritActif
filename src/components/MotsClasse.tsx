import { useState } from 'react';

// Liste de mots locaux acceptés dans toutes les activités de la classe (par exemple des noms de quartiers).
export default function MotsClasse({ initial, onEnregistrer }: { initial: string[]; onEnregistrer: (saisie: string) => Promise<string[]> }) {
  const [saisie, setSaisie] = useState(initial.join(', '));
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  return (
    <section aria-label="Mots acceptés de la classe">
      <label htmlFor="mots-classe">Mots locaux acceptés dans toutes les activités de cette classe</label>
      <input id="mots-classe" className="plai-input" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Cointe, Outremeuse" aria-describedby="aide-mots-classe" />
      <p id="aide-mots-classe" className="text-sm">
        Mots que la liste de mots du français ne connaît pas (noms de lieux, mots de chez vous), séparés par des virgules. Ils ne sont plus signalés comme absents de la liste, dans toutes les activités de la classe où ce signal est coché, y compris les activités déjà créées.
        Attention : l’application accepte ces mots tels que vous les écrivez ici. Une faute de votre part sera acceptée chez l’élève. Les élèves voient la liste de ces mots.
      </p>
      <button
        type="button"
        className="plai-btn"
        onClick={async () => {
          setMessage('');
          try {
            const mots = await onEnregistrer(saisie);
            setErreur('');
            setSaisie(mots.join(', '));
            setMessage(mots.length === 0 ? 'Liste enregistrée : aucun mot ajouté.' : `Liste enregistrée : ${mots.length} mot${mots.length > 1 ? 's' : ''}.`);
          } catch (e) {
            setMessage('');
            setErreur(e instanceof Error && e.message.startsWith('Mots non reconnus') ? `${e.message}. Écrivez des mots seuls, séparés par des virgules (50 au plus).` : 'La liste n’a pas pu être enregistrée.');
          }
        }}
      >
        Enregistrer les mots de la classe
      </button>
      {message && <p role="status">{message}</p>}
      {erreur && <p role="alert" className="plai-error">{erreur}</p>}
    </section>
  );
}
