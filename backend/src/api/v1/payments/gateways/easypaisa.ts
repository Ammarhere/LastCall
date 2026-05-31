import crypto from 'crypto';
import { env } from '../../../../config/env';

export async function initiateEasypaisa(txnRef: string, amount: number) {
  const storeId  = env.EASYPAISA_STORE_ID ?? '';
  const hashKey  = env.EASYPAISA_HASH_KEY ?? '';
  const amtStr   = amount.toFixed(2);
  const dateTime = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

  const hashStr = `amount=${amtStr}&orderRefNum=${txnRef}&paymentMethod=MA_ACCOUNT&postBackURL=&storeId=${storeId}&timeStamp=${dateTime}&token=${hashKey}`;
  const hash = crypto.createHash('md5').update(hashStr).digest('hex');

  return {
    storeId,
    orderRefNum: txnRef,
    transactionAmount: amtStr,
    transactionType: 'MA_ACCOUNT',
    tokenExpiry: dateTime,
    encryptedHashRequest: hash,
    gatewayUrl: 'https://easypaystg.easypaisa.com.pk/easypay-web/Registration?',
  };
}
