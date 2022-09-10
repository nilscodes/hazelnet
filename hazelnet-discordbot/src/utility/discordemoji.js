module.exports = {
  makeOptionalEmojiMessageContent(id, name) {
    if (id && name) {
      return `<:${name}:${id}>`;
    }
    if (name) {
      return name;
    }
    return '';
  },
};
