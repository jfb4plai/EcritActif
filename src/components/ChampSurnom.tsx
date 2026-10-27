import { useState } from 'react';
import { ecrireSurnom, SURNOM_MAX } from '../lib/surnoms';

// Surnom facultatif d'un élève, mémorisé dans le navigateur de l'enseignant seulement.
interface Props {
  classeId: string;
  code: string;
  valeur: string;
  onChange: (code: string, surnom: string) => void;
}

export default function ChampSurnom({ classeId, code, valeur, onChange }: Props) {
  const [texte, setTexte] = useState(valeur);
  const [echec, setEchec] = useState(false);
  const id = `surnom-${code}`;
  return (
    <div>
      <label htmlFor={id}>Surnom de {code} (facultatif)</label>
      <input
        id={id}
        className="plai-input"
        maxLength={SURNOM_MAX}
        value={texte}
        placeholder="Léa"
        aria-describedby={`aide-${id}`}
        onChange={(e) => {
          setTexte(e.target.value);
          setEchec(!ecrireSurnom(classeId, code, e.target.value));
          onChange(code, e.target.value);
        }}
      />
      <p id={`aide-${id}`} className="text-sm">
        Un prénom ou des initiales. Ce surnom est mémorisé seulement dans ce navigateur : il s’affichera dans le tableau, à côté du code.
      </p>
      {echec && <p role="alert">Le navigateur n’a pas pu mémoriser ce surnom (navigation privée ou données bloquées). Notez-le sur papier.</p>}
    </div>
  );
}
