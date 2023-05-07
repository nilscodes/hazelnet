import { WithRoleId } from './withRoleId';

export type DelegatorRole = {
  id: number
  poolHash?: string
  minimumStake: number
} & WithRoleId;
