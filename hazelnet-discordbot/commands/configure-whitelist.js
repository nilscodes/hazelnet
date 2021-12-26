const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-whitelist')
      .setDescription('Manage whitelists for people to submit addresses for')
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Adds a new whitelist that people on this Discord can sign up for, depending on if they meet the required criteria.'.substring(0, 100))
        .addStringOption((option) => option.setName('whitelist-name').setDescription('The registration name for this whitelist (can only be up to 30 alphanumeric characters)').setRequired(true))
        .addStringOption((option) => option.setName('whitelist-displayname').setDescription('The display name for this whitelist').setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription('Role that is required for a user to have, to be able to register for this whitelist').setRequired(true))
        .addIntegerOption((option) => option.setName('max-users').setDescription('The maximum number of users that can sign up for this whitelist.').setRequired(false))
        .addStringOption((option) => option.setName('signup-start').setDescription('An optional UTC time after which registration is possible (Format: 2022-01-01T15:00:00Z)').setRequired(false))
        .addStringOption((option) => option.setName('signup-end').setDescription('An optional UTC time until which registration is possible (Format: 2022-01-31T15:00:00Z)').setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all whitelists that are defined on this Discord server.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Select and remove an existing whitelist. ⚠ This will also remove all registrations.'));
  },
  commandTags: ['whitelist'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
};
