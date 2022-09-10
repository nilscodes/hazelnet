const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const whitelistOptions = discordServer.whitelists
        .filter((whitelist) => !whitelist.closed)
        .map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-whitelist/close/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.purpose', locale: useLocale }), 'configure-whitelist-close');
        await interaction.editReply({ components, embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.noWhitelistsDetail', locale: useLocale }), 'configure-whitelist-close');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while closing whitelists on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/close/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToClose = interaction.values[0];
        const whitelistToClose = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToClose);
        if (whitelistToClose) {
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild.id, whitelistToClose.id, { closed: true });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.success', locale: useLocale }, { whitelist }), 'configure-whitelist-close', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToClose }),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToClose }), 'configure-whitelist-close');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.otherError', locale: useLocale }), 'configure-whitelist-close');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
