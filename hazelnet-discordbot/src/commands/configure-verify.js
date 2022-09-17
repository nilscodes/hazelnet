const { SlashCommandBuilder } = require('discord.js');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-verify', locale);
    return new SlashCommandBuilder()
      .setName('configure-verify')
      .setDescription(ci18n.description())
      // .addSubcommand((subcommand) => subcommand
      //   .setName('info')
      //   .setDescription(ci18n.subDescription('info')))
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addStringOption((option) => option.setName('welcome-text').setDescription(ci18n.option('welcome-text')).setRequired(true)));
  },
  commandTags: ['token', 'stakepool', 'poll', 'claimphysical'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
