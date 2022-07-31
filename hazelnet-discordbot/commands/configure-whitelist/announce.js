const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
        const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
        if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL')) {
          const whitelistOptions = discordServer.whitelists
            .filter((whitelist) => !whitelist.closed)
            .map((whitelist) => ({ label: whitelist.displayName, value: `${announceChannel.id}-${whitelist.id}` }));
          if (whitelistOptions.length) {
            const components = [new MessageActionRow()
              .addComponents(
                new MessageSelectMenu()
                  .setCustomId('configure-whitelist/announce/publish')
                  .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
                  .addOptions(whitelistOptions),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.purpose', locale }), 'configure-whitelist-announce');
            await interaction.editReply({ components, embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.noWhitelistsDetail', locale }), 'configure-whitelist-open');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorWrongChannelType', locale }), 'configure-whitelist-announce');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting whitelist list to announce. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/announce/publish') {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const [announceChannelId, whitelistId] = interaction.values[0].split('-');
      const whitelistToAnnounce = discordServer.whitelists.find((whitelist) => whitelist.id === +whitelistId);
      if (whitelistToAnnounce) {
        const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToAnnounce, true);
        const detailFields = [
          {
            name: whitelistToAnnounce.displayName,
            value: detailsPhrase,
          },
        ];
        const components = whitelistUtil.getSignupComponents(discordServer, whitelistToAnnounce);
        try {
          const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
          const successText = i18n.__({ phrase: `configure.whitelist.announce.${whitelistToAnnounce.type === 'CARDANO_ADDRESS' ? 'publicSuccess' : 'publicSuccessNoAddress'}`, locale });
          const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.whitelist.announce.publicSuccessTitle', locale }), successText, 'whitelist-register', detailFields, whitelistToAnnounce.logoUrl);
          await announceChannel.send({ embeds: [embedPublic], components });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.success', locale }, { channel: announceChannelId }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        } catch (sendError) {
          interaction.client.logger.info(sendError);
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist announce', i18n.__({ phrase: 'configure.whitelist.announce.errorNoSendPermissions', locale }, { channel: announceChannelId }), 'configure-whitelist-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      }
    }
  },
};
