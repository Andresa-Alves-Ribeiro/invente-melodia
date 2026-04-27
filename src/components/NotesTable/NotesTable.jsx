import { useState, useRef, useCallback } from "react";

const ROWS = 8;
const COLS = 32;

const DOUBLE_RIGHT_MS = 500;
const AUDIO_PLAY_MS = 500;
/** Bloco de mesma cor: 1 s por quadrado (ex.: 4 pretos = 4 s, um só stream, sem loop do ficheiro). */
const PROLONG_MS_PER_CELL = 1000;

function cellState(next, row, col) {
  if (col < 0 || col >= COLS) return undefined;
  return next[`${row}-${col}`];
}

function isFilled(s) {
  return s === "left" || s === "right";
}

/** No máximo uma nota por coluna (tempo): remove outras linhas na mesma coluna antes de pintar. */
function applyPaintToColumn(state, row, col, value) {
  const next = { ...state };
  for (let r = 0; r < ROWS; r++) {
    if (r === row) continue;
    const k = `${r}-${col}`;
    if (k in next) delete next[k];
  }
  next[`${row}-${col}`] = value;
  return next;
}

/**
 * - Vizinho imediato com outra cor (preto x verde): toca 2x o fragmento.
 * - Mesma cor, bloco de 2+: o mesmo ficheiro toca 1 s × nº de quadrados contíguos, sem repetição em blocos.
 * - Caso contrário: um fragmento.
 */
function computePlayMode(next, row, col, v) {
  const L = cellState(next, row, col - 1);
  const R = cellState(next, row, col + 1);
  if ((isFilled(L) && L !== v) || (isFilled(R) && R !== v)) {
    return { kind: "repeat" };
  }
  let run = 1;
  for (let c = col - 1; c >= 0 && next[`${row}-${c}`] === v; c--) run += 1;
  for (let c = col + 1; c < COLS && next[`${row}-${c}`] === v; c++) run += 1;
  if (run >= 2) {
    return { kind: "prolonged", runLength: run };
  }
  return { kind: "single" };
}

function durationForMode(mode) {
  if (mode.kind === "repeat") return 2 * AUDIO_PLAY_MS;
  if (mode.kind === "prolonged") return PROLONG_MS_PER_CELL * mode.runLength;
  return AUDIO_PLAY_MS;
}

/** `track` opcional: em reprodução, regista `Audio` e `setTimeout` para parar. */
function playRowAudioFromSrc(src, mode, track) {
  const regA = (a) => {
    if (track) track.audios.push(a);
    return a;
  };
  const regT = (fn, ms) => {
    const id = setTimeout(fn, ms);
    if (track) track.timeoutIds.push(id);
    return id;
  };
  if (mode.kind === "repeat") {
    const a1 = regA(new Audio(src));
    void a1.play().catch(() => { });
    regT(() => {
      a1.pause();
      a1.currentTime = 0;
    }, AUDIO_PLAY_MS);
    regT(() => {
      const a2 = regA(new Audio(src));
      void a2.play().catch(() => { });
      regT(() => {
        a2.pause();
        a2.currentTime = 0;
      }, AUDIO_PLAY_MS);
    }, AUDIO_PLAY_MS);
    return;
  }
  const duration =
    mode.kind === "prolonged" ? PROLONG_MS_PER_CELL * mode.runLength : AUDIO_PLAY_MS;
  const audio = regA(new Audio(src));
  audio.loop = false;
  void audio.play().catch(() => { });
  regT(() => {
    audio.pause();
    audio.currentTime = 0;
  }, duration);
}

/** Uma entrada por “grau” na ordem de baixo → cima (índice alinha com notasMusicais[i]). Cada nota aponta para o MP3 em `src/components/audios`. */
const NOTAS_MUSICAIS = [
    { label: "Dó", src: new URL("../audios/dó1.mp3", import.meta.url).href },
    { label: "Ré", src: new URL("../audios/ré.mp3", import.meta.url).href },
    { label: "Mi", src: new URL("../audios/mi.mp3", import.meta.url).href },
    { label: "Fá", src: new URL("../audios/fá.mp3", import.meta.url).href },
    { label: "Sol", src: new URL("../audios/sol.mp3", import.meta.url).href },
    { label: "La", src: new URL("../audios/la.mp3", import.meta.url).href },
    { label: "Si", src: new URL("../audios/si.mp3", import.meta.url).href },
    { label: "Dó", src: new URL("../audios/dó2.mp3", import.meta.url).href },
];

export default function NotesTable() {
    const [cells, setCells] = useState({});
    const [actionHistory, setActionHistory] = useState([]);
    const [isReplaying, setIsReplaying] = useState(false);
    /** Durante ▶ Reproduzir: célula cuja nota está a tocar (vermelho). */
    const [replayHighlight, setReplayHighlight] = useState(null);
    const lastRightDownRef = useRef({ at: 0, row: null, col: null });
    const isReplayingRef = useRef(false);
    const replayAbortRef = useRef(false);
    const replayTrackRef = useRef({ audios: [], timeoutIds: [] });
    const endCurrentWaitRef = useRef(null);

    function clearCell(row, col) {
        const key = `${row}-${col}`;
        setCells((prev) => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    function handleNoteClick(e, row, col) {
        const key = `${row}-${col}`;

        if (e.button === 2) {
            const now = Date.now();
            const prev = lastRightDownRef.current;
            const sameCell = prev.row === row && prev.col === col;
            const withinWindow = sameCell && now - prev.at < DOUBLE_RIGHT_MS;
            const secondRightPress = e.detail === 2 || withinWindow;

            if (secondRightPress) {
                lastRightDownRef.current = { at: 0, row: null, col: null };
                if (key in cells) {
                    setActionHistory((h) => [...h, { type: "clear", row, col }]);
                }
                clearCell(row, col);
                return;
            }

            lastRightDownRef.current = { at: now, row, col };
            setActionHistory((h) => [...h, { type: "paint", row, col, value: "right" }]);
            setCells((prev) => {
                const next = applyPaintToColumn(prev, row, col, "right");
                const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;
                queueMicrotask(() => {
                    const mode = computePlayMode(next, row, col, "right");
                    playRowAudioFromSrc(src, mode);
                });
                return next;
            });
            return;
        }

        lastRightDownRef.current = { at: 0, row: null, col: null };

        if (e.detail > 1) return;

        if (e.button === 0) {
            setActionHistory((h) => [...h, { type: "paint", row, col, value: "left" }]);
            setCells((prev) => {
                const next = applyPaintToColumn(prev, row, col, "left");
                const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;
                queueMicrotask(() => {
                    const mode = computePlayMode(next, row, col, "left");
                    playRowAudioFromSrc(src, mode);
                });
                return next;
            });
        }
    }

    function handleCellDoubleClick(row, col) {
        const key = `${row}-${col}`;
        if (!(key in cells)) return;
        setActionHistory((h) => [...h, { type: "clear", row, col }]);
        clearCell(row, col);
    }

    const stopReplay = useCallback(() => {
        replayAbortRef.current = true;
        endCurrentWaitRef.current?.();
        endCurrentWaitRef.current = null;
        const t = replayTrackRef.current;
        t.timeoutIds.forEach((id) => clearTimeout(id));
        t.audios.forEach((a) => {
            try {
                a.pause();
                a.currentTime = 0;
            } catch {
                // ignore
            }
        });
        t.timeoutIds.length = 0;
        t.audios.length = 0;
        isReplayingRef.current = false;
        setIsReplaying(false);
        setReplayHighlight(null);
    }, []);

    const canClearTable =
        isReplaying || Object.keys(cells).length > 0 || actionHistory.length > 0;

    const handleClearEntireTable = useCallback(() => {
        if (isReplaying) stopReplay();
        lastRightDownRef.current = { at: 0, row: null, col: null };
        setCells({});
        setActionHistory([]);
    }, [isReplaying, stopReplay]);

    const handleReplay = useCallback(async () => {
        if (isReplayingRef.current || actionHistory.length === 0) return;
        replayAbortRef.current = false;
        replayTrackRef.current = { audios: [], timeoutIds: [] };
        isReplayingRef.current = true;
        setIsReplaying(true);
        setReplayHighlight(null);
        let state = {};
        try {
            for (const ev of actionHistory) {
                if (replayAbortRef.current) break;
                if (ev.type === "clear") {
                    const k = `${ev.row}-${ev.col}`;
                    const n = { ...state };
                    delete n[k];
                    state = n;
                    continue;
                }
                if (ev.type === "paint") {
                    const { row, col, value } = ev;
                    const next = applyPaintToColumn(state, row, col, value);
                    const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;
                    const mode = computePlayMode(next, row, col, value);
                    setReplayHighlight({ row, col });
                    playRowAudioFromSrc(src, mode, replayTrackRef.current);
                    const wait = durationForMode(mode);
                    await new Promise((resolve) => {
                        const id = setTimeout(() => {
                            endCurrentWaitRef.current = null;
                            resolve();
                        }, wait);
                        endCurrentWaitRef.current = () => {
                            clearTimeout(id);
                            endCurrentWaitRef.current = null;
                            resolve();
                        };
                    });
                    setReplayHighlight(null);
                    if (replayAbortRef.current) break;
                    state = next;
                }
            }
        } finally {
            isReplayingRef.current = false;
            setIsReplaying(false);
            setReplayHighlight(null);
            endCurrentWaitRef.current = null;
            replayTrackRef.current = { audios: [], timeoutIds: [] };
            replayAbortRef.current = false;
        }
    }, [actionHistory]);

    function squareBackground(row, col) {
        if (
            replayHighlight &&
            replayHighlight.row === row &&
            replayHighlight.col === col
        ) {
            return "red";
        }
        const action = cells[`${row}-${col}`];
        if (action === "left") return "black";
        if (action === "right") return "green";
        return "white";
    }

    return (
        <div className="w-full">
            <div className="mb-2 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={handleClearEntireTable}
                    disabled={!canClearTable}
                    className="rounded border-2 border-black bg-white px-4 py-2 font-medium uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-neutral-100"
                >
                    Limpar tabela
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (isReplaying) stopReplay();
                        else void handleReplay();
                    }}
                    disabled={!isReplaying && actionHistory.length === 0}
                    className="rounded border-2 border-black bg-white px-4 py-2 font-medium uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-neutral-100"
                >
                    {isReplaying ? "Parar" : "▶ Reproduzir"}
                </button>
            </div>
            <table className="border-8 border-black w-full table-fixed">
            <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                    <tr key={row}>
                        <td className="bg-black text-white text-[1.2rem] leading-none uppercase text-center align-middle w-[1.5rem] min-w-0 px-0.5 py-0">{NOTAS_MUSICAIS[ROWS - 1 - row].label}</td>

                        {Array.from({ length: COLS }, (_, col) => (
                            <td key={col}
                                onMouseDown={(e) => handleNoteClick(e, row, col)}
                                onContextMenu={(e) => e.preventDefault()}
                                onDoubleClick={() => handleCellDoubleClick(row, col)}
                                style={{ background: squareBackground(row, col) }}
                                className={`${col === 16 ? '!border-l-8 border' : 'border'} 
                            ${col % 4 === 0 ? 'border-l-4 border' : 'border'}
                            ${col % 8 === 0 ? 'border-l-[6px] border' : 'border'} border-black h-12 w-4`}>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}
