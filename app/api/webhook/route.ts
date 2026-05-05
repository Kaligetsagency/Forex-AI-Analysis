import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-snippe-signature') as string;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.SNIPPE_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.status === 'successful' || event.status === 'completed') {
      const userId = event.reference; 
      
      // TODO: Update database to grant access
      console.log(`Snippe payment successful. Subscription active for user: ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Snippe Webhook Error:", error);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }
}
