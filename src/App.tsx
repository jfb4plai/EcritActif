export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="plai-nav">
        <img src="/plai-logo.jpg" alt="Logo PLAI" style={{ height: '32px', width: 'auto' }} />
        <span className="font-serif text-xl ml-3">EcritActif</span>
      </nav>
      <main className="flex-1 mx-auto w-full max-w-3xl p-4">
        <h1>EcritActif</h1>
        <p>Apprendre à réfléchir, écrire, relire et corriger.</p>
      </main>
      <footer className="plai-footer">
        <img src="/plai-logo.jpg" alt="" style={{ height: '40px', width: 'auto' }} />
        <p>Pôle Territorial Ville de Liège, PLAI. Contact : jeanfrancois.beguin@ens.ecl.be</p>
      </footer>
    </div>
  );
}
