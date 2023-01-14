export default {
  ensureLength(text: string, limit: number) {
    if (text.length > limit) {
      return `${text.substring(0, limit - 1)}…`;
    }
    return text;
  },
  escapeBackslashes(text: string) {
    return text.replace('\\', '\\\\');
  },
};
