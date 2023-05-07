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
};
