import HazelnetClient from '../utility/hazelnetclient';
import engagementMessageEventHandler from '../events/configure-engagement/messageCreate';

export default {
  cron: '*/15 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running activity tracker update job');
    try {
      const activity = engagementMessageEventHandler.swapActivityData();
      if (activity.size > 0) {
        await client.services.discordserver.updateMemberActivity(Object.fromEntries(activity));
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update activity tracking', error });
    }
  },
};
