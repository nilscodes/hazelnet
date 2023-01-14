import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-adminaccess', locale);
    return new SlashCommandBuilder()
      .setName('configure-adminaccess')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addRoleOption((option) => option.setName('admin-role').setDescription(ci18n.option('admin-role')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addRoleOption((option) => option.setName('admin-role').setDescription(ci18n.option('admin-role')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
