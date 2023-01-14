import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-social', locale);
    return new SlashCommandBuilder()
      .setName('configure-social')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addStringOption((option) => option.setName('title').setDescription(ci18n.option('title')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
