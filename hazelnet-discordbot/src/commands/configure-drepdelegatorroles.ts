import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-drepdelegatorroles', locale);
    return new SlashCommandBuilder()
      .setName('configure-drepdelegatorroles')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(true))
        .addIntegerOption((option) => option.setName('minimum-stake').setDescription(ci18n.option('minimum-stake')).setRequired(true))
        .addIntegerOption((option) => option.setName('maximum-stake').setDescription(ci18n.option('maximum-stake')).setRequired(false))
        .addStringOption((option) => option.setName('drep-id').setDescription(ci18n.option('drep-id')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addIntegerOption((option) => option.setName('delegator-role-id').setDescription(ci18n.option('role')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('test')
        .setDescription(ci18n.subDescription('test'))
        .addUserOption((option) => option.setName('user').setDescription(ci18n.option('user')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['governance'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
