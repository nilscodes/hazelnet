/* eslint-disable import/no-dynamic-require,global-require */
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const logger = require('pino')();

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('start.js'));

commandFiles.forEach((file) => {
  const command = require(`./commands/${file}`);
  commands.push(command.getCommandData('en').toJSON());
});

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.TEST_GUILD_ID),
      { body: commands },
    );

    logger.info('Successfully registered application commands.');
  } catch (error) {
    logger.error(error);
  }
})();
