import { AIDES, type AideActive, type AideId } from '../lib/aides';

interface Props {
  choisies: AideId[];
  resolues: AideActive[];
  onBasculerGene: (gene: string) => void;
}

const GENES = [...new Set(AIDES.map((a) => a.gene))];

export default function AidesPanel({ choisies, resolues, onBasculerGene }: Props) {
  const idsDeGene = (g: string) => AIDES.filter((a) => a.gene === g).map((a) => a.id);
  const libelle = (id: AideId) => AIDES.find((a) => a.id === id)?.libelle ?? id;

  return (
    <aside aria-label="Aides" className="plai-card">
      <h2>Ce qui me gêne</h2>
      <p className="text-sm">Coche ce qui te gêne : l’application te propose des aides.</p>
      {GENES.map((g) => (
        <label key={g} className="block">
          <input type="checkbox" checked={idsDeGene(g).every((id) => choisies.includes(id))} onChange={() => onBasculerGene(g)} /> {g}
        </label>
      ))}
      <ul>
        {resolues.map((a) =>
          a.active ? (
            <li key={a.id}>Aide active : {libelle(a.id)}</li>
          ) : (
            <li key={a.id}>
              Aide retirée pour cette activité : {libelle(a.id)}. {a.raison}
            </li>
          ),
        )}
      </ul>
    </aside>
  );
}
