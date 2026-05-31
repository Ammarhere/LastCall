import { env } from '../../../../config/env';

export async function initiateRaast(txnRef: string, amount: number) {
  // Raast (SBP instant payment rail) — use IBAN-based transfer
  return {
    method:      'RAAST',
    txnRef,
    amount,
    currency:    'PKR',
    ibanAccount: 'PK00XXXX0000000000000000', // Replace with actual Last Call IBAN
    instructions: `Transfer Rs. ${amount} to Last Call via Raast. Use reference: ${txnRef}`,
  };
}
