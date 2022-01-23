const { MessageEmbed } = require('discord.js');

module.exports = {
  buildForUser(discordServer, title, message, fields) {
    return this.build('#fece07', 'https://www.hazelnet.io/static/media/hazelnet.e5b123ee.png', title, message, fields);
  },
  buildForAdmin(discordServer, title, message, fields) {
    return this.build('#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, fields);
  },
  buildForAudit(discordServer, title, message, fields) {
    return this.build('#ee3323', 'http://info.hazelpool.com/hazelnet-admin.png', title, message, fields);
  },
  build(color, thumbnail, title, message, fields) {
    return this.buildFullyCustom(color, thumbnail, title, message, fields, {
      name: 'HAZELnet.io Bot',
      iconURL: 'https://www.hazelnet.io/static/media/hazelnet.e5b123ee.png',
      url: 'https://www.hazelnet.io',
    });
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
