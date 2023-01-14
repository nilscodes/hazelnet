import axios from "axios";
import { Verification } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async createVerificationRequest(externalAccountId: string, addressToVerify: string): Promise<Verification> {
    const verifications = await axios.post(`${hazelCommunityUrl}/verifications`, {
      blockchain: 'CARDANO',
      address: addressToVerify,
      externalAccountId,
    });
    return verifications.data;
  },
  async getVerification(verificationId: number): Promise<Verification> {
    const verification = await axios.get(`${hazelCommunityUrl}/verifications/${verificationId}`);
    return verification.data;
  },
  async removeVerification(verificationId: number) {
    axios.delete(`${hazelCommunityUrl}/verifications/${verificationId}`);
  },
};
