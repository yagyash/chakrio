// Campaign billing rates — must match META_MARKETING_RATE_INR + CHAKRIO_CAMPAIGN_FEE_INR in backend .env
export const CAMPAIGN_COSTS = {
  totalPerMessage: 1.00,   // charged to property's marketing wallet
  metaFee:         0.83,   // Meta's marketing conversation fee
  chakrioFee:      0.17,   // Chakrio service margin
};
