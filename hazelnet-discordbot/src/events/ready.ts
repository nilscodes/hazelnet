import { ActivityType } from 'discord.js';
import { DiscordEvent } from '../utility/commandtypes';
import HazelnetClient from '../utility/hazelnetclient';

interface ReadyDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient): void
}

export default <ReadyDiscordEvent> {
  name: 'ready',
  once: true,
  execute(client) {
    client.logger.info(`HAZELnet bot is running. Logged in as ${client.user?.tag} (${client.user?.id})`);
    //client.user.setActivity(x'Cardano for 600,000 users', { type: ActivityType.Streaming });
  },
};
