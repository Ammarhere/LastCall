import axios from 'axios';
import { env } from '../../../../config/env';

export async function initiateSadaPay(txnRef: string, amount: number) {
  const secretKey = env.SADAPAY_SECRET_KEY ?? '';

  // SadaPay uses a Stripe-compatible API
  const response = await axios.post(
    'https://api.sadapay.pk/v1/payment_intents',
    {
      amount:   Math.round(amount * 100), // paisas
      currency: 'pkr',
      metadata: { txnRef },
    },
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  ).catch(() => ({ data: { client_secret: null, id: null } }));

  return {
    clientSecret:  response.data.client_secret,
    paymentIntentId: response.data.id,
    txnRef,
  };
}
