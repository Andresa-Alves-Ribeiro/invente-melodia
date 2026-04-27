const ROWS = 8;
const COLS = 32;

const notasMusicais = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'La', 'Si', 'Dó']

export default function NotesTable() {
    return (
        <table className="border-8 border-black w-full table-fixed">
            <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                    <tr key={row}>
                        <td className="bg-black text-white text-[1.2rem] leading-none uppercase text-center align-middle w-[1.5rem] min-w-0 px-0.5 py-0">{notasMusicais[ROWS - 1 - row]}</td>

                        {Array.from({ length: COLS }, (_, col) => (
                            <td key={col} className={`${col === 16 ? '!border-l-8 border' : 'border'} 
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
