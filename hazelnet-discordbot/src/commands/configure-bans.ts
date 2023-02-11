import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-bans', locale);
    return new SlashCommandBuilder()
      .setName('configure-bans')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('ban-type').setDescription(ci18n.option('ban-type'))
            .addChoices(
              { name: ci18n.choice('STAKE_ADDRESS_BAN'), value: 'STAKE_ADDRESS_BAN' },
              { name: ci18n.choice('ASSET_FINGERPRINT_BAN'), value: 'ASSET_FINGERPRINT_BAN' },
            )
            .setRequired(true))
        .addStringOption((option) => option.setName('ban-pattern').setDescription(ci18n.option('ban-pattern')).setRequired(true))
        .addStringOption((option) => option.setName('ban-reason').setDescription(ci18n.option('ban-reason')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addIntegerOption((option) => option.setName('ban-id').setDescription(ci18n.option('ban-id')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
