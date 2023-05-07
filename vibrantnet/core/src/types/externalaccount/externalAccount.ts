import { ExternalAccountType } from './externalAccountType';

export type ExternalAccount = {
  id: string
  type: ExternalAccountType
  referenceId: string
  referenceName: string
  registrationTime: string
  account: number
  premium: boolean
};
