export type MintAnnouncement = {
  guildId: string
  channelId: string
  policyId: string
  assetFingerprint: string
  referenceTokenAssetFingerprint?: string
  assetNameHex: string
  assetName: string
  displayName: string
  assetImageUrl?: string
  mintDate: number
  rarityRank?: number
  highlightAttributeDisplayName?: string
  highlightAttributeValue?: string
};
