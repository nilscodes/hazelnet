import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale, commandsToEnable) {
    const ci18n = new CommandTranslations('profile', locale);
    const builder = new SlashCommandBuilder();
    builder.setName('profile')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('toggle')
        .setDescription(ci18n.subDescription('toggle')))
      .addSubcommand((subcommand) => subcommand
        .setName('defaulthandle')
        .setDescription(ci18n.subDescription('defaulthandle'))
        .addStringOption((option) => option.setName('handle').setDescription(ci18n.option('handle')).setRequired(false)));
    return builder;
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
  executeButton: commandbase.executeButtonIfUser,
};
