import axios from "axios";
import { MultiAssetSnapshot } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async scheduleSnapshot(snapshotTime: string, policyId: string, assetFingerprint?: string): Promise<MultiAssetSnapshot> {
    const newSnapshot = await axios.post(`${hazelCommunityUrl}/snapshots/stake`, {
      snapshotTime,
      policyId,
      assetFingerprint,
    });
    return newSnapshot.data;
  },
};
