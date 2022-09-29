/* eslint-disable no-await-in-loop */
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  name: 'adminannouncements',
  async consume(client, adminAnnouncement) {
    try {
      const guild = await client.guilds.fetch(adminAnnouncement.guildId);
      if (guild) {
        if (adminAnnouncement.type === 'PREMIUM_REFILL') {
          await guild.members.fetch(); // Fetch users so they are present
          const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
          const locale = discordServer.getBotLanguage();
          const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
          adminRoleIds.forEach(async (adminRoleId) => {
            try {
              const guildRole = await guild.roles.fetch(adminRoleId);
              for (let i = 0; i < guildRole.members.size; i += 1) {
                const member = guildRole.members.at(i);
                try {
                  const embed = embedBuilder.buildForUser(
                    discordServer,
                    i18n.__({ phrase: 'configure.premium.refill.reminderTitle', locale }),
                    i18n.__({ phrase: 'configure.premium.refill.reminder', locale }, { tag: member.user.tag, guildName: guild.name }),
                    'configure-premium-refill',
                  );
                  await member.user.send({ embeds: [embed] });
                } catch (error) {
                  client.logger.error({ msg: `Failed sending premium refill message for ${adminRoleId} for ${discordServer.guildName} (${discordServer.guildId}) to user ${member.user.tag}`, error });
                }
              }
            } catch (error) {
              client.logger.error({ msg: `Failed fetching role ${adminRoleId} for ${discordServer.guildName} (${discordServer.guildId})`, error });
            }
          });
        }
      } else {
        client.logger.error({ guildId: adminAnnouncement.guildId, msg: 'Guild not found while publishing admin announcement' });
      }
    } catch (announceError) {
      client.logger.error({ guildId: adminAnnouncement.guildId, msg: 'Failed to publish admin announcement', error: announceError });
    }
  },
};
