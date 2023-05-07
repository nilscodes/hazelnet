import { PhysicalOrderItem } from './physicalOrderItem'

export type PartialPhysicalOrder = {
    claimListId?: number
    shipTo?: string | null
    country?: string | null
    phone?: string | null
    zipCode?: string | null
    city?: string | null
    street?: string | null
    items?: PhysicalOrderItem[]
    guildId?: string // Only for use within Discord bot
}
