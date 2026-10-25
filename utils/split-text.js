/**
 * Split text into chunks whose UTF-16 length does not exceed `maxLength`,
 * without breaking surrogate pairs.
 * @param {string} text
 * @param {number} maxLength
 * @returns {Array<string>}
 */
const splitText = (text, maxLength) => {
  const chunks = [];
  let chunk = '';
  Array.from(text).forEach((char) => {
    if (chunk.length + char.length > maxLength) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += char;
  });
  if (chunk) chunks.push(chunk);
  return chunks;
};

export default splitText;
