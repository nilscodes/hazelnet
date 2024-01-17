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
      const locale = discordServer.getBotLanguage();
      const whitelistOptions = whitelists
        .filter((whitelist) => !whitelist.closed)
        .map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-whitelist/close/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.purpose', locale }), 'configure-whitelist-close');
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.noWhitelistsDetail', locale }), 'configure-whitelist-close');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while closing whitelists on your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/close/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToClose = interaction.values[0];
        const whitelistToClose = whitelists.find((whitelist) => whitelist.name === whitelistNameToClose);
        if (whitelistToClose) {
          const whitelist = await interaction.client.services.discordserver.updateWhitelist(interaction.guild!.id, whitelistToClose.id, { closed: true });

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.success', locale: useLocale }, { whitelist } as any), 'configure-whitelist-close', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToClose } as any),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToClose }), 'configure-whitelist-close');
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist close', i18n.__({ phrase: 'configure.whitelist.close.otherError', locale: useLocale }), 'configure-whitelist-close');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
