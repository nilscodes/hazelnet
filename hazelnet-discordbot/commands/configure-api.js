const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-api')
      .setDescription('Generate an access token to connect to the public API of HAZELnet')
      .addSubcommand((subcommand) => subcommand
        .setName('generatetoken')
        .setDescription('Generates a new token to access the API. ⚠ This will overwrite any existing token, if present.'))
      .addSubcommand((subcommand) => subcommand
        .setName('removetoken')
        .setDescription('Delete the current access token, revoking all access to the public API of HAZELnet'));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
