import axios from 'axios';
import { BaseApi } from './base';
import { MultiAssetSnapshot } from '../types/cardano/multiAssetSnapshot';

export class SnapshotsApi extends BaseApi {
  async scheduleSnapshot(snapshotTime: string, policyId: string, assetFingerprint?: string): Promise<MultiAssetSnapshot> {
    const newSnapshot = await axios.post(`${this.apiUrl}/snapshots/stake`, {
      snapshotTime,
      policyId,
      assetFingerprint,
    });
    return newSnapshot.data;
  }
}
