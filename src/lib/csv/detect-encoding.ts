/** A decoded string containing the Unicode replacement character is a sign
 * the wrong text encoding was used (or the file was invalid to begin with). */
export function looksMojibake(text: string): boolean {
  return text.includes("�");
}
