const express = require("express");
const router = express.Router();

const { callOpenAI } = require("../services/aiChat");

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { messages, context } = req.body || {};

    // Basic guardrails
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, error: "messages[] required" });
    }

    const result = await callOpenAI({ messages, context });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.json({ ok: true, content: result.content });
  } catch (err) {
    console.error("[ai] /chat error:", err);
    return res.status(500).json({ ok: false, error: "AI chat failed" });
  }
});

module.exports = router;
