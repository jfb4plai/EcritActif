// Limiteur en mémoire : une instance serverless a sa propre mémoire, la limite est donc par instance (freinage, pas verrou).
export function creerLimiteur(max: number, fenetreMs: number, maintenant: () => number = Date.now) {
  const appels = new Map<string, number[]>();
  return (cle: string): boolean => {
    const t = maintenant();
    const recents = (appels.get(cle) ?? []).filter((x) => t - x < fenetreMs);
    if (recents.length >= max) {
      appels.set(cle, recents);
      return false;
    }
    recents.push(t);
    appels.set(cle, recents);
    return true;
  };
}
