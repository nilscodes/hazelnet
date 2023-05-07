import { ClaimListSnapshotEntry } from './claimListSnapshotEntry'

export type ClaimList = {
    id: number
    name: string
    displayName: string
    description?: string
    createTime?: number
    claimUrl?: string
    claims: ClaimListSnapshotEntry[]
}
