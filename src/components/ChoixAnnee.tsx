import { ANNEES_PROPOSEES, type Annee } from '../types';

// Choix d'une année du programme (P1 à P6) avec son libellé et son aide : chaque champ explique à l'enseignant ce que
// sa saisie change. Une valeur déjà enregistrée reste visible même si l'année n'est pas (encore) proposée.
interface Props {
  id: string;
  libelle: string;
  aide: string;
  valeur: Annee | '';
  onChange: (annee: Annee) => void;
  // Texte de la première option quand aucune année n'est encore choisie.
  invite?: string;
}

export default function ChoixAnnee({ id, libelle, aide, valeur, onChange, invite }: Props) {
  const options: Annee[] = valeur !== '' && !ANNEES_PROPOSEES.includes(valeur) ? [...ANNEES_PROPOSEES, valeur] : ANNEES_PROPOSEES;
  return (
    <div className="choix-annee">
      <label htmlFor={id}>{libelle}</label>
      <select
        id={id}
        className="plai-input"
        value={valeur}
        onChange={(e) => {
          if (e.target.value !== '') onChange(e.target.value as Annee);
        }}
        aria-describedby={`aide-${id}`}
      >
        {invite && <option value="">{invite}</option>}
        {options.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <p id={`aide-${id}`} className="text-sm">
        {aide}
      </p>
    </div>
  );
}
