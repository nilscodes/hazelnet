const i18n = require('i18n');
const { ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const guildToShareWith = interaction.options.getString('guild-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const discordServerToShareWith = await interaction.client.services.discordserver.getDiscordServer(guildToShareWith);
        if (discordServerToShareWith.id !== discordServer.id) {
          const whitelistOptions = discordServer.whitelists
            .map((whitelist) => ({ label: whitelist.displayName, value: `${whitelist.name}-${discordServerToShareWith.guildId}` }));
          if (whitelistOptions.length) {
            const components = [new ActionRowBuilder()
              .addComponents(
                new SelectMenuBuilder()
                  .setCustomId('configure-whitelist/share/complete')
                  .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
                  .addOptions(whitelistOptions),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.purpose', locale }, { discordServerToShareWith }), 'configure-whitelist-share');
            await interaction.editReply({ components, embeds: [embed], ephemeral: true });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.noWhitelistsDetail', locale }), 'configure-whitelist-share');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.errorShareWithSelf', locale }), 'configure-whitelist-share');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } catch (discordServerNotFoundError) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.errorGuildNotFound', locale }, { guildToShareWith }), 'configure-whitelist-share');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while sharing whitelists on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/share/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const [whitelistNameToShare, sharedWithGuild] = interaction.values[0].split('-');
        const whitelistToShare = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToShare);
        if (whitelistToShare) {
          const discordServerToShareWith = await interaction.client.services.discordserver.getDiscordServer(sharedWithGuild);
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild.id, whitelistToShare.id, { sharedWithServer: discordServerToShareWith.id });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.success', locale: useLocale }, { whitelist, discordServerToShareWith }), 'configure-whitelist-share', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToShare }),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToShare }), 'configure-whitelist-share');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: '/configure-whitelist share', locale: useLocale }), i18n.__({ phrase: 'configure.whitelist.share.otherError', locale: useLocale }), 'configure-whitelist-share');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
