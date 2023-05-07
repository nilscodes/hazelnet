import { ActionRowBuilder, ButtonBuilder, MessageActionRowComponentBuilder, ButtonStyle, GuildTextBasedChannel } from "discord.js"
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import giveawayutil from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';
import { Giveaway, GiveawayDrawType } from '@vibrantnet/core';

interface GiveawayEndCommand extends BotSubcommand {
  createRedrawButton(giveaway: Giveaway, locale: string): ButtonBuilder
  createPublishButton(giveaway: Giveaway, locale: string): ButtonBuilder
}

export default <GiveawayEndCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id) ;
      const { giveawayFields, components } = giveawayutil.getDiscordGiveawayListParts(discordServer, giveaways, 'configure-giveaway/end/draw', 'configure.giveaway.end.chooseGiveawayDetails');
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.purpose', locale }), 'configure-giveaway-end', giveawayFields);
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while ending giveaway. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-giveaway/end/draw') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveawayId = +interaction.values[0].substring(19);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id) ;
      const giveaway = giveaways.find((giveawayForDraw) => giveawayForDraw.id === giveawayId);
      if (giveaway) {
        const existingWinners = await interaction.client.services.discordserver.getWinnerList(interaction.guild!.id, giveaway.id);
        const detailFields = giveawayutil.getGiveawayDetails(locale, giveaway);
        const components = [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(this.createRedrawButton(giveaway, locale))
        ];
        if (giveaway.channelId && giveaway.messageId && giveaway.drawType === GiveawayDrawType.DISCORD_ID) {
          components[0].addComponents(this.createPublishButton(giveaway, locale));
        }
        const firstChunkSize = detailFields.length + 1;
        const chunkSize = giveaway.drawType == GiveawayDrawType.CARDANO_ADDRESS ? 4 : 10;
        if (existingWinners === null) {
          try {
            const winners = await interaction.client.services.discordserver.drawWinners(interaction.guild!.id, giveaway.id);
            const winnerFields = await giveawayutil.getWinnerInfo(giveaway, locale, winners, interaction.guild!);
            detailFields.push(...winnerFields);
            const firstWinnerFields = detailFields.splice(0, firstChunkSize);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.success', locale }, giveaway as any), 'configure-giveaway-end', firstWinnerFields);
            await interaction.editReply({ embeds: [embed], components });
            while (detailFields.length) {
              const additionalWinnerFields = detailFields.splice(0, chunkSize);
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.success', locale }, giveaway as any), 'configure-giveaway-end', additionalWinnerFields);
              await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
          } catch (e) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.errorDraw', locale }, giveaway as any), 'configure-giveaway-end');
            await interaction.editReply({ embeds: [embed], components: [] });
          }
        } else {
          const winnerFields = await giveawayutil.getWinnerInfo(giveaway, locale, existingWinners, interaction.guild!, false);
          detailFields.push(...winnerFields);
          const firstWinnerFields = detailFields.splice(0, firstChunkSize);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.redrawWarning', locale }, giveaway as any), 'configure-giveaway-end', firstWinnerFields);
          await interaction.editReply({ embeds: [embed], components });
          while (detailFields.length) {
            const additionalWinnerFields = detailFields.splice(0, chunkSize);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.redrawWarning', locale }, giveaway as any), 'configure-giveaway-end', additionalWinnerFields);
            await interaction.followUp({ embeds: [embed], ephemeral: true });
          }
        }
      }
    }
  },
  async executeButton(interaction) {
    await interaction.deferUpdate();
    const guild = interaction.guild!;
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
    const locale = discordServer.getBotLanguage();
    const giveawayId = +(interaction.customId.split('.')[1]);
    const giveaways = await interaction.client.services.discordserver.getGiveaways(guild.id) ;
    const giveaway = giveaways.find((giveawayForRedraw) => giveawayForRedraw.id === giveawayId);
    if (giveaway) {
      if (interaction.customId.indexOf('configure-giveaway/end/redraw') === 0) {
        try {
          const winners = await interaction.client.services.discordserver.drawWinners(guild.id, giveaway.id);
          const detailFields = giveawayutil.getGiveawayDetails(locale, giveaway);
          const firstChunkSize = detailFields.length + 1;
          const chunkSize = giveaway.drawType == GiveawayDrawType.CARDANO_ADDRESS ? 4 : 10;
          const winnerFields = await giveawayutil.getWinnerInfo(giveaway, locale, winners, guild, false);
          detailFields.push(...winnerFields);
          const firstWinnerFields = detailFields.splice(0, firstChunkSize);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.successRedraw', locale }, giveaway as any), 'configure-giveaway-end', firstWinnerFields);
          const components = [
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(this.createRedrawButton(giveaway, locale)),
          ];
          if (giveaway.channelId && giveaway.messageId && giveaway.drawType === GiveawayDrawType.DISCORD_ID) {
            components[0].addComponents(this.createPublishButton(giveaway, locale));
          }
          await interaction.editReply({ embeds: [embed], components });
          while (detailFields.length) {
            const additionalWinnerFields = detailFields.splice(0, chunkSize);
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.successRedraw', locale }, giveaway as any), 'configure-giveaway-end', additionalWinnerFields);
            await interaction.followUp({ embeds: [embed], ephemeral: true });
          }
        } catch (e) {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.errorDraw', locale }, giveaway as any), 'configure-giveaway-end');
          await interaction.editReply({ embeds: [embed], components: [] });
        }
      } else if (interaction.customId.indexOf('configure-giveaway/end/publish') === 0 && giveaway.drawType === GiveawayDrawType.DISCORD_ID && giveaway.channelId && giveaway.messageId) {
        const participation = await interaction.client.services.discordserver.getParticipationForGiveaway(guild.id, giveaway.id);
        const tokenMetadata = await giveawayutil.getTokenMetadataFromRegistry(guild.id, giveaway, interaction.client);
        const { detailFields } = giveawayutil.getGiveawayAnnouncementParts(discordServer, giveaway, participation, tokenMetadata);
        const winners = await interaction.client.services.discordserver.getWinnerList(guild.id, giveaway.id);
        const winnerFields = await giveawayutil.getWinnerInfo(giveaway, locale, winners!, guild);
        detailFields.push(...winnerFields);
        const embedPublic = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'configure.giveaway.announce.publicSuccess', locale }), 'vote', detailFields);
        const announceChannel = await guild.channels.fetch(giveaway.channelId) as GuildTextBasedChannel;
        try {
          await announceChannel.messages.fetch(giveaway.messageId);
          await announceChannel.messages.edit(giveaway.messageId, { embeds: [embedPublic], components: [] });
        } catch (discordError: any) {
          if (discordError.httpStatus === 404) {
            interaction.client.logger.error({ guildId: guild.id, msg: `Message ${giveaway.messageId} was not found in channel ${giveaway.channelId} when publishing giveaway result updates for giveaway ${giveaway.id}` });
          } else {
            interaction.client.logger.error({ guildId: guild.id, msg: `Editing message ${giveaway.messageId} in channel ${giveaway.channelId} failed when publishing giveaway result updates for giveaway ${giveaway.id}`, error: discordError });
          }
        }
        const detailFieldsAdmin = giveawayutil.getGiveawayDetails(locale, giveaway);
        detailFieldsAdmin.push(...winnerFields);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway end', i18n.__({ phrase: 'configure.giveaway.end.successPublish', locale }, giveaway as any), 'configure-giveaway-end', detailFieldsAdmin);
        const components = [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(this.createRedrawButton(giveaway, locale)),
        ];
        await interaction.editReply({ embeds: [embed], components });
      }
    }
  },
  createRedrawButton(giveaway, locale) {
    return new ButtonBuilder()
      .setCustomId(`configure-giveaway/end/redraw.${giveaway.id}`)
      .setLabel(i18n.__({ phrase: 'configure.giveaway.end.redrawButton', locale }))
      .setStyle(ButtonStyle.Danger);
  },
  createPublishButton(giveaway, locale) {
    return new ButtonBuilder()
      .setCustomId(`configure-giveaway/end/publish.${giveaway.id}`)
      .setLabel(i18n.__({ phrase: 'configure.giveaway.end.publishButton', locale }))
      .setStyle(ButtonStyle.Primary);
  }
};

