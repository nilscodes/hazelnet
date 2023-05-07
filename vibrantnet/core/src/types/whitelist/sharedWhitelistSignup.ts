import { ExternalAccountType } from '../externalaccount/externalAccountType';

export type SharedWhitelistSignup = {
  externalAccountId: string
  address?: string
  referenceId?: string
  referenceName?: string
  referenceType: ExternalAccountType
  signupTime: string
};
