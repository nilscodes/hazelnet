import { WithRoleId } from './withRoleId';

export type DRepDelegatorRole = {
  id: number
  dRepHash?: string
  minimumStake: number,
  maximumStake?: number,
} & WithRoleId;
