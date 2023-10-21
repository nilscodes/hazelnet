import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../utility/commandtypes';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-whitelist', locale);
    return new SlashCommandBuilder()
      .setName('configure-whitelist')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('whitelist-displayname').setDescription(ci18n.option('whitelist-displayname')).setRequired(true))
        .addStringOption((option) => option.setName('whitelist-name').setDescription(ci18n.option('whitelist-name')).setRequired(true))
        .addStringOption((option) => option.setName('type').setDescription(ci18n.option('type'))
          .addChoices(
            { name: ci18n.choice('WALLET_ADDRESS'), value: 'WALLET_ADDRESS' },
            { name: ci18n.choice('DISCORD_ID'), value: 'DISCORD_ID' },
          )
          .setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(false))
        .addRoleOption((option) => option.setName('awarded-role').setDescription(ci18n.option('awarded-role')).setRequired(false))
        .addIntegerOption((option) => option.setName('max-users').setDescription(ci18n.option('max-users')).setRequired(false))
        .addStringOption((option) => option.setName('signup-start').setDescription(ci18n.option('signup-start')).setRequired(false))
        .addStringOption((option) => option.setName('signup-end').setDescription(ci18n.option('signup-end')).setRequired(false))
        .addStringOption((option) => option.setName('launch-date').setDescription(ci18n.option('launch-date')).setRequired(false))
        .addStringOption((option) => option.setName('logo-url').setDescription(ci18n.option('logo-url')).setRequired(false))
        .addStringOption((option) => option.setName('blockchain').setDescription(ci18n.option('blockchain'))
          .addChoices(
            { name: ci18n.choice('CARDANO'), value: 'CARDANO' },
            { name: ci18n.choice('POLYGON'), value: 'POLYGON' },
          )
          .setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('close')
        .setDescription(ci18n.subDescription('close')))
      .addSubcommand((subcommand) => subcommand
        .setName('open')
        .setDescription(ci18n.subDescription('open')))
      .addSubcommandGroup((group) => group
        .setName('update')
        .setDescription(ci18n.subDescription('update'))
        .addSubcommand((subcommand) => subcommand
          .setName('addrole')
          .setDescription(ci18n.subDescription('update-addrole'))
          .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(true)))
        .addSubcommand((subcommand) => subcommand
          .setName('removerole')
          .setDescription(ci18n.subDescription('update-removerole')))
        .addSubcommand((subcommand) => subcommand
          .setName('details')
          .setDescription(ci18n.subDescription('update-details'))
          .addStringOption((option) => option.setName('whitelist-name').setDescription(ci18n.option('whitelist-name')).setRequired(true))
          .addStringOption((option) => option.setName('whitelist-displayname').setDescription(ci18n.option('whitelist-displayname')).setRequired(false))
          .addIntegerOption((option) => option.setName('max-users').setDescription(ci18n.option('max-users')).setRequired(false))
          .addStringOption((option) => option.setName('signup-start').setDescription(ci18n.option('signup-start')).setRequired(false))
          .addStringOption((option) => option.setName('signup-end').setDescription(ci18n.option('signup-end')).setRequired(false))
          .addStringOption((option) => option.setName('launch-date').setDescription(ci18n.option('launch-date')).setRequired(false))
          .addStringOption((option) => option.setName('logo-url').setDescription(ci18n.option('logo-url')).setRequired(false))
          .addRoleOption((option) => option.setName('awarded-role').setDescription(ci18n.option('awarded-role')).setRequired(false))))
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('share')
        .setDescription(ci18n.subDescription('share'))
        .addStringOption((option) => option.setName('guild-id').setDescription(ci18n.option('guild-id')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('unshare')
        .setDescription(ci18n.subDescription('unshare')))
      .addSubcommand((subcommand) => subcommand
        .setName('download')
        .setDescription(ci18n.subDescription('download')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove')));
  },
  commandTags: ['whitelist'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
};
