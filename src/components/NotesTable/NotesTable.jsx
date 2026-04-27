import { useState, useRef, useCallback, useEffect } from "react";

const ROWS = 8;
const COLS = 32;
const PAUSE_HIGHLIGHT_ROW = Math.min(3, ROWS - 1);
const DOUBLE_RIGHT_MS = 500;
const AUDIO_PLAY_MS = 500;
const SILENCE_MS = 500;
const PROLONG_MS_PER_CELL = 500;

const PLAYBACK_SPEED_TIERS = [
    { label: "1x", hint: "normal", rate: 1 },
    { label: "2x", hint: "ritmo +25%", rate: 1.25 },
    { label: "3x", hint: "ritmo +50%", rate: 1.5 },
    { label: "4x", hint: "ritmo +75%", rate: 1.75 },
    { label: "5x", hint: "ritmo +100%", rate: 2 },
];

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

const ROW_LABEL_ACCENT = [
    "border-l-4 border-l-red-500 shadow-[inset_6px_0_12px_-4px_rgba(239,68,68,0.35)]",
    "border-l-4 border-l-purple-600 shadow-[inset_6px_0_12px_-4px_rgba(147,51,234,0.35)]",
    "border-l-4 border-l-blue-600 shadow-[inset_6px_0_12px_-4px_rgba(37,99,235,0.35)]",
    "border-l-4 border-l-teal-500 shadow-[inset_6px_0_12px_-4px_rgba(20,184,166,0.35)]",
    "border-l-4 border-l-lime-400 shadow-[inset_6px_0_12px_-4px_rgba(163,230,53,0.35)]",
    "border-l-4 border-l-yellow-400 shadow-[inset_6px_0_12px_-4px_rgba(250,204,21,0.35)]",
    "border-l-4 border-l-orange-500 shadow-[inset_6px_0_12px_-4px_rgba(249,115,22,0.35)]",
    "border-l-4 border-l-red-500 shadow-[inset_6px_0_12px_-4px_rgba(239,68,68,0.35)]",
];

function cellState(next, row, col) {
    if (col < 0 || col >= COLS) return undefined;
    return next[`${row}-${col}`];
}

function isFilled(s) {
    return s === "left" || s === "right";
}

function maxColWithAnyCell(state) {
    let m = 0;

    for (const k of Object.keys(state)) {
        const c = Number(String(k).split("-").pop());
        if (Number.isFinite(c) && c > m) m = c;
    }

    return m;
}

function minColWithAnyCell(state) {
    let m = Infinity;

    for (const k of Object.keys(state)) {
        const c = Number(String(k).split("-").pop());
        if (Number.isFinite(c) && c < m) m = c;
    }

    return m === Infinity ? 0 : m;
}

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

function computePlayMode(next, row, col, v) {
    let run = 1;

    for (let c = col - 1; c >= 0 && next[`${row}-${c}`] === v; c--) run += 1;

    for (let c = col + 1; c < COLS && next[`${row}-${c}`] === v; c++) run += 1;

    if (run >= 2) {
        return { kind: "prolonged", runLength: run };
    }

    return { kind: "single" };
}

function durationForMode(mode) {
    if (mode.kind === "prolonged") return PROLONG_MS_PER_CELL * mode.runLength;

    return AUDIO_PLAY_MS;
}

const AUDIO_POOL_SIZE = 4;

const audioPoolBySrc = new Map();

function getAudioPool(src) {
    let pool = audioPoolBySrc.get(src);

    if (!pool) {
        const elements = [];

        for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
            const a = new Audio(src);

            a.preload = "auto";

            a.playsInline = true;

            elements.push(a);
        }

        pool = { elements, next: 0 };

        audioPoolBySrc.set(src, pool);
    }

    return pool;
}

function takePooledAudio(src) {
    const pool = getAudioPool(src);

    const audio = pool.elements[pool.next];

    pool.next = (pool.next + 1) % AUDIO_POOL_SIZE;

    return audio;
}

function preloadAllNoteAudios() {
    const seen = new Set();

    for (const { src } of NOTAS_MUSICAIS) {
        if (seen.has(src)) continue;

        seen.add(src);

        const { elements } = getAudioPool(src);

        for (const a of elements) {
            try {
                a.load();
            } catch {
                /* ignore */
            }
        }
    }
}

function playRowAudioFromSrc(src, mode, track, sequenceSpeed = 1) {
    const rate = Math.max(0.25, Math.min(4, sequenceSpeed || 1));

    const regA = (a) => {
        if (track) track.audios.push(a);

        return a;
    };

    const regT = (fn, ms) => {
        const id = setTimeout(fn, ms);

        if (track) track.timeoutIds.push(id);

        return id;
    };

    const duration =
        mode.kind === "prolonged"
            ? PROLONG_MS_PER_CELL * mode.runLength
            : AUDIO_PLAY_MS;

    const audio = regA(takePooledAudio(src));

    audio.pause();

    audio.currentTime = 0;

    audio.loop = false;

    void audio.play().catch(() => { });

    regT(() => {
        audio.pause();

        audio.currentTime = 0;
    }, duration / rate);
}

export default function NotesTable() {
    const [cells, setCells] = useState({});

    const [actionHistory, setActionHistory] = useState([]);

    const [isReplaying, setIsReplaying] = useState(false);

    const [replayHighlight, setReplayHighlight] = useState(null);

    const lastRightDownRef = useRef({ at: 0, row: null, col: null });

    const isReplayingRef = useRef(false);

    const replayAbortRef = useRef(false);

    const replayTrackRef = useRef({ audios: [], timeoutIds: [] });

    const endCurrentWaitRef = useRef(null);

    const [speedTierIndex, setSpeedTierIndex] = useState(0);

    const playbackRateRef = useRef(PLAYBACK_SPEED_TIERS[0].rate);

    useEffect(() => {
        playbackRateRef.current = PLAYBACK_SPEED_TIERS[speedTierIndex].rate;
    }, [speedTierIndex]);

    useEffect(() => {
        preloadAllNoteAudios();
    }, []);

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

            setActionHistory((h) => [
                ...h,
                { type: "paint", row, col, value: "right" },
            ]);

            setCells((prev) => {
                const next = applyPaintToColumn(prev, row, col, "right");

                const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;

                queueMicrotask(() => {
                    const mode = computePlayMode(next, row, col, "right");

                    playRowAudioFromSrc(src, mode, undefined, playbackRateRef.current);
                });

                return next;
            });

            return;
        }

        lastRightDownRef.current = { at: 0, row: null, col: null };

        if (e.detail > 1) return;

        if (e.button === 0) {
            setActionHistory((h) => [
                ...h,
                { type: "paint", row, col, value: "left" },
            ]);

            setCells((prev) => {
                const next = applyPaintToColumn(prev, row, col, "left");

                const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;

                queueMicrotask(() => {
                    const mode = computePlayMode(next, row, col, "left");

                    playRowAudioFromSrc(src, mode, undefined, playbackRateRef.current);
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
            } catch { }
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
        if (isReplayingRef.current) return;

        if (Object.keys(cells).length === 0) return;

        replayAbortRef.current = false;

        replayTrackRef.current = { audios: [], timeoutIds: [] };

        isReplayingRef.current = true;

        setIsReplaying(true);

        setReplayHighlight(null);

        const waitFor = (ms) =>
            new Promise((resolve) => {
                if (replayAbortRef.current) {
                    resolve();

                    return;
                }

                const r = Math.max(0.25, playbackRateRef.current || 1);

                const wallMs = ms / r;

                const id = setTimeout(() => {
                    endCurrentWaitRef.current = null;

                    resolve();
                }, wallMs);

                endCurrentWaitRef.current = () => {
                    clearTimeout(id);

                    endCurrentWaitRef.current = null;

                    resolve();
                };
            });

        try {
            let lastColoredRow = null;

            const startCol = minColWithAnyCell(cells);

            const endCol = maxColWithAnyCell(cells);

            for (let col = startCol; col <= endCol; col++) {
                if (replayAbortRef.current) break;

                let row = null;

                let value = null;

                for (let r = 0; r < ROWS; r++) {
                    const k = `${r}-${col}`;

                    if (k in cells) {
                        row = r;

                        value = cells[k];

                        break;
                    }
                }

                if (row == null) {
                    const restRow = lastColoredRow ?? PAUSE_HIGHLIGHT_ROW;

                    setReplayHighlight({ rest: true, row: restRow, col });

                    await waitFor(SILENCE_MS);

                    setReplayHighlight(null);

                    continue;
                }

                if (
                    col > 0 &&
                    isFilled(value) &&
                    cellState(cells, row, col - 1) === value
                ) {
                    continue;
                }

                const src = NOTAS_MUSICAIS[ROWS - 1 - row].src;

                const mode = computePlayMode(cells, row, col, value);

                playRowAudioFromSrc(
                    src,

                    mode,

                    replayTrackRef.current,

                    playbackRateRef.current,
                );

                if (mode.kind === "prolonged") {
                    for (let i = 0; i < mode.runLength; i++) {
                        if (replayAbortRef.current) break;

                        setReplayHighlight({ row, col: col + i });

                        await waitFor(AUDIO_PLAY_MS);
                    }
                } else {
                    setReplayHighlight({ row, col });

                    await waitFor(durationForMode(mode));
                }

                setReplayHighlight(null);

                lastColoredRow = row;
            }
        } finally {
            isReplayingRef.current = false;

            setIsReplaying(false);

            setReplayHighlight(null);

            endCurrentWaitRef.current = null;

            replayTrackRef.current = { audios: [], timeoutIds: [] };

            replayAbortRef.current = false;
        }
    }, [cells]);

    function cellClassName(row, col) {
        if (
            replayHighlight &&
            replayHighlight.row === row &&
            replayHighlight.col === col
        ) {
            return "notes-table-cell notes-table-cell--replay";
        }

        const action = cells[`${row}-${col}`];

        if (action === "left") return "notes-table-cell notes-table-cell--left";

        if (action === "right") return "notes-table-cell notes-table-cell--right";

        return "notes-table-cell notes-table-cell--empty";
    }

    const filledCount = Object.keys(cells).length;

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border-2 border-stage-gold/25 bg-gradient-to-b from-[#1a1535]/95 to-stage-panel/90 p-1 shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(244,208,63,0.12),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-sm sm:p-1.5">
            <div className="min-w-0 rounded-xl border border-white/5 bg-black/20 p-3 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:gap-4">
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-start">
                            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-center text-xs font-semibold text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.15)] sm:text-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                                    <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                                </span>
                                {filledCount} nota{filledCount === 1 ? "" : "s"} na pauta
                            </span>

                            {isReplaying && (
                                <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
                                    <span aria-hidden>▶</span> A tocar…
                                </span>
                            )}
                        </div>

                        <div className="grid w-full max-w-md grid-cols-1 gap-1.5 text-[11px] text-violet-200/90 min-[480px]:grid-cols-3 min-[480px]:gap-2 sm:max-w-none sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:justify-end sm:gap-2 sm:text-xs">
                            <span className="block rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-center leading-snug shadow-sm transition min-[480px]:text-left sm:inline-block sm:text-left sm:hover:border-white/20">
                                <span className="font-semibold text-stage-gold">Esq.</span> nota
                                preta
                            </span>

                            <span className="block rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-center leading-snug shadow-sm transition min-[480px]:text-left sm:inline-block sm:text-left sm:hover:border-white/20">
                                <span className="font-semibold text-stage-mint">Dir.</span> nota
                                verde
                            </span>

                            <span className="block rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-center text-[10px] leading-snug shadow-sm transition min-[480px]:text-left min-[480px]:text-xs sm:inline-block sm:text-left sm:text-xs sm:hover:border-white/20">
                                Duplo clique / duplo direito apaga
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-3 flex min-w-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
                    <div className="flex w-full min-w-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <div className="flex w-full min-w-0 flex-nowrap items-end gap-2 sm:w-auto sm:items-center sm:gap-2.5">
                            <div className="flex shrink-0 items-end gap-3.5 sm:gap-4">
                                <div
                                    className="pointer-events-none flex items-end gap-0.5 sm:gap-1"
                                    aria-hidden
                                >
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <span
                                            key={i}
                                            className={`notes-eq-bar w-1.5 rounded-sm bg-gradient-to-t from-emerald-600 to-stage-mint sm:w-2 ${isReplaying ? "notes-eq-bar--playing" : ""}`}
                                            style={{
                                                animationDelay: `${i * 0.12}s`,
                                                height: `${18 + (i % 3) * 10}px`,
                                            }}
                                        />
                                    ))}
                                </div>

                                <label
                                    htmlFor="playback-speed"
                                    className="whitespace-nowrap font-display text-xs uppercase leading-none tracking-wide text-violet-200 sm:pb-0.5 sm:text-sm"
                                >
                                    Velocidade
                                </label>
                            </div>

                            <select
                                id="playback-speed"
                                value={speedTierIndex}
                                disabled={isReplaying}
                                onChange={(e) => setSpeedTierIndex(Number(e.target.value))}
                                title={
                                    isReplaying
                                        ? "Não é possível alterar a velocidade durante a reprodução"
                                        : "Ritmo da sequência (pausas e duração de cada nota). O som mantém timbre natural; a reprodução não é acelerada no arquivo."
                                }
                                className="min-w-0 flex-1 rounded-xl border-2 border-sky-500/60 bg-gradient-to-b from-sky-600 to-sky-900 px-2.5 py-2.5 font-display text-xs uppercase tracking-wide text-white shadow-arcade disabled:cursor-not-allowed disabled:opacity-45 enabled:hover:brightness-110 sm:min-w-[11rem] sm:flex-none sm:px-3 sm:text-sm"
                            >
                                {PLAYBACK_SPEED_TIERS.map((t, i) => (
                                    <option
                                        key={t.label + t.rate}
                                        value={i}
                                        className="bg-zinc-900 text-white"
                                    >
                                        {t.label}

                                        {t.hint === "normal" ? " (normal)" : ` (${t.hint})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:w-auto sm:grid-cols-none sm:gap-3">
                        <button
                            type="button"
                            onClick={handleClearEntireTable}
                            disabled={!canClearTable}
                            className="min-h-11 w-full touch-manipulation rounded-xl border-2 border-stage-ink bg-gradient-to-b from-zinc-700 to-zinc-900 px-3 py-2.5 font-display text-xs uppercase tracking-wide text-white shadow-arcade transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:px-4 sm:text-sm"
                        >
                            Limpar tabela
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (isReplaying) stopReplay();
                                else void handleReplay();
                            }}
                            disabled={!isReplaying && Object.keys(cells).length === 0}
                            className={`min-h-11 w-full touch-manipulation rounded-xl border-2 border-stage-ink bg-gradient-to-b from-emerald-500 to-emerald-700 px-3 py-2.5 font-display text-xs uppercase tracking-wide text-white shadow-arcade transition enabled:hover:scale-[1.02] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:px-4 sm:text-sm ${!isReplaying && Object.keys(cells).length > 0 ? "ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_24px_rgba(52,211,153,0.35)]" : ""} ${isReplaying ? "ring-2 ring-amber-300/50 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_20px_rgba(251,191,36,0.25)]" : ""}`}
                        >
                            {isReplaying ? "⏹ Parar" : "▶ Reproduzir"}
                        </button>
                        </div>
                    </div>
                </div>

                <div className="relative [perspective:1000px]">
                    <div className="relative overflow-x-auto rounded-2xl border-4 border-zinc-700/90 bg-gradient-to-br from-slate-900 via-zinc-950 to-black p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_20px_50px_rgba(0,0,0,0.65),0_0_40px_rgba(91,33,182,0.12)] [-webkit-overflow-scrolling:touch]">
                        <div
                            className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.12)_2px,rgba(0,0,0,0.12)_3px)] opacity-30"
                            aria-hidden
                        />

                        <div
                            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-violet-500/[0.08] via-transparent to-cyan-500/[0.08] animate-playhead-sweep"
                            aria-hidden
                        />

                        <div className="relative z-[1] min-w-0 origin-top [transform:rotateX(0.6deg)]">
                            <table className="w-full min-w-[1200px] table-fixed border-collapse">
                                <tbody>
                                    {Array.from({ length: ROWS }, (_, row) => (
                                        <tr
                                            key={row}
                                            className="transition-shadow hover:shadow-[inset_0_0_20px_rgba(139,92,246,0.08)]"
                                        >
                                            <td
                                                className={`min-w-0 w-10 max-w-[2.5rem] border-4 border-black bg-gradient-to-b from-zinc-800 to-zinc-950 px-1 py-0.5 text-center align-middle font-display text-sm uppercase leading-tight text-stage-gold shadow-[inset_0_0_20px_rgba(244,208,63,0.15),0_2px_0_rgba(0,0,0,0.5)] sm:w-12 sm:text-base ${ROW_LABEL_ACCENT[row]}`}
                                            >
                                                {NOTAS_MUSICAIS[ROWS - 1 - row].label}
                                            </td>

                                            {Array.from({ length: COLS }, (_, col) => (
                                                <td
                                                    key={col}
                                                    onMouseDown={(e) => handleNoteClick(e, row, col)}
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    onDoubleClick={() => handleCellDoubleClick(row, col)}
                                                    className={`${cellClassName(row, col)} h-12 w-4 cursor-crosshair border border-black/90 ${col === 16
                                                            ? "!border-l-8 !border-l-blue-900"
                                                            : col % 8 === 0
                                                                ? "border-l-[6px] border-l-cyan-500/55"
                                                                : col % 4 === 0
                                                                    ? "border-l-4 border-l-zinc-600"
                                                                    : ""
                                                        }`}
                                                />
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
