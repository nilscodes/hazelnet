/* eslint-disable global-require */
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

module.exports = {
  async registerStartCommand(client, guildId) {
    const startCommand = require('../commands/start');
    await this.registerCommands(client, guildId, [startCommand.getCommandData('en').toJSON()]);
  },
  async registerMainCommands(enabledCommandTags, client, guildId) {
    const discordServer = await client.services.discordserver.getDiscordServer(guildId);
    const useLocale = discordServer.getBotLanguage();
    const commands = [];
    const commandFiles = fs.readdirSync('./commands') // readdir operates out of root directory
      .filter((file) => file.endsWith('.js'));
    //  .filter((file) => !file.startsWith('start'));

    if (!discordServer.settings?.SPONSORED_BY) {
      enabledCommandTags.push('premium');
    }

    commandFiles.forEach((file) => {
      // eslint-disable-next-line import/no-dynamic-require
      const command = require(`../commands/${file}`); // require uses relative path
      const commandIsEnabled = !command.commandTags || command.commandTags.filter((tag) => enabledCommandTags.includes(tag)).length;
      if (commandIsEnabled) {
        let commandJson = command.getCommandData(useLocale, enabledCommandTags).toJSON();
        if (command.augmentPermissions) {
          commandJson = command.augmentPermissions(commandJson);
        }
        commands.push(commandJson);
      }
    });

    await this.registerCommands(client, guildId, commands);
  },
  async registerCommands(client, guildId, commands) {
    const commandNames = commands.map((command) => command.name).join(', ');
    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );

      client.logger.info(`Successfully registered application commands [${commandNames}] for guild with ID ${guildId}`);
    } catch (error) {
      client.logger.error({ msg: `Error registering application commands [${commandNames}] for guild with ID ${guildId}`, error });
    }
  },
};
