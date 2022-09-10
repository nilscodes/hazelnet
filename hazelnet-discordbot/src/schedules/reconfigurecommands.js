/* eslint-disable no-await-in-loop */
const commandregistration = require('../utility/commandregistration');
const commandPermissions = require('../utility/commandpermissions');

module.exports = {
  cron: '*/15 * * * *',
  async execute(client) {
    client.logger.info('Checking if all servers need their commands and permissions updated...');
    try {
      const resetAllPermissions = await client.services.globalsettings.getGlobalSetting('RESET_ALL_COMMANDS') === 'true';
      await client.services.globalsettings.updateGlobalSetting('RESET_ALL_COMMANDS', 'false');
      const resetSpecificGuildsString = await client.services.globalsettings.getGlobalSetting('RESET_COMMANDS_FOR_GUILDS');
      const guildsToReset = (resetSpecificGuildsString.length && resetSpecificGuildsString?.split(',')) ?? [];
      await client.services.globalsettings.updateGlobalSetting('RESET_COMMANDS_FOR_GUILDS', '');
      if (resetAllPermissions) {
        if (guildsToReset.length) {
          client.logger.info(`Command and permissions on these servers need to be reset: ${guildsToReset.join(', ')}. Performing task now.`);
        } else {
          client.logger.info('Command and permissions on all servers need to be reset. Performing task now.');
        }
        const allServers = await client.services.discordserver.getAllDiscordServers();
        for (let i = 0; i < allServers.length; i += 1) {
          const discordServer = allServers[i];
          try {
            const enabledCommands = discordServer.settings?.ENABLED_COMMAND_TAGS;
            if (enabledCommands?.length && (!guildsToReset.length || guildsToReset.includes(discordServer.guildId))) {
              await commandregistration.registerMainCommands(enabledCommands.split(','), client, discordServer.guildId);
              // await commandPermissions.setSlashCommandPermissions(client, discordServer.guildId, discordServer);
            }
          } catch (error) {
            client.logger.error({ msg: `Failed to reset commands and permissions for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        }
      } else {
        client.logger.info('... No command and permission reset required.');
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to do command and permission reset check.', error });
    }
  },
};
