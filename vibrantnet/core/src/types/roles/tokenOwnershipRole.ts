import { MetadataFilter } from '../filter/metadataFilter';
import { TokenOwnershipAggregationType } from './tokenOwnershipAggregationType';
import { TokenRoleAssetInfo } from '../cardano/tokenRoleAssetInfo';
import { TokenStakingType } from '../cardano/tokenStakingType';
import { WithRoleId } from './withRoleId';

export type TokenOwnershipRole = {
  id: number
  acceptedAssets: TokenRoleAssetInfo[]
  minimumTokenQuantity: string
  maximumTokenQuantity: string | null
  filters: MetadataFilter[]
  roleId: string
  aggregationType: TokenOwnershipAggregationType
  stakingType: TokenStakingType
} & WithRoleId;
