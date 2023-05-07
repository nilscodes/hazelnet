import { ClaimList } from './claimList'
import { PhysicalProduct } from './physicalProduct'

export type ClaimListsWithProducts = {
    claimLists: ClaimList[]
    claimableProducts: PhysicalProduct[]
}
