import NotesTable from './components/NotesTable/NotesTable';

function App() {
  return (
    <div className="app-shell relative flex flex-col items-center px-3 py-8 sm:px-6 md:py-12">
      <div className="relative z-10 flex w-full max-w-[min(100%,1920px)] flex-col items-center">
        <header className="mb-8 max-w-2xl text-center">
          <p className="mb-2 font-display text-xs uppercase tracking-[0.35em] text-stage-gold/90 sm:text-sm">
            Inventa a tua melodia
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span
              className="animate-float-note select-none text-3xl text-stage-mint/90 sm:text-4xl"
              aria-hidden
            >
              ♪
            </span>
            <h1 className="font-display text-3xl leading-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
              Inventor de{' '}
              <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-teal-300 bg-clip-text text-transparent">
                Melodias
              </span>
            </h1>
            <span
              className="animate-float-note select-none text-3xl text-stage-rose/90 sm:text-4xl [animation-delay:0.5s]"
              aria-hidden
            >
              ♫
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-violet-200/80 sm:text-base">
            Componha na tabela como num jogo de ritmo: cada coluna é um instante no tempo, cada linha é
            uma nota. Invente melodias e ouça o resultado com a reprodução.
          </p>
        </header>

        <main className="w-full">
          <NotesTable />
        </main>

        <footer className="mt-10 text-center text-xs text-violet-300/50 sm:text-sm">
          Dica: combina blocos da mesma cor para prolongar o som num só toque.
        </footer>
      </div>
    </div>
  );
}

export default App;
