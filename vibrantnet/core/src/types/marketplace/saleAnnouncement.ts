import { Marketplace } from './marketplace';
import { SalesType } from './salesType';

export type SaleAnnouncement = {
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
  saleDate: number
  rarityRank?: number
  type: SalesType
  highlightAttributeDisplayName?: string
  highlightAttributeValue?: string
};
