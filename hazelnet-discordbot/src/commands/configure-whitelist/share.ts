import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import {
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  SelectMenuBuilder,
} from 'discord.js';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const guildToShareWith = interaction.options.getString('guild-id', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const discordServerToShareWith = await interaction.client.services.discordserver.getDiscordServer(guildToShareWith);
        if (discordServerToShareWith.id !== discordServer.id) {
          const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
          const whitelistOptions = whitelists
            .map((whitelist) => ({ label: whitelist.displayName, value: `${whitelist.name}-${discordServerToShareWith.guildId}` }));
          if (whitelistOptions.length) {
            const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(
                new SelectMenuBuilder()
                  .setCustomId('configure-whitelist/share/complete')
                  .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
                  .addOptions(whitelistOptions),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.purpose', locale }, { discordServerToShareWith } as any), 'configure-whitelist-share');
            await interaction.editReply({ components, embeds: [embed] });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.noWhitelistsDetail', locale }), 'configure-whitelist-share');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.errorShareWithSelf', locale }), 'configure-whitelist-share');
          await interaction.editReply({ embeds: [embed] });
        }
      } catch (discordServerNotFoundError) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.errorGuildNotFound', locale }, { guildToShareWith } as any), 'configure-whitelist-share');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while sharing whitelists on your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/share/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const [whitelistNameToShare, sharedWithGuild] = interaction.values[0].split('-');
        const whitelistToShare = whitelists.find((whitelist) => whitelist.name === whitelistNameToShare);
        if (whitelistToShare) {
          const discordServerToShareWith = await interaction.client.services.discordserver.getDiscordServer(sharedWithGuild);
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild!.id, whitelistToShare.id, { sharedWithServer: discordServerToShareWith.id });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.share.success', locale: useLocale }, { whitelist, discordServerToShareWith } as any), 'configure-whitelist-share', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToShare } as any),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist share', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToShare }), 'configure-whitelist-share');
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: '/configure-whitelist share', locale: useLocale }), i18n.__({ phrase: 'configure.whitelist.share.otherError', locale: useLocale }), 'configure-whitelist-share');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
