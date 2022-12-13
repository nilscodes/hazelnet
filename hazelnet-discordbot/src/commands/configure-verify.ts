import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

export default <BotCommand> {
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
        .addStringOption((option) => option.setName('welcome-text').setDescription(ci18n.option('welcome-text')).setRequired(true))
        .addStringOption((option) => option.setName('logo-url').setDescription(ci18n.option('logo-url')).setRequired(false)));
  },
  commandTags: ['token', 'stakepool', 'poll', 'claimphysical'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
