import { MetadataFilter } from '../filter/metadataFilter';
import { TokenOwnershipAggregationType } from '../roles/tokenOwnershipAggregationType';
import { Marketplace } from './marketplace';

export type MarketplaceChannelPartial = {
  channelId: string
  minimumValue?: number | null
  maximumValue?: number | null
  marketplaces?: Marketplace[]
  filters?: MetadataFilter[]
  aggregationType?: TokenOwnershipAggregationType
  highlightAttributeName?: string | null
  highlightAttributeDisplayName?: string | null
};
