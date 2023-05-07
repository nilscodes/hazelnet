import { PermissionsBitField, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import i18n from 'i18n';
import commandpermissions from './commandpermissions';
import embedBuilder from './embedbuilder';
import { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from './hazelnetclient';

export default {
  subcommands: {} as any,
  async executeSubcommandIfAdmin(interaction: AugmentedCommandInteraction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(true);
    const subcommandName = subcommandGroup ? `${subcommandGroup}-${subcommand}` : subcommand;
    if (this.subcommands[subcommandName]) {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const isAdminUser = await commandpermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
      if (isAdminUser) {
        try {
          await this.subcommands[subcommandName].execute(interaction);
        } catch (error) {
          interaction.client.logger.error(error);
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'errors.permissionDeniedTitle', locale: discordServer.getBotLanguage() }), i18n.__({ phrase: 'errors.permissionDeniedInformation', locale: discordServer.getBotLanguage() }));
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
  async executeSelectMenuIfAdmin(interaction: AugmentedSelectMenuInteraction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts.length === 4 ? `${customIdParts[1]}-${customIdParts[2]}` : customIdParts[1];
      if (this.subcommands[subcommand]) {
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
        const isAdminUser = await commandpermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
        if (isAdminUser) {
          try {
            await this.subcommands[subcommand].executeSelectMenu(interaction);
          } catch (error) {
            interaction.client.logger.error(error);
          }
        }
      }
    }
  },
  async executeButtonIfAdmin(interaction: AugmentedButtonInteraction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts.length === 4 ? `${customIdParts[1]}-${customIdParts[2]}` : customIdParts[1];
      if (this.subcommands[subcommand]) {
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
        const isAdminUser = await commandpermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
        if (isAdminUser) {
          try {
            await this.subcommands[subcommand].executeButton(interaction);
          } catch (error) {
            interaction.client.logger.error(error);
          }
        }
      }
    }
  },
  async executeButtonIfUser(interaction: AugmentedButtonInteraction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts.length === 4 ? `${customIdParts[1]}-${customIdParts[2]}` : customIdParts[1];
      if (this.subcommands[subcommand]) {
        // Checks for user access roles have been removed after the Discord permission system for application commands changed
        try {
          await this.subcommands[subcommand].executeButton(interaction);
        } catch (error) {
          interaction.client.logger.error(error);
        }
      }
    }
  },
  async executeSubcommand(interaction: AugmentedCommandInteraction) {
    const subcommand = interaction.options.getSubcommand(true);
    if (this.subcommands[subcommand]) {
      try {
        await this.subcommands[subcommand].execute(interaction);
      } catch (error) {
        interaction.client.logger.error(error);
      }
    }
  },
  async executeSubcommandSelectMenu(interaction: AugmentedSelectMenuInteraction) {
    const customIdParts = interaction.customId.split('/');
    if (customIdParts.length > 2) {
      const subcommand = customIdParts[1];
      if (this.subcommands[subcommand]) {
        try {
          await this.subcommands[subcommand].executeSelectMenu(interaction);
        } catch (error) {
          interaction.client.logger.error(error);
        }
      }
    }
  },
  augmentPermissionsUser(json: RESTPostAPIApplicationCommandsJSONBody) {
    const adjustedJson = json;
    adjustedJson.default_member_permissions = `${PermissionsBitField.Flags.UseApplicationCommands}`;
    return adjustedJson;
  },
  augmentPermissionsAdmin(json: RESTPostAPIApplicationCommandsJSONBody) {
    const adjustedJson = json;
    adjustedJson.default_member_permissions = `${PermissionsBitField.Flags.ManageGuild}`;
    return adjustedJson;
  },
};
