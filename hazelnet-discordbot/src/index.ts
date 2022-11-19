/* eslint-disable import/no-dynamic-require,global-require */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
import * as fs from 'fs';
const path = require('path');
import { Collection, GatewayIntentBits, Partials } from 'discord.js';
const i18n = require('i18n');
const cron = require('node-cron');
import express from 'express';
import prometheus from 'prom-client';
import pino from 'pino'
import amqplib from 'amqplib'
import services from './services'
import metrics from './utility/metrics';
import HazelnetClient from './utility/hazelnetclient';
import guildCreate from './events/guildCreate';
import guildDelete from './events/guildDelete';
import interactionCreate from './events/interactionCreate';
import messageCreate from './events/messageCreate';
import ready from './events/ready';
import { DiscordEvent } from './utility/commandtypes';
const commandbase = require('./utility/commandbase');

// Configure localization singleton
i18n.configure({
  locales: ['en', 'de'],
  directory: path.join(__dirname, '/i18n'),
  objectNotation: true,
});

// Create a new client instance
const client = new HazelnetClient(
  services,
  pino(),
  new Collection(),
  metrics.setup(prometheus.register), {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

const commandFiles = fs.readdirSync(__dirname + '/commands').filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

commandFiles.forEach(async (file) => {
  let command: any;
  const importName = file.substring(0, file.lastIndexOf('.'));
  if (commandbase.typescriptCommands.includes(importName)) {
    command = (await import(`./commands/${importName}`)).default;
  } else {
    command = require(`./commands/${importName}`);
  }
  const commandData = command.getCommandData('en');
  // Find and add any subcommands, if present
  if (fs.existsSync(__dirname + `/commands/${commandData.name}`)) {
    const subCommandFiles = fs.readdirSync(__dirname + `/commands/${commandData.name}`).filter((fileFilter) => fileFilter.endsWith('.js') || fileFilter.endsWith('.ts'));
    command.subcommands = {};
    subCommandFiles.forEach(async (subcommandFile) => {
      let subcommand: any;
      const subcommandName = subcommandFile.substring(0, subcommandFile.lastIndexOf('.'));
      if (commandbase.typescriptCommands.includes(importName)) {
        subcommand = (await import(`./commands/${commandData.name}/${subcommandName}`)).default;
      } else {
        subcommand = require(`./commands/${commandData.name}/${subcommandName}`);
      }
      command.subcommands[subcommandName] = subcommand;
    });
  }
  if (client.commands) {
    client.commands.set(commandData.name, command);
  }
});

const eventFiles = [guildCreate, guildDelete, interactionCreate, messageCreate, ready];

eventFiles.forEach((event: DiscordEvent) => {
  if (event.once) {
    client.logger.info(`Registering event ${event.name} (once-type)`);
    client.once(event.name, event.execute);
  } else {
    client.logger.info(`Registering event ${event.name} (on-type)`);
    client.on(event.name, event.execute);
  }
});

const scheduleFiles = fs.readdirSync(__dirname + '/schedules').filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
const typescriptSchedules = ['giveawayanouncements', 'giveawayresultupdates', 'epochclockupdates'];

scheduleFiles.forEach(async (file) => {
  let schedule: any;
  const importName = file.substring(0, file.lastIndexOf('.'));
  if (typescriptSchedules.includes(importName)) {
    schedule = (await import(`./schedules/${importName}`)).default;
  } else {
    schedule = require(`./schedules/${file}`)
  }
  if (schedule.cron && schedule.execute) {
    cron.schedule(schedule.cron, () => schedule.execute(client));
  }
});

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// Connect to AMQP queues
const queueFiles = fs.readdirSync(__dirname + '/queues').filter((file) => file.endsWith('.js'));

if (queueFiles.length) {
  const connectToAmqp = async () => {
    const rabbitPw = process.env.RABBITMQ_PASSWORD as string;
    try {
      const conn = await amqplib.connect(`amqp://hazelnet:${encodeURIComponent(rabbitPw)}@${process.env.RABBITMQ_HOST}`);
      queueFiles.forEach(async (file) => {
        const queue = require(`./queues/${file}`);
        if (queue.name && queue.consume) {
          const queueChannel = await conn.createChannel();
          await queueChannel.assertQueue(queue.name);
          queueChannel.consume(queue.name, (msg) => {
            if (msg !== null) {
              queue.consume(client, JSON.parse(msg.content.toString()));
              queueChannel.ack(msg);
            } else {
              client.logger.error({ msg: `Consumer for queue ${queue.name} cancelled by server` });
            }
          }); ;
        }
      });
      conn.on('close', () => {
        client.logger.error({ msg: `Connection to AMQP server was closed. Reconnecting in 10 seconds...` });
        setTimeout(connectToAmqp, 10000);
      });
      conn.on('error', (e) => {
        client.logger.error({ msg: `Error during AMQP connection`, error: e });
      });
    } catch (e) {
      client.logger.error({ msg: `Connection to AMQP server could not be established. Reconnecting in 10 seconds...` });
      setTimeout(connectToAmqp, 10000);
    }
  };
  connectToAmqp();
}

// Start express server to expose prometheus metrics
const app = express();

app.get('/metrics', async (_, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

app.listen(3000);