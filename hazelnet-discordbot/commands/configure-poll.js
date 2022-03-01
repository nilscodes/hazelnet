const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-poll')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-poll', locale }).substring(0, 100))
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-poll-add', locale }).substring(0, 100))
        .addStringOption((option) => option.setName('poll-name').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.poll-name', locale }).substring(0, 100)).setRequired(true))
        .addStringOption((option) => option.setName('poll-displayname').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.poll-displayname', locale }).substring(0, 100)).setRequired(true))
        .addStringOption((option) => option.setName('poll-opentime').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.poll-opentime', locale }).substring(0, 100)).setRequired(true))
        .addStringOption((option) => option.setName('poll-closetime').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.poll-closetime', locale }).substring(0, 100)).setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.required-role', locale }).substring(0, 100)).setRequired(false))
        .addChannelOption((option) => option.setName('publish-channel').setDescription(i18n.__({ phrase: 'commands.options.configure-poll.publish-channel', locale }).substring(0, 100)).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-poll-list', locale }).substring(0, 100)))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-poll-remove', locale }).substring(0, 100)));
  },
  commandTags: ['poll'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
