const commandregistration = require('../utility/commandregistration');
const commandPermissions = require('../utility/commandpermissions');

module.exports = {
  cron: '0 * * * *',
  async execute(client) {
    client.logger.info('Checking if all servers need their commands and permissions updated...');
    try {
      const resetAllPermissions = await client.services.globalsettings.getGlobalSetting('RESET_ALL_COMMANDS') === 'true';
      if (resetAllPermissions) {
        client.logger.info('Command and permissions on all servers need to be reset. Performing task now.');
        const allServers = await client.services.discordserver.getAllDiscordServers();
        allServers.forEach(async (discordServer) => {
          try {
            const enabledCommands = discordServer.settings?.ENABLED_COMMAND_TAGS;
            if (enabledCommands?.length) {
              await commandregistration.registerMainCommands(enabledCommands.split(','), client, discordServer.guildId);
              await commandPermissions.setSlashCommandPermissions(client, discordServer.guildId, discordServer);
            }
          } catch (error) {
            client.logger.error({ msg: `Failed to reset commands and permissions for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        });
        await client.services.globalsettings.deleteGlobalSetting('RESET_ALL_COMMANDS');
      } else {
        client.logger.info('... No command and permission reset required. Phew.');
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to do command and permission reset check.', error });
    }
  },
};
