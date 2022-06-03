const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const guildNameMap = await whitelistUtil.getGuildNames(discordServer, interaction);
      const whitelistOptions = discordServer.whitelists
        .filter((whitelist) => whitelist.sharedWithServer > 0)
        .map((whitelist) => {
          const guildName = guildNameMap[whitelist.sharedWithServer];
          return {
            label: i18n.__({ phrase: 'configure.whitelist.unshare.selectServer', locale }, { whitelist, guildName }),
            value: whitelist.name,
          };
        });
      if (whitelistOptions.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-whitelist/unshare/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist unshare', i18n.__({ phrase: 'configure.whitelist.unshare.purpose', locale }), 'configure-whitelist-unshare');
        await interaction.editReply({ components, embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist unshare', i18n.__({ phrase: 'configure.whitelist.unshare.noWhitelistsDetail', locale }), 'configure-whitelist-unshare');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while unsharing whitelists on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/unshare/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToUnshare = interaction.values[0];
        const whitelistToUnshare = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToUnshare);
        if (whitelistToUnshare) {
          const discordServerToUnshareWith = await interaction.client.services.discordserver.getDiscordServerByInternalId(whitelistToUnshare.sharedWithServer);
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild.id, whitelistToUnshare.id, { sharedWithServer: 0 });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist unshare', i18n.__({ phrase: 'configure.whitelist.unshare.success', locale: useLocale }, { whitelist, discordServerToUnshareWith }), 'configure-whitelist-unshare', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToUnshare }),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist unshare', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToUnshare }), 'configure-whitelist-unshare');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: '/configure-whitelist unshare', locale: useLocale }), i18n.__({ phrase: 'configure.whitelist.unshare.otherError', locale: useLocale }), 'configure-whitelist-unshare');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
