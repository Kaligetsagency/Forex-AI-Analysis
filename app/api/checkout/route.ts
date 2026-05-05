import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, email, phoneNumber } = await req.json();

    const response = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `sub-${userId}-${Date.now()}` 
      },
      body: JSON.stringify({
        payment_type: "card", 
        details: { 
          amount: 50000, 
          currency: "TZS" 
        },
        reference: userId, 
        phone_number: phoneNumber 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Payment initiation failed');
    }

    return NextResponse.json({ url: data.payment_url });
    
  } catch (error: any) {
    console.error("Snippe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
