const { SlashCommandBuilder } = require('discord.js');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale, commandsToEnable) {
    const ci18n = new CommandTranslations('configure-poll', locale);
    const commandBuilder = new SlashCommandBuilder()
      .setName('configure-poll')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addBooleanOption((option) => option.setName('publishresults').setDescription(ci18n.option('publishresults')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove')));

    if (!commandsToEnable || commandsToEnable.includes('poll')) {
      commandBuilder.addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('poll-displayname').setDescription(ci18n.option('poll-displayname')).setRequired(true))
        .addStringOption((option) => option.setName('poll-name').setDescription(ci18n.option('poll-name')).setRequired(true))
        .addStringOption((option) => option.setName('poll-opentime').setDescription(ci18n.option('poll-opentime')).setRequired(true))
        .addStringOption((option) => option.setName('poll-closetime').setDescription(ci18n.option('poll-closetime')).setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(false))
        .addChannelOption((option) => option.setName('publish-channel').setDescription(ci18n.option('publish-channel')).setRequired(false)));
    }

    if (!commandsToEnable || commandsToEnable.includes('pollvoteaire')) {
      commandBuilder
        .addSubcommand((subcommand) => subcommand
          .setName('add-onchain')
          .setDescription(ci18n.subDescription('add-onchain'))
          .addStringOption((option) => option.setName('ballot-id').setDescription(ci18n.option('ballot-id')).setRequired(true))
          .addChannelOption((option) => option.setName('publish-channel').setDescription(ci18n.option('publish-channel')).setRequired(false)));
    }
    return commandBuilder;
  },
  commandTags: ['poll', 'pollvoteaire'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
