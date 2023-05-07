import { BlockchainType } from '../blockchainType';

export type Verification = {
  id?: number
  amount: number,
  blockchain: BlockchainType,
  address: string,
  cardanoStakeAddress?: string
  transactionHash?: string
  externalAccount: string
  validAfter: string
  validBefore: string
  confirmed: boolean
  confirmedAt?: string
  obsolete: boolean
  succeededBy?: number
};
