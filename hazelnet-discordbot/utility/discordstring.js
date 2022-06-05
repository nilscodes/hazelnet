module.exports = {
  ensureLength(text, limit) {
    if (text.length > limit) {
      return `${text.substring(0, limit - 1)}…`;
    }
    return text;
  },
};
