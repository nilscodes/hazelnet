const i18n = require('i18n');
const { SlashCommandBuilder, ButtonStyle } = require('discord.js');
const {
  ActionRowBuilder, ButtonBuilder,
} = require('discord.js');
const embedBuilder = require('../utility/embedbuilder');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('info', locale);
    return new SlashCommandBuilder()
      .setName('info')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild.id);
      const guild = await interaction.client.guilds.fetch(discordServer.guildId);
      const locale = discordServer.getBotLanguage();
      let infoText = i18n.__({ phrase: 'info.infoBaseText', locale });
      if (discordServer.premium && discordServer.settings?.INFO_CONTENT_TEXT) {
        infoText = discordServer.settings?.INFO_CONTENT_TEXT;
      }
      let stakepoolFields = [];
      if (stakepools.length) {
        infoText += `\n\n${i18n.__n({ singular: 'info.stakepoolsBaseText.one', plural: 'info.stakepoolsBaseText.other', locale }, stakepools.length)}`;
        const infoMessageType = stakepools.length > 6 ? 'info.stakepoolDetailsShort' : 'info.stakepoolDetails';
        stakepoolFields = stakepools.map((stakepool) => ({
          name: `${stakepool.info?.name} (${stakepool.info?.ticker})`,
          value: i18n.__({ phrase: infoMessageType, locale }, stakepool.info),
        }));
      }

      let infoImage;
      let infoTitle = i18n.__({ phrase: 'info.welcomeTitle', locale }, { guildName: guild.name });
      let components;

      if (!discordServer.premium) {
        stakepoolFields.push({
          name: i18n.__({ phrase: 'about.title', locale }),
          value: i18n.__({ phrase: 'about.info', locale }),
        });
      } else {
        infoImage = discordServer.settings?.INFO_CONTENT_IMAGE;
        if (discordServer.settings?.INFO_CONTENT_TITLE) {
          infoTitle = discordServer.settings?.INFO_CONTENT_TITLE;
        }
        if (discordServer.settings?.INFO_CONTENT_BUTTONS) {
          try {
            const buttonData = JSON.parse(discordServer.settings.INFO_CONTENT_BUTTONS);
            if (buttonData.length) {
              components = [new ActionRowBuilder()
                .addComponents(
                  buttonData.map((button) => (
                    new ButtonBuilder()
                      .setLabel(button.label)
                      .setURL(button.url)
                      .setStyle(ButtonStyle.Link)
                  )),
                )];
            }
          } catch (badJson) {
            interaction.client.logger.warn({ msg: `Problem when parsing JSON for custom buttons for /info command for guild ${guild.id}`, err: badJson });
          }
        }
      }
      const embed = embedBuilder.buildForUser(discordServer, infoTitle, infoText, 'info', stakepoolFields, infoImage);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server info.', ephemeral: true });
    }
  },
};
