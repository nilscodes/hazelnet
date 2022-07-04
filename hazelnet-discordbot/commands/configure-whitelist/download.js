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
      const locale = discordServer.getBotLanguage();
      const localWhitelistOptions = discordServer.whitelists.map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      const sharedWhitelists = (await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild.id)).map((sharedWhitelist) => ({
        label: i18n.__({ phrase: 'configure.whitelist.download.externalWhitelist', locale }, {
          whitelistDisplayName: sharedWhitelist.whitelistDisplayName.substr(0, 40),
          guildName: sharedWhitelist.guildName.substr(0, 50),
        }),
        value: `${sharedWhitelist.guildId}-${sharedWhitelist.whitelistName}`,
      }));
      const whitelistOptions = [...localWhitelistOptions, ...sharedWhitelists];
      if (whitelistOptions.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-whitelist/download/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.purpose', locale }), 'configure-whitelist-download');
        await interaction.editReply({ components, embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.list.noWhitelistsDetail', locale }), 'configure-whitelist-download');
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
      const locale = discordServer.getBotLanguage();
      try {
        const whitelistNameToDownload = interaction.values[0];
        const whitelistToDownload = discordServer.whitelists.find((whitelist) => whitelist.name === whitelistNameToDownload);
        if (whitelistToDownload) {
          const signups = await interaction.client.services.discordserver.getWhitelistSignups(interaction.guild.id, whitelistToDownload.id);
          if (signups.length) {
            const fileToDownload = this.buildFileToDownload(signups, discordServer.guildId, whitelistToDownload.name);

            const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToDownload);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.success', locale }, { whitelist: whitelistToDownload }), 'configure-whitelist-download', [
              {
                name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist: whitelistToDownload }),
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
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorSignupsEmpty', locale }, { whitelist: whitelistToDownload }), 'configure-whitelist-download');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          }
        } else {
          const [guildIdSharing, whitelistNameShared] = whitelistNameToDownload.split('-');
          const sharedWhitelists = await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild.id, true);
          const sharedWhitelistToDownload = sharedWhitelists.find((sharedWhitelist) => sharedWhitelist.guildId === guildIdSharing && sharedWhitelist.whitelistName === whitelistNameShared);
          if (sharedWhitelistToDownload) {
            if (sharedWhitelistToDownload.signups.length) {
              const fileToDownload = this.buildFileToDownload(sharedWhitelistToDownload.signups, sharedWhitelistToDownload.guildId, sharedWhitelistToDownload.whitelistName);

              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.successExternal', locale }, sharedWhitelistToDownload), 'configure-whitelist-download');
              await interaction.editReply({
                components: [],
                embeds: [embed],
                files: [fileToDownload],
                ephemeral: true,
              });
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorSignupsEmpty', locale }, { whitelist: { displayName: sharedWhitelistToDownload.whitelistDisplayName } }), 'configure-whitelist-download');
              await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorNotFound', locale }, { whitelistName: whitelistNameToDownload }), 'configure-whitelist-download');
            await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
          }
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.otherError', locale }), 'configure-whitelist-download');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
  buildFileToDownload(signups, guildId, whitelistName) {
    const csvList = [['address', 'signupTime'], ...signups.map((signup) => ([signup.address, signup.signupTime]))];
    const csv = csvStringify.stringify(csvList);
    const csvBuffer = Buffer.from(csv, 'utf8');
    const fileToDownload = new MessageAttachment(csvBuffer, `hazelnet-${guildId}-whitelist-${whitelistName}.csv`);
    fileToDownload.setDescription('HAZELnet Whitelist Signups Download');
    return fileToDownload;
  },
};
