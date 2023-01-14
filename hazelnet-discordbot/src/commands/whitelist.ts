import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('whitelist', locale);
    return new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('register')
        .setDescription(ci18n.subDescription('register'))
        .addStringOption((option) => option.setName('address-or-handle').setDescription(ci18n.option('address-or-handle')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('unregister')
        .setDescription(ci18n.subDescription('unregister')));
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  commandTags: ['whitelist'],
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
  executeButton: commandbase.executeButtonIfUser,
};
