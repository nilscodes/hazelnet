const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel');
    const welcomeText = interaction.options.getString('welcome-text');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
        const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
        if (announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
          const welcomeTextToUse = welcomeText.substring(0, 1000);
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
            announceChannelId: announceChannel.id,
            welcomeText: welcomeTextToUse,
          });

          const components = [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('configure-verify/announce/confirm')
                  .setLabel(i18n.__({ phrase: 'configure.verify.announce.publish', locale }))
                  .setStyle(ButtonStyle.Primary),
              ),
          ];

          const welcomeFields = [{
            name: i18n.__({ phrase: 'configure.verify.announce.publicSuccessTitle', locale }),
            value: welcomeTextToUse,
          }];

          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.purpose', locale }, { channel: announceChannel.id }), 'configure-verify-announce', welcomeFields);
          await interaction.editReply({ components, embeds: [embed], ephemeral: true });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-verify-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.errorWrongChannelType', locale }), 'configure-verify-announce');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting verify widget announcement ready. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-verify/announce/confirm') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const { announceChannelId, welcomeText } = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
      const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
      const successText = i18n.__({ phrase: 'configure.verify.announce.publicSuccess', locale });
      const detailFields = [{
        name: i18n.__({ phrase: 'configure.verify.announce.welcomeMessage', locale }),
        value: welcomeText,
      }];

      const components = this.getVerifyComponents(locale);

      const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.verify.announce.publicSuccessTitle', locale }), successText, 'verify', detailFields);
      await announceChannel.send({ embeds: [embedPublic], components });
      const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-verify announce', i18n.__({ phrase: 'configure.verify.announce.success', locale }, { channel: announceChannelId }), 'configure-verify-announce');
      await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
    }
  },
  getVerifyComponents(locale) {
    return [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('verify/add/widgetverify')
            .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
            .setStyle(ButtonStyle.Primary),
        ),
    ];
  },
};
