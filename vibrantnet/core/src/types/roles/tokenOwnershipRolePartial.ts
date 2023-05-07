import { TokenOwnershipAggregationType } from './tokenOwnershipAggregationType';
import { TokenRoleAssetInfo } from '../cardano/tokenRoleAssetInfo';
import { TokenStakingType } from '../cardano/tokenStakingType';

export type TokenOwnershipRolePartial = {
  acceptedAssets?: TokenRoleAssetInfo[]
  minimumTokenQuantity?: string
  maximumTokenQuantity?: string
  roleId?: string
  aggregationType?: TokenOwnershipAggregationType
  stakingType?: TokenStakingType
};
