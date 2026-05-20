// utils/chunkText.js

/**
 * Divide un texto largo en chunks más pequeños, con solapamiento opcional.
 * @param {string} text - Texto completo a dividir.
 * @param {number} maxTokens - Tamaño máximo en tokens (aprox. 1 token = 4 caracteres).
 * @param {number} overlap - Cantidad de tokens de solapamiento entre chunks.
 * @returns {string[]} Array de fragmentos de texto.
 */
function chunkText(text, maxTokens = 200, overlap = 20) {
    const maxChars = maxTokens * 4;
    const overlapChars = overlap * 4;
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxChars;
        if (end >= text.length) {
            chunks.push(text.slice(start).trim());
            break;
        }

        // Intentar cortar en un espacio para no romper palabras
        const slice = text.slice(start, end);
        const lastSpace = slice.lastIndexOf(' ');
        if (lastSpace > maxChars - 100) {
            end = start + lastSpace;
        }

        chunks.push(text.slice(start, end).trim());
        start = Math.max(start, end - overlapChars);
    }

    return chunks.filter(c => c.length > 0);
}

module.exports = { chunkText };