const { MessageEmbed } = require('discord.js');

module.exports = {
  buildForUser(discordServer, title, message, fields, image) {
    const color = discordServer.settings?.THEME_COLOR_USER ?? '#fece07';
    const topLogo = discordServer.settings?.THEME_TOP_LOGO ?? 'https://www.hazelnet.io/static/media/hazelnet.e5b123ee.png';
    return this.build(discordServer, color, topLogo, title, message, fields, image);
  },
  buildForAdmin(discordServer, title, message, fields) {
    return this.build(discordServer, '#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, fields);
  },
  buildForAudit(discordServer, title, message, fields) {
    return this.build(discordServer, '#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, fields);
  },
  build(discordServer, color, thumbnail, title, message, fields, image) {
    const authorName = discordServer.settings?.THEME_AUTHOR_NAME ?? 'HAZELnet.io Bot';
    const authorIcon = discordServer.settings?.THEME_AUTHOR_ICON ?? 'https://www.hazelnet.io/static/media/hazelnet.e5b123ee.png';
    let footer;
    if (discordServer.settings?.THEME_FOOTER_TEXT) {
      footer = {
        text: discordServer.settings?.THEME_FOOTER_TEXT,
        iconURL: discordServer.settings?.THEME_FOOTER_ICON,
      };
    }

    return this.buildFullyCustom(color, thumbnail, title, message, fields, {
      name: authorName,
      iconURL: authorIcon,
    }, image, footer);
  },
  buildFullyCustom(color, thumbnail, title, message, fields, author, image, footer) {
    const baseEmbed = new MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setAuthor(author)
      .setDescription(message)
      .setThumbnail(thumbnail)
      .setTimestamp();
    if (image) {
      baseEmbed.setImage(image);
    }
    if (footer) {
      baseEmbed.setFooter(footer);
    }
    if (fields) {
      baseEmbed.addFields(fields);
    }
    return baseEmbed;
  },
};
