import crypto from 'crypto';
import { env } from '../../../../config/env';

export async function initiateJazzCash(txnRef: string, amount: number) {
  const merchantId    = env.JAZZCASH_MERCHANT_ID ?? '';
  const password      = env.JAZZCASH_PASSWORD ?? '';
  const integritySalt = env.JAZZCASH_INTEGRITY_SALT ?? '';

  const dateTime  = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const expireTime = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

  const amtStr = (amount * 100).toFixed(0); // JazzCash expects paisas

  const hashStr = [
    integritySalt, dateTime, '', amtStr, '', merchantId,
    '', '', 'PKR', '', '', txnRef, '', 'EN',
    password, 'MWALLET', expireTime, '',
  ].join('&');

  const hash = crypto.createHmac('sha256', integritySalt).update(hashStr).digest('hex').toUpperCase();

  return {
    merchant_id:         merchantId,
    pp_TxnRefNo:         txnRef,
    pp_Amount:           amtStr,
    pp_TxnCurrency:      'PKR',
    pp_TxnDateTime:      dateTime,
    pp_TxnExpiryDateTime: expireTime,
    pp_SecureHash:       hash,
    pp_Password:         password,
    ppmpf_1:             '1',
    ppmpf_2:             '2',
    ppmpf_3:             '3',
    ppmpf_4:             '4',
    ppmpf_5:             '5',
    gatewayUrl:          'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
  };
}
