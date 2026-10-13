
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import atlas from '/atlas.png'

import './App.css';
import Outbreak from './components/Outbreak';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const ARQUIVO_PDF = '/NMX-2_Arquivos_Finais_ATLAS.pdf';

function App() {
  const leitorRef = useRef(null);

  const [numPaginas, setNumPaginas] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [telaCheia, setTelaCheia] = useState(false);

  const [dimensoes, setDimensoes] = useState({
    largura: window.innerWidth,
    altura: window.innerHeight,
  });

  const [proporcaoPagina, setProporcaoPagina] = useState(
    595 / 842
  );

  // Atualiza as dimensões da janela
  useEffect(() => {
    function atualizarDimensoes() {
      setDimensoes({
        largura: window.innerWidth,
        altura: window.innerHeight,
      });
    }

    window.addEventListener('resize', atualizarDimensoes);

    return () => {
      window.removeEventListener('resize', atualizarDimensoes);
    };
  }, []);

  // Acompanha a entrada e a saída da tela cheia
  useEffect(() => {
    function atualizarTelaCheia() {
      setTelaCheia(Boolean(document.fullscreenElement));
    }

    document.addEventListener(
      'fullscreenchange',
      atualizarTelaCheia
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        atualizarTelaCheia
      );
    };
  }, []);

  // Calcula a largura para caber na janela
  const larguraPagina = Math.max(
    100,
    Math.min(
      dimensoes.largura - 32,
      (dimensoes.altura - 190) * proporcaoPagina,
      800
    )
  );

  function aoCarregarPDF({ numPages }) {
    setNumPaginas(numPages);
    setPaginaAtual(1);
  }

  // Obtém a proporção original da página do PDF
  function aoCarregarPagina(page) {
    if (page.originalWidth && page.originalHeight) {
      setProporcaoPagina(
        page.originalWidth / page.originalHeight
      );
    }
  }

  function proximaPagina() {
    setPaginaAtual((pagina) =>
      Math.min(pagina + 1, numPaginas)
    );
  }

  function paginaAnterior() {
    setPaginaAtual((pagina) =>
      Math.max(pagina - 1, 1)
    );
  }

  async function alternarTelaCheia() {
    try {
      if (!document.fullscreenElement) {
        await leitorRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (erro) {
      console.error('Não foi possível alternar a tela cheia:', erro);
    }
  }

  // Navegação pelo teclado
  useEffect(() => {
    function lidarComTeclado(evento) {
      if (
        evento.altKey ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.target instanceof HTMLInputElement ||
        evento.target instanceof HTMLTextAreaElement ||
        evento.target?.isContentEditable
      ) {
        return;
      }

      if (evento.key === 'ArrowRight') {
        evento.preventDefault();

        setPaginaAtual((pagina) =>
          Math.min(pagina + 1, numPaginas)
        );
      }

      if (evento.key === 'ArrowLeft') {
        evento.preventDefault();

        setPaginaAtual((pagina) =>
          Math.max(pagina - 1, 1)
        );
      }

      if (evento.key === 'Escape' && document.fullscreenElement) {
        // O próprio navegador encerra a tela cheia com Escape.
        return;
      }
    }

    window.addEventListener('keydown', lidarComTeclado);

    return () => {
      window.removeEventListener('keydown', lidarComTeclado);
    };
  }, [numPaginas]);

  return (
    <>
      <main className="leitor" ref={leitorRef}>
        <header className="cabecalho">
          <div className="identidade">
            <div className="simbolo-atlas" aria-hidden="true">
              <img src={atlas}></img>
            </div>

            <div className="identidade-texto">
              <h1>PROJECT ATLAS</h1>
              <p>NMX DIVISION · ARCHIVES &amp; RECORDS</p>
            </div>
          </div>

          <div className="classificacao">
            RESTRICTED
          </div>
        </header>

        <div className="linha-cabecalho">
          <span>DOCUMENT FILE</span>
        </div>

        <section className="area-documento">
          <Outbreak />
          <div className="documento">
            <Document
              file={ARQUIVO_PDF}
              onLoadSuccess={aoCarregarPDF}
              loading={
                <p className="mensagem">
                  INITIALIZING ARCHIVE...
                  <span>Carregando os arquivos do Projeto ATLAS.</span>
                </p>
              }
              error={
                <p className="mensagem erro">
                  ARCHIVE ACCESS FAILURE
                  <span>
                    Verifique o caminho e o nome do arquivo PDF.
                  </span>
                </p>
              }
            >
              <div
                className="pagina-animada"
                key={paginaAtual}
              >
                <Page
                  pageNumber={paginaAtual}
                  width={larguraPagina}
                  onLoadSuccess={aoCarregarPagina}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <p className="mensagem">
                      DECODING PAGE...
                    </p>
                  }
                />
              </div>
            </Document>
          </div>
        </section>

        <footer className="rodape-leitor">
          <div className="status-documento">
            <span className="indicador-verde" />
            <span>ARCHIVE ONLINE</span>
          </div>

          <div className="navegacao">
            <button
              className="botao-navegacao"
              onClick={paginaAnterior}
              disabled={paginaAtual === 1 || numPaginas === 0}
              aria-label="Página anterior"
              title="Página anterior (←)"
            >
              &#8592;
            </button>

            <p className="contador" aria-live="polite">
              FOLHA {String(paginaAtual).padStart(2, '0')}
              {' / '}
              {String(numPaginas).padStart(2, '0')}
            </p>

            <button
              className="botao-navegacao"
              onClick={proximaPagina}
              disabled={
                numPaginas === 0 || paginaAtual === numPaginas
              }
              aria-label="Próxima página"
              title="Próxima página (→)"
            >
              &#8594;
            </button>
          </div>

          <button
            className="botao-tela-cheia"
            onClick={alternarTelaCheia}
            aria-label={
              telaCheia ? 'Sair da tela cheia' : 'Entrar em tela cheia'
            }
            title={
              telaCheia ? 'Sair da tela cheia' : 'Tela cheia'
            }
          >
            <span aria-hidden="true">
              {telaCheia ? '⛶' : '⛶'}
            </span>
            <span className="texto-tela-cheia">
              {telaCheia ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </span>
          </button>
        </footer>
      </main>
    </>
  );
}

export default App;
