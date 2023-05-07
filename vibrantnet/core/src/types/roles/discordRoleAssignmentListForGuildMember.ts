import { DiscordRoleAssignment } from './discordRoleAssignment';

export type DiscordRoleAssignmentListForGuildMember = {
  guildId: string
  userId: string
  assignments: DiscordRoleAssignment[]
};
