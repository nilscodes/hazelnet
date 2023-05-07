type StakepoolInfo = {
  hash: string
  view: string
  ticker: string
  name: string
  website?: string
  description?: string
};

export type Stakepool = {
  poolHash: string,
  info: StakepoolInfo
};
