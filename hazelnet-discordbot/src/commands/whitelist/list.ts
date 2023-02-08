import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { DiscordServer, SummarizedWhitelistSignup, Whitelist, WhitelistSignupContainer } from '../../utility/sharedtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction } from '../../utility/hazelnetclient';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

interface WhitelistSendCommand extends BotSubcommand {
  getWhitelists(discordServer: DiscordServer, whitelists: Whitelist[], interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, signups: (WhitelistSignupContainer | undefined)[], includeAddresses: boolean): Promise<APIEmbedField[]>
}

export default <WhitelistSendCommand> {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const signups = await whitelistUtil.getExistingSignups(externalAccount, whitelists, interaction);
      const whitelistFields = await this.getWhitelists(discordServer, whitelists, interaction, signups, false);
      const components = [];
      if (signups.length) {
        components.push(
          new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('whitelist/list/withaddress')
                .setLabel(i18n.__({ phrase: 'whitelist.list.showWithAddresses', locale }))
                .setStyle(ButtonStyle.Primary),
            ),
        );
      }
      if (!whitelistFields.length) {
        whitelistFields.push({ name: i18n.__({ phrase: 'whitelist.list.noWhitelistsTitle', locale }), value: i18n.__({ phrase: 'whitelist.list.noWhitelistsDetail', locale }) });
      }
      const whitelistsFromAllServers = await interaction.client.services.externalaccounts.getExternalAccountWhitelists(externalAccount.id) as SummarizedWhitelistSignup[];
      const whitelistsFromOtherServers = whitelistsFromAllServers.filter((whitelistSummary) => whitelistSummary.guildId !== discordServer.guildId);
      if (whitelistsFromOtherServers.length) {
        whitelistFields.push({
          name: i18n.__({ phrase: 'whitelist.list.externalWhitelists', locale }),
          value: `${i18n.__({ phrase: 'whitelist.list.externalWhitelistsDetail', locale })}\n\n${whitelistsFromOtherServers.map((whitelistSummary) => {
            const launchDateText = whitelistSummary.launchDate ? i18n.__({ phrase: 'whitelist.list.launchDateText', locale }, {
              launchDateTimestamp: Math.floor(new Date(whitelistSummary.launchDate).getTime() / 1000),
            } as any) : '';
            return i18n.__({ phrase: 'whitelist.list.externalWhitelistsEntry', locale }, {
              ...whitelistSummary,
              launchDateText,
            });
          }).join('\n')}`,
        });
      }
      const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'whitelist.list.messageTitle', locale }), i18n.__({ phrase: 'whitelist.list.purpose', locale }), 'whitelist-list', whitelistFields);
      await interaction.editReply({ components, embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official whitelists. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async getWhitelists(discordServer, whitelists, interaction, signups, includeAddresses) {
    const whitelistFieldsPromise = whitelists.map(async (whitelist) => {
      const detailsPhrase = whitelistUtil.getDetailsText(discordServer, whitelist);
      const existingSignup = signups.find((signup) => signup?.whitelistId === whitelist.id);
      const qualifyText = await whitelistUtil.getQualifyText(interaction, discordServer, whitelist, existingSignup?.signup, includeAddresses);
      return {
        name: whitelist.displayName,
        value: `${detailsPhrase}${qualifyText}`,
      };
    });
    const whitelistFields = await Promise.all(whitelistFieldsPromise);
    return whitelistFields;
  },
  async executeButton(interaction) {
    if (interaction.customId === 'whitelist/list/withaddress') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const signups = await whitelistUtil.getExistingSignups(externalAccount, whitelists, interaction);
      const whitelistFields = await this.getWhitelists(discordServer, whitelists, interaction, signups, true);
      const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'whitelist.list.messageTitle', locale }), i18n.__({ phrase: 'whitelist.list.purpose', locale }), 'whitelist-list', whitelistFields);
      await interaction.update({ components: [], embeds: [embed] });
    }
  },
};
