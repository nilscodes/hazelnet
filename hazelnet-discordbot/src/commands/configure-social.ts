import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../utility/commandtypes';
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
        .addStringOption((option) => option.setName('title').setDescription(ci18n.option('title')).setRequired(true)))
      .addSubcommandGroup((group) => group
        .setName('epochreminder')
        .setDescription(ci18n.subDescription('epochreminder'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('epochreminder-add'))
          .addStringOption((option) => option.setName('type').setDescription(ci18n.option('type'))
            .addChoices(
              { name: ci18n.choice('BEFORE_EPOCH_BOUNDARY'), value: 'BEFORE_EPOCH_BOUNDARY' },
              { name: ci18n.choice('AFTER_EPOCH_BOUNDARY'), value: 'AFTER_EPOCH_BOUNDARY' },
            )
            .setRequired(true))
          .addIntegerOption((option) => option.setName('time-offset').setDescription(ci18n.option('time-offset')).setRequired(true))
          .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
          .addStringOption((option) => option.setName('title').setDescription(ci18n.option('title')).setRequired(true)))
        .addSubcommand((subcommand) => subcommand
          .setName('list')
          .setDescription(ci18n.subDescription('epochreminder-list')))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('epochreminder-remove'))));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
};
