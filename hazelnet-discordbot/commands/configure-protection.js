const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-protection')
      .setDescription('Configuration options around scammer protection')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('status')
        .setDescription('Show the status of all protection-related mechanisms.'))
      .addSubcommand((subcommand) => subcommand
        .setName('addressremove')
        .setDescription('Turn on/off autoremoval of messages that contain an address (addr1...) to protect from scammers.')
        .addBooleanOption((option) => option.setName('status').setDescription('Set to False to turn this feature off').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('auditchannel')
        .setDescription('Dedicate a channel for all messages that are related to warnings/auditing.')
        .addChannelOption((option) => option.setName('auditchannel').setDescription('The channel to send audit/warning messages to.').setRequired(true))
        .addBooleanOption((option) => option.setName('status').setDescription('Set this parameter to False when disabling the audit channel').setRequired(false)));
  },
  execute: commandbase.executeSubcommandIfAdmin,
};
