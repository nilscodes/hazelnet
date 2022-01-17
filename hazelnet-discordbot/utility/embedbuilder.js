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
    const baseEmbed = new MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setAuthor({
        name: 'HAZELnet.io Bot',
        iconURL: 'https://www.hazelnet.io/static/media/hazelnet.e5b123ee.png',
        url: 'https://www.hazelnet.io',
      })
      .setDescription(message)
      .setThumbnail(thumbnail)
      .setTimestamp();
      /*
      .setFooter({
        text: 'Some footer text here',
        iconURL: 'https://i.imgur.com/AfFp7pu.png',
      }); */
    if (fields) {
      baseEmbed.addFields(fields);
    }
    return baseEmbed;
  },
};
