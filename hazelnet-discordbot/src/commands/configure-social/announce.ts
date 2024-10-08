import NodeCache from 'node-cache';
import {
  ChannelType,
  GuildChannel,
  GuildTextBasedChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import discordpermissions from '../../utility/discordpermissions';

interface SocialAnnounceCommand extends BotSubcommand {
  cache: NodeCache
}

export default <SocialAnnounceCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('title', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (announceChannel
        && (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement)) {
        const guildChannel = announceChannel as GuildChannel;
        const announceChannelPermissions = guildChannel.permissionsFor(interaction.client.application!.id);
        if (announceChannelPermissions) {
          if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social announce', i18n.__({ phrase: 'configure.social.announce.purpose', locale }, { channel: announceChannel.id }), 'configure-social-announce');
            await interaction.editReply({ embeds: [embed] });

            const collector = interaction.channel!.createMessageCollector({
              filter: (message) => message.author.id === interaction.user.id,
              time: 5 * 60000,
              dispose: true,
              max: 1,
            });

            collector.on('end', async (collected) => {
              if (collected.size > 0) {
                const announcementText = collected.at(0)!.content;
                this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                  announceChannelId: announceChannel.id,
                  title,
                  announcementText,
                });

                const components = [
                  new ActionRowBuilder()
                    .addComponents(
                      new ButtonBuilder()
                        .setCustomId('configure-social/announce/confirm')
                        .setLabel(i18n.__({ phrase: 'configure.social.announce.publish', locale }))
                        .setStyle(ButtonStyle.Primary),
                    ),
                ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];

                const userEmbed = embedBuilder.buildForUser(discordServer, title, announcementText);
                await interaction.followUp({ components, embeds: [userEmbed], ephemeral: true });
              }
            });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-social announce', i18n.__({ phrase: 'configure.social.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-social-announce');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-social announce', i18n.__({ phrase: 'configure.social.announce.errorWrongChannelType', locale }), 'configure-social-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting social widget announcement ready. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-social/announce/confirm') {
      await interaction.deferUpdate();
      const guild = interaction.guild!;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
      const locale = discordServer.getBotLanguage();
      const { announceChannelId, title, announcementText } = this.cache.take(`${guild.id}-${interaction.user.id}`) as any;
      const announceChannel = await guild.channels.fetch(announceChannelId) as GuildTextBasedChannel;
      const embedPublic = embedBuilder.buildForUser(discordServer, title, announcementText, 'info');
      await announceChannel.send({ embeds: [embedPublic] });
      const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-social announce', i18n.__({ phrase: 'configure.social.announce.success', locale }, { channel: announceChannelId }), 'configure-social-announce');
      await interaction.editReply({ embeds: [embedAdmin], components: [] });
    }
  },
};
