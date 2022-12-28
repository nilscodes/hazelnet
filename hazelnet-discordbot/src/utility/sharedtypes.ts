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

export type ExternalAccountPing = {
    id: string
    sender: string
    senderLocal: string
    sentFromServer: number
    recipient: string
    recipientLocal: string
    recipientAddress: string
    senderMessage: string
    createTime: string
    sentTime: string
    reporter: boolean
}

export type DelegatorRole = {
    id: number
    poolHash?: string
    minimumStake: number
    roleId: string
}

export type TokenOwnershipRole = {
    id: number
    roleId: string
}

export type DiscordServer = {
    id: number
    guildId: string
    getBotLanguage(): string
    formatNumber(num: number): string
    settings?: any
    premium: boolean
}

enum ExternalAccountType {
    DISCORD,
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

export enum WhitelistType {
    CARDANO_ADDRESS,
    DISCORD_ID,
}

export type Whitelist = {
    id: number
    name: string
    displayName: string
    creator: string
    requiredRoleId: string
    createTime: string
    type: WhitelistType
    signupAfter: string
    signupUntil: string
    launchDate?: string
    closed: boolean
    sharedWithServer: string
    logoUrl?: string
}

export type WhitelistSignupContainer = {
    whitelistId: number
    signup: WhitelistSignup
}

export type WhitelistSignup = {
    externalAccountId: string
    address?: string
    signupTime?: string
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
    CARDANO,
    ETHEREUM
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
    image?: string
}