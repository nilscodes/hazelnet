export type DiscordServerPremiumInfo = {
  totalDelegation: number
  maxDelegation: number
  monthlyCost: number
  actualMonthlyCost: number
  guildMemberCount: number
  remainingBalance: number
  lastBillingGuildMemberCount: number
  lastBillingTime?: number
  lastBillingAmount: number
  premiumUntil?: number
  currentPremium: boolean
};
