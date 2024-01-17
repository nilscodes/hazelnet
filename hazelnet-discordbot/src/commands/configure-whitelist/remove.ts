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
      const whitelistOptions = whitelists.map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-whitelist/remove/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.purpose', locale: useLocale }), 'configure-whitelist-remove');
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.list.noWhitelistsDetail', locale: useLocale }), 'configure-whitelist-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing whitelists from your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/remove/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistNameToRemove = interaction.values[0];
        const whitelistToRemove = whitelists.find((whitelist) => whitelist.name === whitelistNameToRemove);
        if (whitelistToRemove) {
          await interaction.client.services.discordserver.deleteWhitelist(interaction.guild!.id, whitelistToRemove.id);

          const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelistToRemove);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.success', locale: useLocale }), 'configure-whitelist-remove', [
            {
              name: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale: useLocale }, { whitelist: whitelistToRemove } as any),
              value: detailsPhrase,
            },
          ]);
          await interaction.editReply({ components: [], embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.errorNotFound', locale: useLocale }, { whitelistName: whitelistNameToRemove }), 'configure-whitelist-remove');
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist remove', i18n.__({ phrase: 'configure.whitelist.remove.otherError', locale: useLocale }), 'configure-whitelist-remove');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
