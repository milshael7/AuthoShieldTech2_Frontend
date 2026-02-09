/* =========================================================
   AUTOSHIELD PRICING CONFIG (ADMIN CONTROLLED)
   Frontend-only source of truth
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
