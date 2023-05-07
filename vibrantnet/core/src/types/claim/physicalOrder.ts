import { PhysicalOrderItem } from './physicalOrderItem'

export type PhysicalOrder = {
    [key: string]: any,
    id: number
    externalAccountId: string
    createTime?: number
    claimListId: number
    shipTo: string
    country: string
    phone?: string
    zipCode: string
    city: string
    street: string
    items: PhysicalOrderItem[]
    processed: boolean
    trackingNumber?: string
    guildId: string // Only for use within Discord bot
}
