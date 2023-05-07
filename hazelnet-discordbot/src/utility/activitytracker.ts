import { DiscordServer } from '@vibrantnet/core';

interface EngagementInteractionHandler {
  activity: Map<String, Number>
  applyActivityTracking(userId: string, discordServer: DiscordServer): void
  swapActivityData(): Map<String, Number>
}

export default <EngagementInteractionHandler> {
  activity: new Map<String, Number>(),

  swapActivityData() {
    const oldActivity = this.activity;
    this.activity = new Map<String, Number>();
    return oldActivity;
  },

  async applyActivityTracking(userId, discordServer) {
    if (discordServer?.settings?.ACTIVITY_REMINDER) {
      this.activity.set(`${discordServer.guildId}-${userId}`, new Date().getTime());
    }
  },
};