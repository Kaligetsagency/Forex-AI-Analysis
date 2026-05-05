import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, email, phoneNumber } = await req.json();

    // Initiate payment via Snippe API
    const response = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `sub-${userId}-${Date.now()}` // Prevents duplicate transactions
      },
      body: JSON.stringify({
        payment_type: "card", // Card redirects to checkout. Use "mobile" for USSD push.
        details: { 
          amount: 50000, // E.g., 50,000 TZS monthly subscription
          currency: "TZS" 
        },
        reference: userId, // Pass your internal DB user ID as reference
        phone_number: phoneNumber // Required if switching to payment_type: "mobile"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Payment initiation failed');
    }

    // Snippe returns a payment_url for 'card' type transactions
    return NextResponse.json({ url: data.payment_url });
    
  } catch (error: any) {
    console.error("Snippe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
