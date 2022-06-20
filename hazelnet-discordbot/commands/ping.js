const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('ping', locale);
    return new SlashCommandBuilder()
      .setName('ping')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('send')
        .setDescription(ci18n.subDescription('send'))
        .addStringOption((option) => option.setName('ping-type').setDescription(ci18n.option('ping-type'))
          .addChoices(
            { name: ci18n.choice('PING_TYPE_HANDLE'), value: 'PING_TYPE_HANDLE' },
            { name: ci18n.choice('PING_TYPE_NFT'), value: 'PING_TYPE_NFT' },
            { name: ci18n.choice('PING_TYPE_ADDRESS'), value: 'PING_TYPE_ADDRESS' },
          )
          .setRequired(true))
        .addStringOption((option) => option.setName('target').setDescription(ci18n.option('target')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
  executeButton: commandbase.executeButtonIfUser,
};
