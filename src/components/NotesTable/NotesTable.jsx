import { useState, useRef } from "react";

const ROWS = 8;
const COLS = 32;

const DOUBLE_RIGHT_MS = 500;

const notasMusicais = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'La', 'Si', 'Dó']

export default function NotesTable() {
    const [cells, setCells] = useState({});
    const lastRightDownRef = useRef({ at: 0, row: null, col: null });

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
                clearCell(row, col);
                return;
            }

            lastRightDownRef.current = { at: now, row, col };
            setCells((prev) => ({ ...prev, [key]: "right" }));
            return;
        }

        lastRightDownRef.current = { at: 0, row: null, col: null };

        if (e.detail > 1) return;

        if (e.button === 0) {
            setCells((prev) => ({ ...prev, [key]: "left" }));
        }
    }

    function handleCellDoubleClick(row, col) {
        clearCell(row, col);
    }

    function squareBackground(row, col) {
        const action = cells[`${row}-${col}`];
        if (action === "left") return "black";
        if (action === "right") return "green";
        return "white";
    }

    return (
        <table className="border-8 border-black w-full table-fixed">
            <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                    <tr key={row}>
                        <td className="bg-black text-white text-[1.2rem] leading-none uppercase text-center align-middle w-[1.5rem] min-w-0 px-0.5 py-0">{notasMusicais[ROWS - 1 - row]}</td>

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
    );
}
