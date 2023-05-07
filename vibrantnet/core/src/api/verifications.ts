import axios from 'axios';
import { BaseApi } from './base';
import { Verification } from '../types/verification/verification';
import { BlockchainType } from '../types/blockchainType';

export class VerificationsApi extends BaseApi {
  async createVerificationRequest(externalAccountId: string, addressToVerify: string): Promise<Verification> {
    const verifications = await axios.post(`${this.apiUrl}/verifications`, {
      blockchain: BlockchainType.CARDANO,
      address: addressToVerify,
      externalAccountId,
    });
    return verifications.data;
  }

  async getVerification(verificationId: number): Promise<Verification> {
    const verification = await axios.get(`${this.apiUrl}/verifications/${verificationId}`);
    return verification.data;
  }

  async removeVerification(verificationId: number) {
    axios.delete(`${this.apiUrl}/verifications/${verificationId}`);
  }
}
