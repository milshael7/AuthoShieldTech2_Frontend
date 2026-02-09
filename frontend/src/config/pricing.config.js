/* =========================================================
   AUTOSHIELD PRICING CONFIG — ADMIN CONTROLLED (LOCKED)
   File: frontend/src/config/pricing.config.js

   Purpose:
   - Single source of truth for pricing
   - Editable by admin panel later
   - Used by public Pricing page
   - NO business logic
   - NO calculations
   ========================================================= */

export const PRICING = {
  individual: {
    monthly: 250,

    yearlyMultiplier: 12,
    yearlyFeePercent: 5,

    autodev: {
      firstMonth: 100,
      ongoing: 450,
    },
  },

  smallCompany: {
    start: 350,
    max: 700,

    userLimit: "10–15",
    yearlyFeePercent: 5,
  },

  company: {
    start: 1000,
    afterSixMonths: 1500,

    yearlyFeePercent: 5,
  },
};
