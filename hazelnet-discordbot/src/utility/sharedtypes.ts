import { ActionRowBuilder, APIEmbed, APIEmbedField, MessageActionRowComponentBuilder } from "discord.js"
import { DiscordRequiredRole } from "./polltypes"

export type EmbedAndComponents = {
    embed: APIEmbed
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export type EmbedFieldsAndComponents = {
    detailFields: APIEmbedField[]
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

type StakepoolInfo = {
    hash: string
    view: string
    ticker: string
    name: string
    website?: string
    description?: string
}

export type Stakepool = {
    poolHash: string,
    info: StakepoolInfo
}

export type TokenPolicy = {
    policyId: string
    projectName: string
}

export type WithRoleId = {
    roleId: string
}

export type DelegatorRole = {
    id: number
    poolHash?: string
    minimumStake: number
} & WithRoleId

export type TokenOwnershipRole = {
    id: number
    acceptedAssets: TokenRoleAssetInfo[]
    minimumTokenQuantity: string
    maximumTokenQuantity: string | null
    filters: MetadataFilter[]
    roleId: string
    aggregationType: TokenOwnershipAggregationType
    stakingType: TokenStakingType
} & WithRoleId

export type TokenOwnershipRolePartial = {
    acceptedAssets?: TokenRoleAssetInfo[]
    minimumTokenQuantity?: string
    maximumTokenQuantity?: string
    roleId?: string
    aggregationType?: TokenOwnershipAggregationType
    stakingType?: TokenStakingType
}

export enum TokenOwnershipAggregationType {
    ANY_POLICY_FILTERED_AND = 'ANY_POLICY_FILTERED_AND',
    ANY_POLICY_FILTERED_OR = 'ANY_POLICY_FILTERED_OR',
    ANY_POLICY_FILTERED_ONE_EACH = 'ANY_POLICY_FILTERED_ONE_EACH',
    EVERY_POLICY_FILTERED_OR = 'EVERY_POLICY_FILTERED_OR',
}

export enum TokenStakingType {
    NONE = 'NONE',
    MUTANT_STAKING = 'MUTANT_STAKING',
}

export type MetadataFilter = {
    id: number
    attributeName: string
    operator: AttributeOperatorType
    attributeValue: string
}

export enum AttributeOperatorType {
    EQUALS = 'EQUALS',
    NOTEQUALS = 'NOTEQUALS',
    CONTAINS = 'CONTAINS',
    NOTCONTAINS = 'NOTCONTAINS',
    STARTSWITH = 'STARTSWITH',
    ENDSWITH = 'ENDSWITH',
    REGEX = 'REGEX',
}

export type TokenRoleAssetInfo = {
    policyId: string
    assetFingerprint: string | null
}

export type DiscordServer = {
    id: number
    guildId: string
    guildName: string
    getBotLanguage(): string
    getBasicEditionThumbnail(): string
    getAdvertisement(): AdvertisementData
    formatNumber(num: number): string
    settings: Settings
    premium: boolean
    active: boolean
}

type AdvertisementData = {
    text: string
    logo: string
}

export type DiscordServerPartial = {
    guildName?: string
    guildOwner?: string
    guildMemberCount?: number
    active?: boolean
}

enum ExternalAccountType {
    DISCORD = 'DISCORD',
}

export type ExternalAccount = {
    id: string
    type: ExternalAccountType
    referenceId: string
    referenceName: string
    registrationTime: string
    account: number
    premium: boolean
}

export type DiscordServerMember = {
    externalAccountId: string
    joinTime: string
    premiumSupport: boolean
}

export type DiscordMemberPartial = {
    premiumSupport: boolean
}

export type VerificationImport = {
    id: string
    referenceId: string
    type: ExternalAccountType
    address: string
    source: string
}

export enum WhitelistType {
    CARDANO_ADDRESS = 'CARDANO_ADDRESS',
    DISCORD_ID = 'DISCORD_ID',
}

export type Whitelist = {
    id: number
    name: string
    displayName: string
    creator: string
    requiredRoles: DiscordRequiredRole[]
    awardedRole?: string
    createTime: string
    type: WhitelistType
    signupAfter: string
    signupUntil: string
    launchDate?: string
    maxUsers: number
    currentUsers: number
    closed: boolean
    sharedWithServer: number
    logoUrl?: string
}

export type WhitelistPartial = {
    displayName?: string | null
    maxUsers?: number | null
    signupAfter?: string | null
    signupUntil?: string | null
    closed?: boolean | null
    sharedWithServer?: number | null
    launchDate?: string | null
    logoUrl?: string | null
    awardedRole?: string | null
    requiredRoles?: DiscordRequiredRole[] | null
}

export type SharedWhitelist = {
    guildId: string
    guildName: string
    whitelistName: string
    whitelistDisplayName: string
    type: WhitelistType
    signups: SharedWhitelistSignup[],
}

export type WhitelistSignupContainer = {
    whitelistId: number
    signup: WhitelistSignup
}

export type WhitelistSignup = {
    externalAccountId: string
    address?: string
    signupTime: number
}

export type SharedWhitelistSignup = {
    externalAccountId: string
    address?: string
    referenceId?: string
    referenceName?: string
    referenceType: ExternalAccountType
    signupTime: string
}

export type SummarizedWhitelistSignup = {
    externalAccountId: string
    guildId: string
    guildName: string
    whitelistDisplayName: string
    signupTime: string
    launchDate?: string
    logoUrl?: string
}

enum BlockchainType {
    CARDANO = 'CARDANO',
    ETHEREUM = 'ETHEREUM',
}

export type Account = {
    id: string
    settings: Settings
}

export type Settings = {
    [index: string]: string
}

export type Verification = {
    id?: number
    amount: number,
    blockchain: BlockchainType,
    address: string,
    cardanoStakeAddress?: string
    transactionHash?: string
    externalAccount: string
    validAfter: string
    validBefore: string
    confirmed: boolean
    confirmedAt?: string
    obsolete: boolean
    succeededBy?: number
}

export type StakeAddressAndHandle = {
    stakeAddress: string
    handle: Handle
}

export type Handle = {
    handle: string
    address?: string
    resolved: boolean
    assetFingerprint?: string
}

export type DiscordRoleAssignment = {
    guildId: string
    userId: string
    roleId: string
}

export type DiscordRoleAssignmentListForGuildMember = {
    guildId: string
    userId: string
    assignments: DiscordRoleAssignment[]
}

export type MarketplaceChannel = {
    id?: number
    creator?: string
    type: DiscordMarketplaceChannelType
    policyId: string
    marketplaces: Marketplace[]
    createTime?: number
    channelId: string
    minimumValue?: number
    maximumValue?: number | null
    filters?: MetadataFilter[]
    aggregationType?: TokenOwnershipAggregationType
    highlightAttributeName?: string | null
    highlightAttributeDisplayName?: string | null
}

export type MarketplaceChannelPartial = {
    channelId: string
    minimumValue?: number | null
    maximumValue?: number | null
    marketplaces?: Marketplace[]
    filters?: MetadataFilter[]
    aggregationType?: TokenOwnershipAggregationType
    highlightAttributeName?: string | null
    highlightAttributeDisplayName?: string | null

}

export enum DiscordMarketplaceChannelType {
    SALES = 'SALES',
    MINT = 'MINT',
    LISTINGS = 'LISTINGS',
}

export enum Marketplace {
    JPGSTORE = 'JPGSTORE',
    MINT_ONCHAIN = 'MINT_ONCHAIN',
}

export type ListingAnnouncement = {
    guildId: string
    channelId: string
    policyId: string
    assetFingerprint: string
    assetNameHex: string
    assetName: string
    displayName: string
    source: Marketplace
    marketplaceAssetUrl: string
    assetImageUrl?: string
    price: number
    listingDate: number
    rarityRank?: number
    highlightAttributeDisplayName?: string
    highlightAttributeValue?: string
}

export type SaleAnnouncement = {
    guildId: string
    channelId: string
    policyId: string
    assetFingerprint: string
    assetNameHex: string
    assetName: string
    displayName: string
    source: Marketplace
    marketplaceAssetUrl: string
    assetImageUrl?: string
    price: number
    saleDate: number
    rarityRank?: number
    type: SalesType
    highlightAttributeDisplayName?: string
    highlightAttributeValue?: string
}

export enum SalesType {
    BUY = 'BUY',
    OFFER = 'OFFER',
}

export enum MarketplaceLinkType {
    MARKETPLACE = 'MARKETPLACE',
    PIXLPAGE = 'PIXLPAGE',
    CNFTJUNGLE = 'CNFTJUNGLE',
    POOLPMHANDLE = 'POOLPMHANDLE',
    POOLPM = 'POOLPM',
}

export type MintAnnouncement = {
    guildId: string
    channelId: string
    policyId: string
    assetFingerprint: string
    assetNameHex: string
    assetName: string
    displayName: string
    assetImageUrl?: string
    mintDate: number
    rarityRank?: number
    highlightAttributeDisplayName?: string
    highlightAttributeValue?: string
}

export type ExternalAccountPing = {
    id: string
    sender: string
    senderLocal?: string
    sentFromServer?: number
    recipient: string
    recipientLocal?: string
    recipientAddress: string
    senderMessage?: string
    createTime: number
    sentTime: number
    reported?: boolean
}

export type ExternalAccountPingPartial = {
    sentTime?: string
    reported?: boolean
}

export type MultiAssetSnapshot = {
    id?: number
    createTime?: number
    snapshotTime: number
    policyId: string
    assetFingerprint?: string
    tokenWeight: number
    taken: boolean
}

export type ExternalAccountPremiumInfo = {
    discordServers: string[],
    stakeAmount: number,
    tokenBalance: number,
    premium: boolean
}

export type ClaimListsWithProducts = {
    claimLists: ClaimList[]
    claimableProducts: PhysicalProduct[]
}

export type PhysicalProduct = {
    id: number
    name: string
    variations: any
    available: number
}

export type ClaimList = {
    id: number
    name: string
    displayName: string
    description?: string
    createTime?: number
    claimUrl?: string
    claims: ClaimListSnapshotEntry[]
}

export type ClaimListSnapshotEntry = {
    stakeAddress: string
    claimableProduct: number
    claimableCount: number
    orderId?: number
}

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

export type PhysicalOrderItem = {
    productId: number
    count: number
    variation: any
}

export type TokenMetadata = {
    subject: string,
    policy: string,
    name?: object,
    description?: object,
    url?: object,
    ticker?: TickerTokenMetadata,
    decimals?: DecimalsTokenMetadata,
    logo?: object,
}

type TickerTokenMetadata = {
    value?: string
}

type DecimalsTokenMetadata = {
    value?: number
}

export type VoteData = {
    votes: VoteMap
}

type VoteMap = {
    [index: string]: number
}

export type DiscordServerPremiumInfo = {
    totalDelegation: number
    maxDelegation: number
    monthlyCost: number
    actualMonthlyCost: number
    guildMemberCount: number
    remainingBalance: number
    lastBillingGuildMemberCount: number
    lastBillingTime?: number
    lastBillingAmount: number
    premiumUntil?: number
    currentPremium: boolean
}

export type IncomingDiscordPayment = {
    id: number
    receivingAddress: string
    amount: number
    validAfter: number
    validBefore: number
}

export type ActivityMap = {
    [index: string]: number
}

export type DiscordMintCounterUpdate = {
    guildId: string
    channelId: string
    policyId: string
    tokenCount: number
    maxCount: number
}

export type DiscordWidgetUpdate = {
    guildId: string
    channelId: string
}

export type DiscordRoleCounterUpdate = {
    guildId: string
    channelId: string
    roleId: string
}

export type DiscordGiveawayUpdate = {
    guildId: string
    giveawayId: number
    channelId: string
    messageId: string
}

export type DiscordPollUpdate = {
    guildId: string
    pollId: number
    channelId: string
    messageId: string
}

export type EpochDetails = {
    epochNo: number
    blockCount: number
    transactionAcount: number
    fees: string
    outSum: string
    startTime: number
    secondsAchieved: number
    estimatedSecondsLeft: number
}

export type PolicyInfo = {
    policyId: string
    tokenCount: number
}