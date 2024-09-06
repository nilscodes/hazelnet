import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../utility/commandtypes';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale, commandsToEnable) {
    const ci18n = new CommandTranslations('verify', locale);
    const commandBuilder = new SlashCommandBuilder()
      .setName('verify')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('address-or-handle').setDescription(ci18n.option('address-or-handle')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('help')
        .setDescription(ci18n.subDescription('help')))
      .addSubcommand((subcommand) => subcommand
        .setName('link')
        .setDescription(ci18n.subDescription('link')))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addStringOption((option) => option.setName('address').setDescription(ci18n.option('address')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('unlink')
        .setDescription(ci18n.subDescription('unlink')));
    if (commandsToEnable?.includes('verify-expose')) {
      commandBuilder.addSubcommand((subcommand) => subcommand
        .setName('expose')
        .setDescription(ci18n.subDescription('expose')));
    }
    return commandBuilder;
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  commandTags: ['token', 'stakepool', 'poll', 'claimphysical', 'governance'],
  execute: commandbase.executeSubcommand,
  executeButton: commandbase.executeButtonIfUser,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
};
