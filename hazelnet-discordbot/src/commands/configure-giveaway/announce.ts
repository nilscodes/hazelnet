import { ChannelType, GuildChannel, TextBasedChannel } from 'discord.js';
import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import giveawayutil from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';
import discordpermissions from '../../utility/discordpermissions';

interface GiveawayAnnounceCommand extends BotSubcommand {
  cache: NodeCache
}

export default <GiveawayAnnounceCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
        const announceGuildChannel = announceChannel as GuildChannel;
        const announceChannelPermissions = announceGuildChannel.permissionsFor(interaction.client.application!.id);
        if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
          const giveaways = await interaction.client.services.discordserver.getGiveaways(guildId);
          const CHUNK_SIZE = 20;
          const firstGiveaways = giveaways.splice(0, CHUNK_SIZE);
          const { giveawayFields, components } = giveawayutil.getDiscordGiveawayListParts(discordServer, firstGiveaways, 'configure-giveaway/announce/publish', 'configure.giveaway.announce.chooseGiveaway');
          this.cache.set(`${guildId}-${interaction.user.id}`, `${announceChannel.id}`);
          const participationPublishingInfo = i18n.__({ phrase: 'configure.giveaway.announce.participationPublishYes', locale });
          let embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.purpose', locale }, { participationPublishingInfo }), 'configure-giveaway-announce', giveawayFields);
          await interaction.editReply({ embeds: [embed], components });
          while (giveaways.length) {
            const additionalGiveaways = giveaways.splice(0, CHUNK_SIZE);
            const { giveawayFields: moreGiveawayFields, components: moreComponents } = giveawayutil.getDiscordGiveawayListParts(discordServer, additionalGiveaways, 'configure-giveaway/announce/publish', 'configure.giveaway.announce.chooseGiveaway');
            embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.purposeContinued', locale }, { participationPublishingInfo }), 'configure-giveaway-announce', moreGiveawayFields);
            // eslint-disable-next-line no-await-in-loop
            await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-giveaway-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.errorWrongChannelType', locale }), 'configure-giveaway-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting giveaway list to announce. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-giveaway/announce/publish') {
      await interaction.deferUpdate();
      const guild = interaction.guild!;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
      const locale = discordServer.getBotLanguage();
      const giveawayId = +interaction.values[0].substring(19);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(guild.id);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        const announceChannelId = this.cache.take(`${guild.id}-${interaction.user.id}`) as string;
        const participation = await interaction.client.services.discordserver.getParticipationForGiveaway(guild.id, giveaway.id);
        const tokenMetadata = await giveawayutil.getTokenMetadataFromRegistry(guild.id, giveaway, interaction.client);
        const { detailFields, components } = giveawayutil.getGiveawayAnnouncementParts(discordServer, giveaway, participation, tokenMetadata);

        try {
          const announceChannel = await guild.channels.fetch(announceChannelId);
          if (announceChannel) {
            const guildAnnounceChannel = announceChannel as TextBasedChannel;
            const embedPublic = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'configure.giveaway.announce.publicSuccess', locale }), 'vote', detailFields, giveaway.logoUrl);
            const announcementMessage = await guildAnnounceChannel.send({ embeds: [embedPublic], components });
            await interaction.client.services.discordserver.updateGiveaway(guild.id, giveaway.id, {
              channelId: announceChannel.id,
              messageId: announcementMessage.id,
            });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.success', locale }, { channel: guildAnnounceChannel.id }), 'configure-giveaway-announce');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } catch (sendError) {
          interaction.client.logger.info(sendError);
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway announce', i18n.__({ phrase: 'configure.giveaway.announce.errorNoSendPermissions', locale }, { channel: announceChannelId }), 'configure-giveaway-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
