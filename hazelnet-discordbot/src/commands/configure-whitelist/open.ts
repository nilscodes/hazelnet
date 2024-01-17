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
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      const whitelistOptions = whitelists
        .filter((whitelist) => whitelist.closed)
        .map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-whitelist/open/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist open', i18n.__({ phrase: 'configure.whitelist.open.purpose', locale: useLocale }), 'configure-whitelist-open');
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist open', i18n.__({ phrase: 'configure.whitelist.open.noWhitelistsDetail', locale: useLocale }), 'configure-whitelist-open');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while closing whitelists on your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/open/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToOpen = interaction.values[0];
        const whitelistToOpen = whitelists.find((whitelist) => whitelist.name === whitelistNameToOpen);
        if (whitelistToOpen) {
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild!.id, whitelistToOpen.id, { closed: false });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist open', i18n.__({ phrase: 'configure.whitelist.open.success', locale: useLocale }, { whitelist } as any), 'configure-whitelist-open', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToOpen } as any),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist open', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToOpen }), 'configure-whitelist-open');
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist open', i18n.__({ phrase: 'configure.whitelist.open.otherError', locale: useLocale }), 'configure-whitelist-open');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
