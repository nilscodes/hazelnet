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
        if (discordServer.settings && discordServer.settings.PROTECTION_ADDR_REMOVAL === 'true') {
          if (discordServer.settings.PROTECTION_AUDIT_CHANNEL && discordServer.settings.PROTECTION_AUDIT_CHANNEL !== '') {
            const channel = await message.guild.channels.fetch(discordServer.settings.PROTECTION_AUDIT_CHANNEL);
            if (channel) {
              await channel.send(`User ${message.author.tag} sent a suspicious message to channel #${message.channel.name} with content "${message.content}"`);
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
