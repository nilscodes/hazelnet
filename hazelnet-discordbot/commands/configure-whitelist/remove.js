const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    const whitelistNameToRemove = interaction.options.getString('whitelist-name');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const whitelistOptions = discordServer.whitelists.map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-whitelist/remove/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.purpose', locale: useLocale }));
        await interaction.editReply({ components, embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.list.noWhitelistsDetail', locale: useLocale }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${whitelistNameToRemove} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/remove/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToRemove = interaction.values[0];
        const whitelistToRemove = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToRemove);
        if (whitelistToRemove) {
          await interaction.client.services.discordserver.deleteWhitelist(interaction.guild.id, whitelistToRemove.id);

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToRemove);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.success', locale: useLocale }), [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToRemove }),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToRemove }));
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.otherError', locale: useLocale }));
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
