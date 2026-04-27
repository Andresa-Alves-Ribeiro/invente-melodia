const ROWS = 8;
const COLS = 32;

export default function NotesTable() {
    return (
        <table className="border border-black w-full">
            <tbody>
                {Array.from({ length: ROWS }, (_, row) => (
                    <tr key={row}>
                        {Array.from({ length: COLS }, (_, col) => (
                            <td key={col} className="border border-black h-12">
                                
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
