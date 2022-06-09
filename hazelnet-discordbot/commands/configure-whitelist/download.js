const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu, MessageAttachment } = require('discord.js');
const csvStringify = require('csv-stringify/sync');
const embedBuilder = require('../../utility/embedbuilder');
const whitelistUtil = require('../../utility/whitelist');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const whitelistOptions = discordServer.whitelists.map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-whitelist/download/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.purpose', locale: useLocale }), 'configure-whitelist-download');
        await interaction.editReply({ components, embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.list.noWhitelistsDetail', locale: useLocale }), 'configure-whitelist-download');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing whitelists from your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/download/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToDownload = interaction.values[0];
        const whitelistToDownload = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToDownload);
        if (whitelistToDownload) {
          const signups = await interaction.client.services.discordserver.getWhitelistSignups(interaction.guild.id, whitelistToDownload.id);
          if (signups.length) {
            const csvList = [['address', 'signupTime'], ...signups.map((signup) => ([signup.address, signup.signupTime]))];
            const csv = csvStringify.stringify(csvList);
            const csvBuffer = Buffer.from(csv, 'utf8');
            const fileToDownload = new MessageAttachment(csvBuffer, `hazelnet-${discordServer.guildId}-whitelist-${whitelistToDownload.name}.csv`);
            fileToDownload.setDescription('Cool download bro');

            const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToDownload);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.success', locale: useLocale }, { whitelist: whitelistToDownload }), 'configure-whitelist-download', [
              {
                name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToDownload }),
                value: detailsPhrase,
              },
            ]);
            await interaction.editReply({
              components: [],
              embeds: [embed],
              files: [fileToDownload],
              ephemeral: true,
            });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorSignupsEmpty', locale: useLocale }, { whitelist: whitelistToDownload }), 'configure-whitelist-download');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.list.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToDownload }), 'configure-whitelist-download');
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.otherError', locale: useLocale }), 'configure-whitelist-download');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
