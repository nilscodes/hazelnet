import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ChannelType, GuildChannel, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextBasedChannel, MessageActionRowComponentBuilder } from 'discord.js';
const embedBuilder = require('../../utility/embedbuilder');

interface PolicyAnnounceCommand extends BotSubcommand {
  cache: NodeCache
  getPolicyFields(tokenPolicies: any, locale: string): any
}

export default <PolicyAnnounceCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true);
    const infoText = interaction.options.getString('info-text');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (tokenPolicies.length) {
        if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
          const announceGuildChannel = announceChannel as GuildChannel;
          const announceChannelPermissions = announceGuildChannel.permissionsFor(interaction.client.application!.id);
          if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            const infoTextToUse = infoText ? infoText.substring(0, 1000) : null;
            this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
              announceChannelId: announceChannel.id,
              infoText: infoTextToUse,
            });

            const components = [
              new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('configure-policy/announce/confirm')
                    .setLabel(i18n.__({ phrase: 'configure.policy.announce.publish', locale }))
                    .setStyle(ButtonStyle.Primary),
                ),
            ];

            const infoFields = infoText ? [{
              name: i18n.__({ phrase: 'configure.policy.announce.publicSuccessTitle', locale }),
              value: infoTextToUse,
            }] : [];

            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy announce', i18n.__({ phrase: 'configure.policy.announce.purpose', locale }, { channel: announceChannel.id }), 'configure-policy-announce', infoFields);
            await interaction.editReply({ components, embeds: [embed] });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-policy announce', i18n.__({ phrase: 'configure.policy.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-policy-announce');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy announce', i18n.__({ phrase: 'configure.policy.announce.errorWrongChannelType', locale }), 'configure-policy-announce');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy announce', i18n.__({ phrase: 'configure.policy.announce.errorNoPolicies', locale }), 'configure-policy-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting policy widget announcement ready. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-policy/announce/confirm') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const { announceChannelId, infoText } = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as any;
      const announceChannel = await interaction.guild!.channels.fetch(announceChannelId) as TextBasedChannel;
      const successText = i18n.__({ phrase: 'configure.policy.announce.publicSuccess', locale });
      const detailFields = infoText ? [{
        name: i18n.__({ phrase: 'configure.policy.announce.infoMessage', locale }),
        value: infoText,
      }] : [];

      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const policyFields = this.getPolicyFields(tokenPolicies, locale);

      const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-policy announce', i18n.__({ phrase: 'configure.policy.announce.success', locale }, { channel: announceChannelId }), 'configure-policy-announce');
      await interaction.editReply({ embeds: [embedAdmin], components: [] });

      const CHUNK_SIZE = 10;
      const firstFields = policyFields.splice(0, CHUNK_SIZE);
      const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.policy.announce.publicSuccessTitle', locale }), successText, 'policy', detailFields.concat(firstFields));
      await announceChannel.send({ embeds: [embedPublic] });
      while (policyFields.length) {
        const additionalPolicies = policyFields.splice(0, CHUNK_SIZE);
        const embedPublicFollowUp = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.policy.announce.publicSuccessTitleContinued', locale }), successText, 'policy', additionalPolicies);
        // eslint-disable-next-line no-await-in-loop
        await announceChannel.send({ embeds: [embedPublicFollowUp] });
      }
    }
  },
  getPolicyFields(tokenPolicies, locale) {
    return tokenPolicies.map((tokenPolicy: any) => ({
      name: i18n.__({ phrase: 'configure.policy.announce.projectName', locale }, tokenPolicy),
      value: i18n.__({ phrase: 'configure.policy.announce.policyId', locale }, tokenPolicy),
    }));
  },
};
