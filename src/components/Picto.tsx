import { useEffect, useState } from 'react';
import { urlPicto } from '../lib/pictos';

export default function Picto({ mot }: { mot: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    urlPicto(mot).then((u) => {
      if (actif) setUrl(u);
    });
    return () => {
      actif = false;
    };
  }, [mot]);

  if (!url) return null;
  return <img src={url} alt={mot} style={{ height: '64px', width: 'auto' }} />;
}
