const i18n = require('i18n');
const { SlashCommandBuilder } = require('@discordjs/builders');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('info')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.info', locale }))
      .setDefaultPermission(false);
  },
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const guild = await interaction.client.guilds.fetch(discordServer.guildId);
      const useLocale = discordServer.getBotLanguage();
      let infoText = i18n.__({ phrase: 'info.infoBaseText', locale: useLocale });
      let stakepoolFields = [];
      if (discordServer.stakepools?.length) {
        infoText += `\n\n${i18n.__n({ singular: 'info.stakepoolsBaseText.one', plural: 'info.stakepoolsBaseText.other', locale: useLocale }, discordServer.stakepools.length)}`;
        stakepoolFields = discordServer.stakepools.map((stakepool) => ({
          name: `${stakepool.info?.name} (${stakepool.info?.ticker})`,
          value: i18n.__({ phrase: 'info.stakepoolDetails', locale: useLocale }, stakepool.info),
        }));
      }
      // TODO exclude info for premium
      stakepoolFields.push({
        name: i18n.__({ phrase: 'about.title', locale: useLocale }),
        value: i18n.__({ phrase: 'about.info', locale: useLocale }),
      });
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'info.welcomeTitle', locale: useLocale }, { guildName: guild.name }), infoText, stakepoolFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.reply({ content: 'Error while getting server info.', ephemeral: true });
    }
  },
};
