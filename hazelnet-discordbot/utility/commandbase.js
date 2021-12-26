const i18n = require('i18n');
const { executeSelectMenu } = require('../commands/start');
const commandPermissions = require('./commandpermissions');
const embedBuilder = require('./embedbuilder');

module.exports = {
  async executeSubcommandIfAdmin(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(true);
    const subommandName = subcommandGroup ? `${subcommandGroup}-${subcommand}` : subcommand;
    if (this.subcommands[subommandName]) {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const isAdminUser = await commandPermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
      if (isAdminUser) {
        await this.subcommands[subommandName].execute(interaction);
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'errors.permissionDeniedTitle', locale: discordServer.getBotLanguage() }), i18n.__({ phrase: 'errors.permissionDeniedInformation', locale: discordServer.getBotLanguage() }));
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
  async executeSelectMenuIfAdmin(interaction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts.length === 4 ? `${customIdParts[1]}-${customIdParts[2]}` : customIdParts[1];
      if (this.subcommands[subcommand]) {
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
        const isAdminUser = await commandPermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
        if (isAdminUser) {
          await this.subcommands[subcommand].executeSelectMenu(interaction);
        }
      }
    }
  },
  async executeSubcommand(interaction) {
    const subcommand = interaction.options.getSubcommand(true);
    if (this.subcommands[subcommand]) {
      await this.subcommands[subcommand].execute(interaction);
    }
  },
  async executeSubcommandSelectMenu(interaction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts[1];
      if (this.subcommands[subcommand]) {
        await this.subcommands[subcommand].executeSelectMenu(interaction);
      }
    }
  },
};
