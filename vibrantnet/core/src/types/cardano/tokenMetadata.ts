export type TokenMetadata = {
  subject: string
  policy: string
  name?: object
  description?: object
  url?: object
  ticker?: TickerTokenMetadata
  decimals?: DecimalsTokenMetadata
  logo?: object
};

type TickerTokenMetadata = {
  value?: string
};

type DecimalsTokenMetadata = {
  value?: number
};
