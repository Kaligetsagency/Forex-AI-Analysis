const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// AI ANALYSIS ROUTE (Gemini)
// ==========================================
app.post('/api/analyze', async (req, res) => {
  try {
    const { asset, priceData } = req.body;

    if (!priceData || priceData.length === 0) {
      return res.status(400).json({ error: 'No price data provided' });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const systemInstruction = `You are a master quantitative analyst. Analyze the provided time-series price data. 
    You MUST respond strictly with a valid JSON object matching this schema exactly, with no markdown formatting:
    {
      "asset": "string",
      "trend_status": "consolidation" | "bullish" | "bearish",
      "recommended_action": "wait" | "buy_stop" | "sell_stop",
      "entry_price": number | null,
      "take_profit": number | null,
      "stop_loss": number | null,
      "reasoning": "string"
    }`;

    const prompt = `Asset: ${asset}\nRecent Price Data:\n${JSON.stringify(priceData.slice(-50))}\nExecute analysis.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.2 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');

    const analysisJson = JSON.parse(data.candidates[0].content.parts[0].text);
    res.json(analysisJson);

  } catch (error) {
    console.error('AI Analysis Failed:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// ==========================================
// MONETIZATION ROUTES (Snippe)
// ==========================================
app.post('/api/checkout', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    const response = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `sub-${userId}-${Date.now()}`
      },
      body: JSON.stringify({
        payment_type: "card",
        details: { amount: 50000, currency: "TZS" },
        reference: userId,
        phone_number: phoneNumber
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Payment failed');

    res.json({ url: data.payment_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const signature = req.headers['x-snippe-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SNIPPE_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    if (event.status === 'successful' || event.status === 'completed') {
      const userId = event.reference;
      console.log(`Payment successful for user: ${userId}`);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

// CRITICAL FOR VERCEL: Export the app instead of app.listen()
module.exports = app;
