import fs from 'fs';
import Stripe from 'stripe';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function test() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRO_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000',
      cancel_url: 'http://localhost:3000'
    });
    console.log('SUCCESS:', session.url);
  } catch(e: any) {
    console.error('ERROR:', e.message);
  }
}

test();
