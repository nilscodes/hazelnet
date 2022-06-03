const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-poll', locale);
    return new SlashCommandBuilder()
      .setName('configure-poll')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('poll-displayname').setDescription(ci18n.option('poll-displayname')).setRequired(true))
        .addStringOption((option) => option.setName('poll-name').setDescription(ci18n.option('poll-name')).setRequired(true))
        .addStringOption((option) => option.setName('poll-opentime').setDescription(ci18n.option('poll-opentime')).setRequired(true))
        .addStringOption((option) => option.setName('poll-closetime').setDescription(ci18n.option('poll-closetime')).setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(false))
        .addChannelOption((option) => option.setName('publish-channel').setDescription(ci18n.option('publish-channel')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove')));
  },
  commandTags: ['poll'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
