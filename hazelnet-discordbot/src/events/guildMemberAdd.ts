import { DiscordEvent } from '../utility/commandtypes';
import activityTracker from '../utility/activitytracker';
import { GuildMember } from 'discord.js';
import HazelnetClient from '../utility/hazelnetclient';

interface GuildMemberAddDiscordEvent extends DiscordEvent {
  execute(client: HazelnetClient, member: GuildMember): void
}

export default <GuildMemberAddDiscordEvent> {
  name: 'guildMemberAdd',
  async execute(client, newGuildMember) {
    try {
      const discordServer = await client.services.discordserver.getDiscordServer(newGuildMember.guild.id);
      activityTracker.applyActivityTracking(newGuildMember.user.id, discordServer);
    } catch (error) {
      client.logger.error(error);
    }
  },
};


