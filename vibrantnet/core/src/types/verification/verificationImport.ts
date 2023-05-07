import { ExternalAccountType } from '../externalaccount/externalAccountType'

export type VerificationImport = {
    id: string
    referenceId: string
    type: ExternalAccountType
    address: string
    source: string
}
