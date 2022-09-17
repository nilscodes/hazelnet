const { formatEmoji } = require('discord.js');

module.exports = {
  makeOptionalEmojiMessageContent(id, name) {
    if (id && name) {
      return formatEmoji(id, false);
    }
    if (name) {
      return name;
    }
    return '';
  },
};
