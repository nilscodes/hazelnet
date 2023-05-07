import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  MessageActionRowComponentBuilder,
  SelectMenuBuilder,
} from 'discord.js';
import { stringify } from 'csv-stringify/sync';
import { Whitelist, SharedWhitelistSignup, SharedWhitelist } from '@vibrantnet/core';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

interface WhitelistDownloadCommand extends BotSubcommand {
  buildFileToDownload(whitelist: Whitelist | SharedWhitelist, signups: SharedWhitelistSignup[], guildId: string, whitelistName: string): AttachmentBuilder
  getCsvContent(whitelist: Whitelist | SharedWhitelist, signups: SharedWhitelistSignup[]): any[]
}

export default <WhitelistDownloadCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const localWhitelistOptions = whitelists.map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      const sharedWhitelists = (await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild!.id, false)).map((sharedWhitelist) => ({
        label: i18n.__({ phrase: 'configure.whitelist.download.externalWhitelist', locale }, {
          whitelistDisplayName: sharedWhitelist.whitelistDisplayName.substring(0, 40),
          guildName: sharedWhitelist.guildName.substring(0, 50),
        }),
        value: `${sharedWhitelist.guildId}-${sharedWhitelist.whitelistName}`,
      }));
      const whitelistOptions = [...localWhitelistOptions, ...sharedWhitelists];
      if (whitelistOptions.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-whitelist/download/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.purpose', locale }), 'configure-whitelist-download');
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.list.noWhitelistsDetail', locale }), 'configure-whitelist-download');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing whitelists from your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/download/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const whitelistNameToDownload = interaction.values[0];
        const whitelistToDownload = whitelists.find((whitelist) => whitelist.name === whitelistNameToDownload);
        if (whitelistToDownload) {
          const signups = await interaction.client.services.discordserver.getWhitelistSignups(interaction.guild!.id, whitelistToDownload.id);
          if (signups.length) {
            const fileToDownload = this.buildFileToDownload(whitelistToDownload, signups, discordServer.guildId, whitelistToDownload.name);

            const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToDownload);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.success', locale }, { whitelist: whitelistToDownload } as any), 'configure-whitelist-download', [
              {
                name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist: whitelistToDownload } as any),
                value: detailsPhrase,
              },
            ]);
            await interaction.editReply({
              components: [],
              embeds: [embed],
              files: [fileToDownload],
            });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorSignupsEmpty', locale }, { whitelist: whitelistToDownload } as any), 'configure-whitelist-download');
            await interaction.editReply({ components: [], embeds: [embed] });
          }
        } else {
          const [guildIdSharing, whitelistNameShared] = whitelistNameToDownload.split('-');
          const sharedWhitelists = await interaction.client.services.discordserver.getSharedWhitelists(interaction.guild!.id, true);
          const sharedWhitelistToDownload = sharedWhitelists.find((sharedWhitelist) => sharedWhitelist.guildId === guildIdSharing && sharedWhitelist.whitelistName === whitelistNameShared);
          if (sharedWhitelistToDownload) {
            if (sharedWhitelistToDownload.signups.length) {
              const fileToDownload = this.buildFileToDownload(sharedWhitelistToDownload, sharedWhitelistToDownload.signups, sharedWhitelistToDownload.guildId, sharedWhitelistToDownload.whitelistName);

              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.successExternal', locale }, sharedWhitelistToDownload as any), 'configure-whitelist-download');
              await interaction.editReply({
                components: [],
                embeds: [embed],
                files: [fileToDownload],
              });
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorSignupsEmpty', locale }, { whitelist: { displayName: sharedWhitelistToDownload.whitelistDisplayName } } as any), 'configure-whitelist-download');
              await interaction.editReply({ components: [], embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.errorNotFound', locale }, { whitelistName: whitelistNameToDownload }), 'configure-whitelist-download');
            await interaction.editReply({ components: [], embeds: [embed] });
          }
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist download', i18n.__({ phrase: 'configure.whitelist.download.otherError', locale }), 'configure-whitelist-download');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
  buildFileToDownload(whitelist, signups, guildId, whitelistName) {
    const csvList = this.getCsvContent(whitelist, signups);
    const csv = stringify(csvList);
    const csvBuffer = Buffer.from(csv, 'utf8');
    const fileToDownload = new AttachmentBuilder(csvBuffer, { name: `hazelnet-${guildId}-whitelist-${whitelistName}.csv` });
    fileToDownload.setDescription('HAZELnet Whitelist Signups Download');
    return fileToDownload;
  },
  getCsvContent(whitelist, signups) {
    if (whitelist.type !== 'CARDANO_ADDRESS') {
      return [['referenceId', 'referenceName', 'referenceType', 'signupTime'], ...signups.map((signup) => ([signup.referenceId, signup.referenceName, signup.referenceType, signup.signupTime]))];
    }
    return [['address', 'signupTime'], ...signups.map((signup) => ([signup.address, signup.signupTime]))];
  },
};
