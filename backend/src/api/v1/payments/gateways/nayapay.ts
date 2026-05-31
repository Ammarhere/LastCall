import axios from 'axios';
import { env } from '../../../../config/env';

export async function initiateNayaPay(txnRef: string, amount: number) {
  const apiKey = env.NAYAPAY_API_KEY ?? '';

  const response = await axios.post(
    'https://api.nayapay.com/api/v1/payments',
    {
      orderId:     txnRef,
      amount:      amount.toFixed(2),
      currency:    'PKR',
      description: 'Last Call food bag',
    },
    {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    },
  ).catch(() => ({ data: { checkoutUrl: null } }));

  return {
    checkoutUrl: response.data.checkoutUrl,
    txnRef,
  };
}
