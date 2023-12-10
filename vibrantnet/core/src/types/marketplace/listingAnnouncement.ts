import { Marketplace } from './marketplace';

export type ListingAnnouncement = {
  guildId: string
  channelId: string
  policyId: string
  assetFingerprint: string
  referenceTokenAssetFingerprint?: string
  assetNameHex: string
  assetName: string
  displayName: string
  source: Marketplace
  marketplaceAssetUrl: string
  assetImageUrl?: string
  price: number
  listingDate: number
  rarityRank?: number
  highlightAttributeDisplayName?: string
  highlightAttributeValue?: string
};
