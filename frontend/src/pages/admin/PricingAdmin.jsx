// frontend/src/pages/admin/PricingAdmin.jsx
// AutoShield Tech — Admin Pricing Control
//
// PURPOSE:
// - Admin-only pricing visibility & control
// - UI-only (no persistence yet)
// - Reads from PRICING config
// - Prepares backend-controlled pricing later
//
// RULES:
// - NO payments
// - NO Stripe
// - NO auto-upgrades
// - UI SAFE ONLY

import React, { useState } from "react";
import { PRICING } from "../../config/pricing.config";
import "../../styles/main.css";

export default function PricingAdmin() {
  // Local editable copy (UI only)
  const [pricing, setPricing] = useState(JSON.parse(JSON.stringify(PRICING)));

  function update(path, value) {
    setPricing(prev => {
      const copy = { ...prev };
      let ref = copy;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return copy;
    });
  }

  return (
    <div className="container">
      <h1>Pricing Control</h1>
      <p className="muted">
        Adjust platform pricing. Changes are not live until backend is connected.
      </p>

      {/* ================= INDIVIDUAL ================= */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Individual</h2>

        <label>
          Monthly Price
          <input
            type="number"
            value={pricing.individual.monthly}
            onChange={e =>
              update(["individual", "monthly"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.individual.yearlyFeePercent}
            onChange={e =>
              update(
                ["individual", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <h4 style={{ marginTop: 12 }}>AutoDev 6.5</h4>

        <label>
          First Month
          <input
            type="number"
            value={pricing.individual.autodev.firstMonth}
            onChange={e =>
              update(
                ["individual", "autodev", "firstMonth"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <label>
          Ongoing Monthly
          <input
            type="number"
            value={pricing.individual.autodev.ongoing}
            onChange={e =>
              update(
                ["individual", "autodev", "ongoing"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= SMALL COMPANY ================= */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Small Company</h2>

        <label>
          Starting Price
          <input
            type="number"
            value={pricing.smallCompany.start}
            onChange={e =>
              update(["smallCompany", "start"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Max Price
          <input
            type="number"
            value={pricing.smallCompany.max}
            onChange={e =>
              update(["smallCompany", "max"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.smallCompany.yearlyFeePercent}
            onChange={e =>
              update(
                ["smallCompany", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= COMPANY ================= */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Company</h2>

        <label>
          Starting Price
          <input
            type="number"
            value={pricing.company.start}
            onChange={e =>
              update(["company", "start"], Number(e.target.value))
            }
          />
        </label>

        <label>
          After 6 Months
          <input
            type="number"
            value={pricing.company.afterSixMonths}
            onChange={e =>
              update(
                ["company", "afterSixMonths"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.company.yearlyFeePercent}
            onChange={e =>
              update(
                ["company", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      <p className="muted" style={{ marginTop: 20 }}>
        ⚠️ These changes are preview-only. Backend persistence will be added later.
      </p>
    </div>
  );
}
