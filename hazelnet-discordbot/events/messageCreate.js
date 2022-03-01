const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const isSentByHazelnet = message.author.id === message.client.application.id;
    if (!isSentByHazelnet) {
      if (message.channel.type === 'DM') {
        const claimCommand = message.client.commands.get('claim');
        await claimCommand.processDirectMessage(message);
      } else {
        const protectionRegex1 = /addr1/i;
        if (message.content && (
          protectionRegex1.test(message.content)
        )) {
          try {
            const discordServer = await message.client.services.discordserver.getDiscordServer(message.guildId);
            if (discordServer?.settings?.PROTECTION_ADDR_REMOVAL === 'true') {
              if (discordServer?.settings?.PROTECTION_AUDIT_CHANNEL !== '') {
                const channel = await message.guild.channels.fetch(discordServer.settings.PROTECTION_AUDIT_CHANNEL);
                if (channel && channel.send) {
                  const useLocale = discordServer.getBotLanguage();

                  const embed = embedBuilder.buildForAudit(
                    discordServer,
                    i18n.__({ phrase: 'configure.protection.auditchannel.auditEventTitle', locale: useLocale }),
                    i18n.__({ phrase: 'configure.protection.auditchannel.auditEventDetail', locale: useLocale }, { author: message.author.id, channel: message.channel.id, message: message.content }),
                    'configure-protection-auditchannel',
                  );
                  await channel.send({ embeds: [embed] });
                } else {
                  message.client.logger.warn(`Server ${discordServer.guildId} does not have a valid audit channel configured with ${discordServer.settings.PROTECTION_AUDIT_CHANNEL}`);
                }
              }
              await message.delete();
            }
          } catch (error) {
            message.client.logger.error(error);
          }
        }
      }
    }
  },
};
