import { ActionRowBuilder, APIEmbedField, ButtonBuilder, GuildMember, MessageActionRowComponentBuilder, SlashCommandBuilder, ButtonStyle } from 'discord.js';
import i18n from 'i18n';
import { AugmentedButtonInteraction } from '../utility/hazelnetclient';
import { BotCommand } from "../utility/commandtypes";
import giveawayutil, { Giveaway, ParticipationData, TokenMetadata } from '../utility/giveaway';
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');
const embedBuilder = require('../utility/embedbuilder');

type FieldsAndComponents = {
  detailFields: APIEmbedField[]
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

interface JoinCommand extends BotCommand {
  getGiveawayDetails(giveaway: Giveaway, interaction: AugmentedButtonInteraction, discordServer: any, member: GuildMember, participationOfUser: ParticipationData): Promise<FieldsAndComponents>
  getUserParticipationText(discordServer: any, giveaway: Giveaway, totalVotingPower: number, tokenMetadata: TokenMetadata): string
}

export default <JoinCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('join', locale);
    const builder = new SlashCommandBuilder();
    builder.setName('join')
      .setDescription(ci18n.description());
    return builder;
  },
  commandTags: ['join'],
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    // empty since command currently cannot be called directly and only contains widget logic
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const locale = discordServer.getBotLanguage();
    const giveawayId = +(interaction.customId.split('/')[2]);
    const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id) as Giveaway[];
    const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
    if (giveaway) {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      if (giveawayutil.userCanSeeGiveaway(member, giveaway)) {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
        if (interaction.customId.indexOf('join/widgetjoin') === 0) {
          const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id) as ParticipationData;
          let phrase = 'join.giveawayInfoTitle';
          if (participationOfUser.participants === 0 && participationOfUser.totalEntries > 0) {
            await interaction.client.services.discordserver.participateAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
            participationOfUser.participants = 1;
            phrase = 'join.success';
          }
          const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
          const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase, locale }), 'join', detailFields);
          await interaction.reply({ embeds: [embed], components, ephemeral: true });
        } else if (interaction.customId.indexOf('join/removeentry') === 0) {
          await interaction.client.services.discordserver.removeParticipationAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
          const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id) as ParticipationData;
          const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
          const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.successRemoval', locale }), 'join', detailFields);
          await interaction.update({ embeds: [embed], components });
        } else if (interaction.customId.indexOf('join/addentry') === 0) {
          await interaction.client.services.discordserver.participateAsUser(interaction.guild!.id, giveaway.id, externalAccount.id);
          const participationOfUser = await interaction.client.services.discordserver.getParticipationOfUser(interaction.guild!.id, giveaway.id, externalAccount.id) as ParticipationData;
          const { detailFields, components } = await this.getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser);
          const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.success', locale }), 'join', detailFields);
          await interaction.update({ embeds: [embed], components });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'join.errorNotEligible', locale }), 'join');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
  async getGiveawayDetails(giveaway, interaction, discordServer, member, participationOfUser) {
    const locale = discordServer.getBotLanguage();
    const tokenMetadata = await giveawayutil.getTokenMetadataFromRegistry(interaction.guild!.id, giveaway, interaction.client);
    const participation = await interaction.client.services.discordserver.getParticipationForGiveaway(interaction.guild!.id, giveaway.id);
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.giveaway.list.detailsDescription', locale }),
        value: giveaway.description.trim().length ? giveaway.description.trim() : i18n.__({ phrase: 'configure.giveaway.list.detailsDescriptionEmpty', locale }),
      },
    ];

    giveawayutil.augmentGiveawayDates(giveaway, detailFields, locale);
    giveawayutil.augmentGiveawayOptions(giveaway, detailFields, locale);
    giveawayutil.augmentRequiredRoles(giveaway, detailFields, locale);
    giveawayutil.augmentCurrentParticipation(giveaway, detailFields, discordServer, participation, tokenMetadata);

    const totalEntriesForUser = participationOfUser.totalEntries;
    detailFields.push({
      name: i18n.__({ phrase: 'join.yourEntryWeight', locale }),
      value: this.getUserParticipationText(discordServer, giveaway, totalEntriesForUser, tokenMetadata),
    });
    let components = [];
    if (giveawayutil.userCanParticipateInGiveaway(member, giveaway, totalEntriesForUser)) {
      const hasVoted = participationOfUser.participants > 0;
      if (hasVoted) {
        const decimals = (giveaway.weighted && tokenMetadata?.decimals?.value) || 0;
        const formattedTotalEntriesForUser = discordServer.formatNumber(giveawayutil.calculateParticipationCountNumber(totalEntriesForUser, decimals));
        detailFields.push({
          name: i18n.__({ phrase: 'join.yourEntry', locale }),
          value: i18n.__({ phrase: 'join.yourEntryDetails', locale }, { entries: formattedTotalEntriesForUser }),
        });
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`join/removeentry/${giveaway.id}`)
            .setLabel(i18n.__({ phrase: 'join.removeEntry', locale }))
            .setStyle(ButtonStyle.Danger)
        ));
      } else {
        detailFields.push({
          name: i18n.__({ phrase: 'join.yourEntry', locale }),
          value: i18n.__({ phrase: 'join.yourEntryMissing', locale }),
        });
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`join/addentry/${giveaway.id}`)
            .setLabel(i18n.__({ phrase: 'join.addEntry', locale }))
            .setStyle(ButtonStyle.Primary)
        ));
      }
    }
    return { detailFields, components };
  },
  getUserParticipationText(discordServer, giveaway, totalEntries, tokenMetadata) {
    const locale = discordServer.getBotLanguage();
    if (giveaway.snapshotIds.length) {
      const decimals = (giveaway.weighted && tokenMetadata?.decimals?.value) || 0;
      const unit = giveaway.weighted && tokenMetadata?.ticker?.value ? ` ${tokenMetadata.ticker.value}` : '';
      if (totalEntries > 0) {
        const formattedTotalEntries = discordServer.formatNumber(giveawayutil.calculateParticipationCountNumber(totalEntries, decimals));
        return `${totalEntries > 1 ? i18n.__({ phrase: 'join.totalEntriesMultiple', locale }, { totalEntries: formattedTotalEntries, unit }) : i18n.__({ phrase: 'join.totalEntriesSingleToken', locale })}\n\n${i18n.__({ phrase: 'join.totalEntriesTokenInfo', locale })}`;
      }
      return `${i18n.__({ phrase: 'join.totalEntriesNone', locale })}\n\n${i18n.__({ phrase: 'join.totalEntriesTokenInfo', locale })}`;
    }
    return i18n.__({ phrase: 'join.totalEntriesSingleNoToken', locale });
  },
};
