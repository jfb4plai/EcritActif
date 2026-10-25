import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { AuthProvider, RequiertEnseignant, useAuth, type AuthClient } from './AuthContext';
import Connexion from '../pages/Connexion';

function clientDeTest(session: { user: { id: string; email: string } } | null) {
  const signUp = vi.fn(async () => ({ error: null }));
  const client: AuthClient = {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp,
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
  return { client, signUp };
}

function appli(client: AuthClient, chemin: string) {
  return render(
    <MemoryRouter initialEntries={[chemin]}>
      <AuthProvider client={client}>
        <Routes>
          <Route path="/connexion" element={<p>page de connexion</p>} />
          <Route
            path="/prive"
            element={
              <RequiertEnseignant>
                <p>contenu privé</p>
              </RequiertEnseignant>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RequiertEnseignant', () => {
  test('sans session : redirige vers /connexion', async () => {
    appli(clientDeTest(null).client, '/prive');
    expect(await screen.findByText('page de connexion')).toBeInTheDocument();
  });

  test('avec session : affiche le contenu', async () => {
    appli(clientDeTest({ user: { id: 'u1', email: 'a@b.be' } }).client, '/prive');
    expect(await screen.findByText('contenu privé')).toBeInTheDocument();
  });
});

describe('sans configuration Supabase (les pages élève et À propos doivent rester utilisables)', () => {
  function Etat() {
    const { user, chargement, seConnecter } = useAuth();
    return (
      <div>
        <p>utilisateur : {user ? 'oui' : 'non'}</p>
        <p>chargement : {chargement ? 'oui' : 'non'}</p>
        <button onClick={() => seConnecter('a@b.be', 'motdepasse8').catch((e: Error) => document.body.setAttribute('data-erreur', e.message))}>essayer</button>
      </div>
    );
  }

  test('le fournisseur ne plante pas et n’attend pas indéfiniment', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Etat />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('chargement : non')).toBeInTheDocument();
    expect(screen.getByText('utilisateur : non')).toBeInTheDocument();
  });

  test('se connecter lève une erreur claire', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Etat />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByText('essayer'));
    await waitFor(() => expect(document.body.getAttribute('data-erreur')).toMatch(/configuration/i));
  });
});

describe('creerCompte', () => {
  test('passe emailRedirectTo vers /connexion', async () => {
    const { client, signUp } = clientDeTest(null);
    function Bouton() {
      const { creerCompte } = useAuth();
      return <button onClick={() => creerCompte('a@b.be', 'motdepasse8')}>créer</button>;
    }
    render(
      <MemoryRouter>
        <AuthProvider client={client}>
          <Bouton />
        </AuthProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('créer'));
    await waitFor(() => expect(signUp).toHaveBeenCalled());
    const arg = signUp.mock.calls[0] as unknown as [{ options: { emailRedirectTo: string } }];
    expect(arg[0].options.emailRedirectTo).toBe(window.location.origin + '/connexion');
  });
});

describe('page Connexion : guidage de chaque champ', () => {
  test('e-mail et mot de passe ont label, placeholder et aide', () => {
    render(
      <MemoryRouter>
        <AuthProvider client={clientDeTest(null).client}>
          <Connexion />
        </AuthProvider>
      </MemoryRouter>,
    );
    for (const nom of [/adresse e-mail/i, /mot de passe/i]) {
      const champ = screen.getByLabelText(nom);
      expect(champ.getAttribute('placeholder')).toBeTruthy();
      const idAide = champ.getAttribute('aria-describedby');
      expect(idAide).toBeTruthy();
      expect(document.getElementById(idAide as string)?.textContent?.length).toBeGreaterThan(10);
    }
  });
});
