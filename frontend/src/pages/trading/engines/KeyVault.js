// KeyVault.js
// In-memory secure exchange credential manager (UI-controlled)

class KeyVault {
  constructor() {
    this.keys = {};
  }

  /* ================= ADD KEY ================= */

  addKey(exchange, { apiKey, secret }) {
    if (!exchange || !apiKey || !secret) {
      throw new Error("Invalid key payload");
    }

    this.keys[exchange] = {
      apiKey,
      secret,
      enabled: true,
      addedAt: Date.now(),
    };

    return true;
  }

  /* ================= REMOVE KEY ================= */

  removeKey(exchange) {
    delete this.keys[exchange];
  }

  /* ================= ENABLE / DISABLE ================= */

  setEnabled(exchange, state) {
    if (!this.keys[exchange]) return;
    this.keys[exchange].enabled = state;
  }

  /* ================= GET KEY ================= */

  getKey(exchange) {
    const key = this.keys[exchange];

    if (!key || !key.enabled) {
      throw new Error(`Exchange ${exchange} not enabled`);
    }

    return key;
  }

  /* ================= STATUS ================= */

  listExchanges() {
    return Object.keys(this.keys).map((ex) => ({
      exchange: ex,
      enabled: this.keys[ex].enabled,
    }));
  }
}

export const keyVault = new KeyVault();
