import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

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
        .addStringOption((option) => option.setName('welcome-text').setDescription(ci18n.option('welcome-text')).setRequired(false))
        .addStringOption((option) => option.setName('logo-url').setDescription(ci18n.option('logo-url')).setRequired(false)));
  },
  commandTags: ['token', 'stakepool', 'poll', 'claimphysical', 'governance'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
