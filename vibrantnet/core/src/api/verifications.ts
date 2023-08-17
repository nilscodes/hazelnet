import axios from 'axios';
import { BaseApi } from './base';
import { Verification } from '../types/verification/verification';
import { BlockchainType } from '../types/blockchainType';
import { ExposedWallet } from '../types/verification/exposedWallet';
import { ExposedWalletPartial } from '../types/verification/exposedWalletPartial';

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

  async getExposedWallets(verificationId: number): Promise<ExposedWallet[]> {
    const exposedWallets = await axios.get(`${this.apiUrl}/verifications/${verificationId}/exposedwallets`);
    return exposedWallets.data;
  }

  async addExposedWallet(verificationId: number, exposedWallet: ExposedWalletPartial): Promise<ExposedWallet> {
    const addedExposedWallet = await axios.post(`${this.apiUrl}/verifications/${verificationId}/exposedwallets`, exposedWallet);
    return addedExposedWallet.data;
  }

  async deleteExposedWallet(verificationId: number, exposedWalletId: string) {
    await axios.delete(`${this.apiUrl}/verifications/${verificationId}/exposedwallets/${exposedWalletId}`);
  }
}
