const commandPermissions = require('../utility/commandpermissions');

module.exports = {
  cron: '0 * * * *',
  async execute(client) {
    client.logger.info('Checking if all servers need their command permissions updated...');
    try {
      const resetAllPermissions = await client.services.globalsettings.getGlobalSetting('RESET_ALL_PERMISSIONS') === 'true';
      if (resetAllPermissions) {
        client.logger.info('Permissions on all servers need to be reset. Performing task now.');
        const allServers = await client.services.discordserver.getAllDiscordServers();
        allServers.forEach(async (discordServer) => {
          try {
            await commandPermissions.setSlashCommandPermissions(client, discordServer.guildId, discordServer);
          } catch (error) {
            client.logger.error({ msg: `Failed to reset command permissions for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        });
        await client.services.globalsettings.deleteGlobalSetting('RESET_ALL_PERMISSIONS');
      } else {
        client.logger.info('... No command permission reset required. Phew.');
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to do command permission reset check.', error });
    }
  },
};
