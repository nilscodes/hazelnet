const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const protectionRegex1 = /addr1/i;
    const isSentByHazelnet = message.author.id === message.client.application.id;
    if (message.content && !isSentByHazelnet && (
      protectionRegex1.test(message.content)
    )) {
      try {
        const discordServer = await message.client.services.discordserver.getDiscordServer(message.guildId);
        if (discordServer?.settings?.PROTECTION_ADDR_REMOVAL === 'true') {
          if (discordServer?.settings?.PROTECTION_AUDIT_CHANNEL !== '') {
            const channel = await message.guild.channels.fetch(discordServer.settings.PROTECTION_AUDIT_CHANNEL);
            if (channel) {
              const useLocale = discordServer.getBotLanguage();

              const embed = embedBuilder.buildForAudit(
                discordServer,
                i18n.__({ phrase: 'configure.protection.auditchannel.auditEventTitle', locale: useLocale }),
                i18n.__({ phrase: 'configure.protection.auditchannel.auditEventDetail', locale: useLocale }, { author: message.author.id, channel: message.channel.id, message: message.content }),
              );
              await channel.send({ embeds: [embed] });
            }
          }
          await message.delete();
        }
      } catch (error) {
        message.client.logger.error(error);
      }
    }
  },
};
