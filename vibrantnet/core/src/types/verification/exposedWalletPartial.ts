import { ExposedWallet } from './exposedWallet';

export interface ExposedWalletPartial extends Omit<ExposedWallet, 'id' | 'exposedAt'> {
  id?: number,
  exposedAt?: string
}
