import { createHmac, timingSafeEqual } from 'node:crypto';

export interface Session {
  eleveId: string;
  classeId: string;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

function signature(donnees: string, secret: string): string {
  return createHmac('sha256', secret).update(donnees).digest('base64url');
}

export function signerJeton(p: Session, secret: string, ttlSec = 8 * 3600): string {
  const corps = b64(JSON.stringify({ e: p.eleveId, c: p.classeId, x: Math.floor(Date.now() / 1000) + ttlSec }));
  return `${corps}.${signature(corps, secret)}`;
}

export function verifierJeton(jeton: string, secret: string): Session | null {
  const [corps, sig, reste] = jeton.split('.');
  if (!corps || !sig || reste !== undefined) return null;
  const attendue = Buffer.from(signature(corps, secret));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  try {
    const d = JSON.parse(Buffer.from(corps, 'base64url').toString('utf-8')) as { e: string; c: string; x: number };
    if (typeof d.e !== 'string' || typeof d.c !== 'string' || typeof d.x !== 'number') return null;
    if (d.x < Math.floor(Date.now() / 1000)) return null;
    return { eleveId: d.e, classeId: d.c };
  } catch {
    return null;
  }
}
