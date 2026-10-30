// Must match CAMPAIGN_PRICE_INR in the backend (chakrio-agent config.py), excluding GST.
export const CAMPAIGN_COSTS = {
  totalPerMessage: 1.25,   // deducted from the marketing wallet per delivered message
  gstRate:         0.18,   // added to the top-up payment; the wallet is credited the amount before GST
};
