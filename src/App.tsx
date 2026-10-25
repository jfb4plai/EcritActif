import { Link, Route, Routes } from 'react-router-dom';
import { RequiertEnseignant } from './auth/AuthContext';
import Accueil from './pages/Accueil';
import APropos from './pages/APropos';
import Classe from './pages/Classe';
import Connexion from './pages/Connexion';
import Enseignant from './pages/Enseignant';
import PageEleve from './pages/PageEleve';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="plai-nav">
        <img src="/plai-logo.jpg" alt="Logo PLAI" style={{ height: '32px', width: 'auto' }} />
        <Link to="/" className="font-serif text-xl ml-3">
          EcritActif
        </Link>
      </nav>
      <main className="flex-1 mx-auto w-full max-w-3xl p-4">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/eleve" element={<PageEleve />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/apropos" element={<APropos />} />
          <Route
            path="/enseignant"
            element={
              <RequiertEnseignant>
                <Enseignant />
              </RequiertEnseignant>
            }
          />
          <Route
            path="/enseignant/classe/:id"
            element={
              <RequiertEnseignant>
                <Classe />
              </RequiertEnseignant>
            }
          />
        </Routes>
      </main>
      <footer className="plai-footer">
        <img src="/plai-logo.jpg" alt="" style={{ height: '40px', width: 'auto' }} />
        <p>Pôle Territorial Ville de Liège, PLAI. Contact : jeanfrancois.beguin@ens.ecl.be</p>
        <p>
          <Link to="/apropos">À propos, licences et crédits</Link>
        </p>
      </footer>
    </div>
  );
}
