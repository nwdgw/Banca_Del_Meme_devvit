import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  FileJson,
  FileText,
  FolderArchive,
  Search,
} from 'lucide-react';
import {
  DEVVIT_PROJECT_FILES,
  type DevvitProjectFile,
} from './data/devvitProjectFiles';
import {
  CUTOVER_STEPS,
  DEPLOY_STEPS,
  MODULE_MAPPINGS,
  PARITY_NOTES,
} from './data/migrationGuide';

type ActiveView = 'code' | 'guide';

const CATEGORY_LABELS: Record<DevvitProjectFile['category'], string> = {
  config: 'Configurazione',
  core: 'Moduli Core',
  workers: 'Trigger e Worker',
  season: 'Stagione e Classifica',
  migration: 'Migrazione DB',
};

const CATEGORY_ORDER: DevvitProjectFile['category'][] = [
  'config',
  'core',
  'workers',
  'season',
  'migration',
];

function FileTypeIcon({ language }: { language: DevvitProjectFile['language'] }) {
  if (language === 'json') {
    return <FileJson className="w-4 h-4 shrink-0 text-slate-400" />;
  }
  if (language === 'markdown') {
    return <FileText className="w-4 h-4 shrink-0 text-slate-400" />;
  }
  return <FileCode2 className="w-4 h-4 shrink-0 text-slate-400" />;
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('code');
  const [selectedPath, setSelectedPath] = useState<string>(
    DEVVIT_PROJECT_FILES[0].path
  );
  const [fileQuery, setFileQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = useMemo(
    () =>
      DEVVIT_PROJECT_FILES.find((f) => f.path === selectedPath) ??
      DEVVIT_PROJECT_FILES[0],
    [selectedPath]
  );

  const filteredFiles = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    if (!q) return DEVVIT_PROJECT_FILES;
    return DEVVIT_PROJECT_FILES.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.originalEquivalent.toLowerCase().includes(q)
    );
  }, [fileQuery]);

  const codeLines = useMemo(
    () => selectedFile.content.replace(/\n$/, '').split('\n'),
    [selectedFile]
  );

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  }

  function handleDownloadSingle(file: DevvitProjectFile) {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() ?? 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDownloadZip() {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const root = zip.folder('bancadelmeme-devvit');
      if (root) {
        for (const file of DEVVIT_PROJECT_FILES) {
          root.file(file.path, file.content);
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bancadelmeme-devvit.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  }

  function openDevvitFileFromGuide(path: string) {
    const match = DEVVIT_PROJECT_FILES.find((f) => f.path === path);
    if (match) {
      setSelectedPath(match.path);
      setActiveView('code');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('code');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          BancaDelMeme · Devvit
        </a>

        <nav
          aria-label="Navigazione principale"
          className="flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => setActiveView('code')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              activeView === 'code'
                ? 'border-orange-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Codice Bot
          </button>
          <button
            type="button"
            onClick={() => setActiveView('guide')}
            className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
              activeView === 'guide'
                ? 'border-orange-600 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Guida Deploy
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 shrink-0" />
            <span>{isZipping ? 'Creazione ZIP...' : 'Scarica ZIP'}</span>
          </button>
        </div>
      </header>

      {activeView === 'code' ? (
        <main className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <aside className="w-full lg:w-[296px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col gap-4">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                File del Bot Devvit
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Porting 1:1 da timendum/BancaDelMeme
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={fileQuery}
                onChange={(e) => setFileQuery(e.target.value)}
                placeholder="Filtra file o modulo Python..."
                aria-label="Filtra file o modulo Python"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
              />
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <div className="py-6 px-3 text-center border border-slate-200 rounded-md bg-slate-50">
                  <p className="text-xs text-slate-600">
                    Nessun file corrisponde alla ricerca.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFileQuery('')}
                    className="mt-2 text-xs font-medium text-orange-600 hover:underline cursor-pointer"
                  >
                    Mostra tutti i file
                  </button>
                </div>
              ) : (
                CATEGORY_ORDER.map((cat) => {
                  const items = filteredFiles.filter((f) => f.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="flex flex-col gap-1">
                      <div className="px-2 pb-1 text-xs font-semibold text-slate-500">
                        {CATEGORY_LABELS[cat]}
                      </div>
                      {items.map((file) => {
                        const isActive = file.path === selectedFile.path;
                        return (
                          <button
                            key={file.path}
                            type="button"
                            onClick={() => setSelectedPath(file.path)}
                            className={`w-full text-left px-2.5 py-2 rounded-md border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-orange-50/70 border-orange-200 text-slate-900'
                                : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileTypeIcon language={file.language} />
                              <span className="font-mono text-xs font-medium truncate">
                                {file.path}
                              </span>
                            </div>
                            <div className="pl-6 mt-0.5 text-[11px] text-slate-500 truncate">
                              {file.originalEquivalent}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex-1 min-w-0 p-4 lg:p-6 flex flex-col gap-4">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{CATEGORY_LABELS[selectedFile.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {codeLines.length} righe
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      Originale: {selectedFile.originalEquivalent}
                    </span>
                  </div>
                  <h2 className="font-mono text-base font-semibold text-slate-900 mt-1 truncate">
                    {selectedFile.path}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedFile.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(selectedFile.content, `file:${selectedFile.path}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === `file:${selectedFile.path}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiato</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copia</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(selectedFile)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Scarica file</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-100 overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[13px] leading-6">
                  <tbody>
                    {codeLines.map((line, index) => (
                      <tr key={index} className="hover:bg-slate-900/70">
                        <td className="select-none text-right text-slate-500 pl-4 pr-4 py-0 w-12 align-top tabular-nums">
                          {index + 1}
                        </td>
                        <td className="pr-6 py-0 whitespace-pre">
                          {line.length > 0 ? line : ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Guida alla migrazione su Reddit Devvit
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 max-w-3xl">
                Procedura essenziale per compilare, caricare e installare il
                porting 1:1 di timendum/BancaDelMeme su Reddit Devvit prima
                della chiusura delle API legacy.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {DEPLOY_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="p-5 flex flex-col gap-2.5"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-semibold text-orange-600 tabular-nums">
                      {item.step}.
                    </span>
                    <h2 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 pl-7">{item.detail}</p>
                  {item.command && (
                    <div className="pl-7 mt-1">
                      <div className="flex items-center justify-between gap-4 bg-slate-950 text-slate-100 rounded-md px-3.5 py-2.5 font-mono text-xs overflow-x-auto">
                        <code className="whitespace-nowrap">{item.command}</code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(item.command!, `cmd:${item.step}`)
                          }
                          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {copiedKey === `cmd:${item.step}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiato</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copia</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Sostituzione del bot attuale e mantenimento del DB
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Passaggi operativi per spegnere il vecchio bot Python, esportare il
                database SQLite esistente e importarlo in Devvit Redis senza perdere
                saldi, classifiche o investimenti aperti.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {CUTOVER_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="p-5 flex flex-col gap-2.5"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-semibold text-orange-600 tabular-nums">
                      {item.step}.
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 pl-7">{item.detail}</p>
                  {item.command && (
                    <div className="pl-7 mt-1">
                      <div className="flex items-center justify-between gap-4 bg-slate-950 text-slate-100 rounded-md px-3.5 py-2.5 font-mono text-xs overflow-x-auto">
                        <code className="whitespace-nowrap">{item.command}</code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(item.command!, `cutover:${item.step}`)
                          }
                          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {copiedKey === `cutover:${item.step}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiato</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copia</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Verifica parità 1:1 e funzionamento Telegram
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Confronto puntuale con timendum/BancaDelMeme e vincoli introdotti
                dalla piattaforma Reddit Devvit.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Funzionalità</th>
                    <th className="py-3 px-4">Stato su Devvit</th>
                    <th className="py-3 px-4">Dettaglio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {PARITY_NOTES.map((row) => (
                    <tr key={row.area} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900 align-top whitespace-nowrap">
                        {row.area}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-orange-600 align-top whitespace-nowrap">
                        {row.status}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 align-top leading-relaxed">
                        {row.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Mappatura 1:1 dei moduli originali
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Corrispondenza diretta tra i file Python di
                timendum/BancaDelMeme e i rispettivi moduli TypeScript Devvit.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Originale (Python)</th>
                    <th className="py-3 px-4">Nuovo (Devvit)</th>
                    <th className="py-3 px-4">Comportamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MODULE_MAPPINGS.map((row) => {
                    const primaryPath = row.devvit
                      .split(' ')[0]
                      .replace(/[^a-zA-Z0-9_./-]/g, '');
                    const canOpen = DEVVIT_PROJECT_FILES.some(
                      (f) => f.path === primaryPath
                    );
                    return (
                      <tr key={row.original} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 align-top whitespace-nowrap">
                          {row.original}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs align-top whitespace-nowrap">
                          {canOpen ? (
                            <button
                              type="button"
                              onClick={() => openDevvitFileFromGuide(primaryPath)}
                              className="text-orange-600 hover:underline font-medium cursor-pointer text-left"
                            >
                              {row.devvit}
                            </button>
                          ) : (
                            <span className="text-slate-900">{row.devvit}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 align-top leading-relaxed">
                          {row.changes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
