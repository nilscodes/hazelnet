import { DiscordEvent } from "src/utility/commandtypes";
import HazelnetClient from "src/utility/hazelnetclient";

interface ReadyDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient): void
}

export default <ReadyDiscordEvent> {
  name: 'ready',
  once: true,
  execute(client) {
    client.logger.info(`HAZELnet bot is running. Logged in as ${client.user?.tag} (${client.user?.id})`);
  },
};
