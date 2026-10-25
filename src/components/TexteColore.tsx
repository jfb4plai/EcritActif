import { colorise, type ModeColorisation } from '../lib/colorisation';

// Rend le texte tel quel, avec des <span> colorés sur les segments du mode choisi.
// Le moteur doit être chargé (chargerColorisation) avant le premier rendu.
export default function TexteColore({ texte, mode }: { texte: string; mode: ModeColorisation }) {
  const segments = colorise(texte, mode);
  const morceaux: React.ReactNode[] = [];
  let curseur = 0;
  segments.forEach((s, i) => {
    if (s.debut > curseur) morceaux.push(texte.slice(curseur, s.debut));
    morceaux.push(
      <span key={i} style={{ color: s.couleur }}>
        {texte.slice(s.debut, s.fin)}
      </span>,
    );
    curseur = s.fin;
  });
  if (curseur < texte.length) morceaux.push(texte.slice(curseur));
  return <span style={{ whiteSpace: 'pre-wrap' }}>{morceaux}</span>;
}
