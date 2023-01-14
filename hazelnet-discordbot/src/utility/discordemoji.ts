import { formatEmoji, Snowflake } from "discord.js";

export default {
  makeOptionalEmojiMessageContent(id: Snowflake, name: string) {
    if (id && name) {
      return formatEmoji(id, false);
    }
    if (name) {
      return name;
    }
    return '';
  },
};
