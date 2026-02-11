// KeyVault.js
// Secure Exchange Credential Manager (Persistent + Hardened)

class KeyVault {
  constructor() {
    this.storageKey = "trading.exchange.keys";
    this.keys = this.load();
  }

  /* ================= LOAD / SAVE ================= */

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  persist() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.keys)
      );
    } catch {
      // fail silently
    }
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

    this.persist();
    return true;
  }

  /* ================= REMOVE KEY ================= */

  removeKey(exchange) {
    if (!this.keys[exchange]) return false;

    delete this.keys[exchange];
    this.persist();
    return true;
  }

  /* ================= ENABLE / DISABLE ================= */

  setEnabled(exchange, state) {
    if (!this.keys[exchange]) return false;

    this.keys[exchange].enabled = !!state;
    this.persist();
    return true;
  }

  /* ================= GET KEY (LIVE USE) ================= */

  getKey(exchange) {
    const key = this.keys[exchange];

    if (!key) {
      throw new Error(`No key configured for ${exchange}`);
    }

    if (!key.enabled) {
      throw new Error(`Exchange ${exchange} disabled`);
    }

    return key;
  }

  /* ================= SAFE LIST (UI ONLY) ================= */

  listExchanges() {
    return Object.keys(this.keys).map((ex) => ({
      exchange: ex,
      enabled: this.keys[ex].enabled,
      addedAt: this.keys[ex].addedAt,
      maskedKey:
        this.keys[ex].apiKey.slice(0, 4) + "****",
    }));
  }

  /* ================= CLEAR ALL ================= */

  clearAll() {
    this.keys = {};
    this.persist();
  }
}

export const keyVault = new KeyVault();
