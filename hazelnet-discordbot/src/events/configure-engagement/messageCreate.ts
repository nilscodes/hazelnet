import { AugmentedMessage } from '../../utility/hazelnetclient';

interface EngagementInteractionHandler {
  activity: Map<String, Number>
  applyActivityTracking(message: AugmentedMessage, discordServer: any): void
  swapActivityData(): Map<String, Number>
}

export default <EngagementInteractionHandler> {
  activity: new Map<String, Number>(),

  swapActivityData() {
    const oldActivity = this.activity;
    this.activity = new Map<String, Number>();
    return oldActivity;
  },

  async applyActivityTracking(message, discordServer) {
    if (discordServer?.settings?.ACTIVITY_REMINDER) {
      this.activity.set(`${discordServer.guildId}-${message.author.id}`, new Date().getTime());
    }
  },
};