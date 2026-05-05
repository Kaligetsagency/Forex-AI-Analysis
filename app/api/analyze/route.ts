import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { asset, priceData } = await req.json();

    if (!priceData || priceData.length === 0) {
      return NextResponse.json({ error: 'No price data provided' }, { status: 400 });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const systemInstruction = `You are a master quantitative analyst and trading systems architect. Analyze the provided time-series price data for the asset. 
    
You MUST respond strictly with a valid JSON object. Do not include markdown formatting, code blocks, or explanatory text outside the JSON.
Your JSON must strictly adhere to this schema:
{
  "asset": "string",
  "trend_status": "consolidation" | "bullish" | "bearish",
  "recommended_action": "wait" | "buy_stop" | "sell_stop",
  "entry_price": number | null,
  "take_profit": number | null,
  "stop_loss": number | null,
  "reasoning": "string"
}`;

    const prompt = `Asset: ${asset}\nRecent Price Data (Time, Price):\n${JSON.stringify(priceData.slice(-50))}\n\nExecute analysis.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    const analysisJson = JSON.parse(data.candidates[0].content.parts[0].text);
    return NextResponse.json(analysisJson);

  } catch (error) {
    console.error('AI Analysis Failed:', error);
    return NextResponse.json({ 
      error: 'Failed to generate analysis',
      fallback: { recommended_action: "wait", reasoning: "System error, analyzing data locally." }
    }, { status: 500 });
  }
}
