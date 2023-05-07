import { DiscordMarketplaceChannelType } from '../discordMarketplaceChannelType';
import { MetadataFilter } from '../filter/metadataFilter';
import { TokenOwnershipAggregationType } from '../roles/tokenOwnershipAggregationType';
import { Marketplace } from './marketplace';

export type MarketplaceChannel = {
  id?: number
  creator?: string
  type: DiscordMarketplaceChannelType
  policyId: string
  marketplaces: Marketplace[]
  createTime?: number
  channelId: string
  minimumValue?: number
  maximumValue?: number | null
  filters?: MetadataFilter[]
  aggregationType?: TokenOwnershipAggregationType
  highlightAttributeName?: string | null
  highlightAttributeDisplayName?: string | null
};
