export type MultiAssetSnapshot = {
  id?: number
  createTime?: number
  snapshotTime: number
  policyId: string
  assetFingerprint?: string
  tokenWeight: number
  taken: boolean
};
