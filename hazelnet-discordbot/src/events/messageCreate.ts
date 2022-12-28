import { DiscordEvent } from "../utility/commandtypes";
import { ChannelType, Message } from "discord.js";
import HazelnetClient from "../utility/hazelnetclient";
import protectionMessageEventHandler from './configure-protection/messageCreate';
import activityTracker from '../utility/activitytracker';

interface MessageCreateDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient, message: Message): void
}

export default <MessageCreateDiscordEvent> {
  name: 'messageCreate',
  async execute(client, message) {
    try {
      const isSentByHazelnet = message.author.id === client.application?.id;
      if (!isSentByHazelnet) {
        if (message.channel.type === ChannelType.DM) {
          const claimCommand: any = client.commands.get('claim');
          await claimCommand.processDirectMessage(message);
        } else if (message.content && message.guildId) {
          const discordServer = await client.services.discordserver.getDiscordServer(message.guildId);
          protectionMessageEventHandler.applyProtection(client, message, discordServer);
          activityTracker.applyActivityTracking(message.author.id, discordServer);
        }
      }
    } catch (error) {
      client.logger.error(error);
    }
  },
};


