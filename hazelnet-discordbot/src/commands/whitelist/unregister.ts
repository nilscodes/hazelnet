import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { Whitelist, WhitelistSignupContainer } from '../../utility/sharedtypes';
import whitelistUtil from '../../utility/whitelist';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const useLocale = discordServer.getBotLanguage();
    try {
      const externalAccount = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.user.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id) as Whitelist[];
      const signups = (await whitelistUtil.getExistingSignups(externalAccount, whitelists, interaction)) as WhitelistSignupContainer[];
      const whitelistOptions = whitelists.filter((whitelist) => (signups.some((signup) => signup?.whitelistId === whitelist.id)))
        .map((whitelist) => ({ label: whitelist.displayName, value: whitelist.name }));
      if (whitelistOptions.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('whitelist/unregister/complete')
              .setPlaceholder(i18n.__({ phrase: 'whitelist.unregister.chooseWhitelist', locale: useLocale }))
              .addOptions(whitelistOptions),
          )];

        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.purpose', locale: useLocale }), 'whitelist-unregister');
        await interaction.editReply({ components, embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.noRegisteredWhitelists', locale: useLocale }), 'whitelist-unregister');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.otherError', locale: useLocale }), 'whitelist-unregister');
      await interaction.editReply({ embeds: [embed] });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'whitelist/unregister/complete') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        const whitelistName = interaction.values[0];
        const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id) as Whitelist[];
        const whitelistToUnregisterFrom = whitelists.find((whitelist) => whitelist.name === whitelistName);
        if (whitelistToUnregisterFrom) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          await interaction.client.services.discordserver.unregisterFromWhitelist(interaction.guild!.id, whitelistToUnregisterFrom.id, externalAccount.id);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.success', locale: useLocale }, { whitelist: whitelistToUnregisterFrom } as any), 'whitelist-unregister', [], whitelistToUnregisterFrom.logoUrl);
          await interaction.editReply({ components: [], embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.errorNotFound', locale: useLocale }, { whitelistName }), 'whitelist-unregister');
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whitelist.unregister.messageTitle', locale: useLocale }), i18n.__({ phrase: 'whitelist.unregister.otherError', locale: useLocale }), 'whitelist-unregister');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
