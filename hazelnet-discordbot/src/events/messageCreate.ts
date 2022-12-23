import { DiscordEvent } from "../utility/commandtypes";
import { ChannelType } from "discord.js";
import { AugmentedMessage } from "../utility/hazelnetclient";
import protectionMessageEventHandler from './configure-protection/messageCreate';
import engagementMessageEventHandler from './configure-engagement/messageCreate';

interface MessageCreateDiscordEvent extends DiscordEvent {
  execute(message: AugmentedMessage): void
}

export default <MessageCreateDiscordEvent> {
  name: 'messageCreate',
  async execute(message) {
    try {
      const isSentByHazelnet = message.author.id === message.client.application?.id;
      if (!isSentByHazelnet) {
        if (message.channel.type === ChannelType.DM) {
          const claimCommand: any = message.client.commands.get('claim');
          await claimCommand.processDirectMessage(message);
        } else if (message.content && message.guildId) {
          const discordServer = await message.client.services.discordserver.getDiscordServer(message.guildId);
          protectionMessageEventHandler.applyProtection(message, discordServer);
          engagementMessageEventHandler.applyActivityTracking(message, discordServer);
        }
      }
    } catch (error) {
      message.client.logger.error(error);
    }
  },
};


