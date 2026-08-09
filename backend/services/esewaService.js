// eSewa Payment Integration Service
// Uses eSewa test credentials for payment processing

const crypto = require('crypto');
const https = require('https');

// eSewa Test Credentials
const ESEWA_CONFIG = {
  MERCHANT_CODE: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
  SUCCESS_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/success`,
  FAILURE_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/failed`,
  GATEWAY_URL: process.env.ESEWA_GATEWAY_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
  PAYMENT_URL: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  SECRET_KEY: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
};

/**
 * Generate eSewa payment hash
 * @param {number} totalAmount - Total payment amount
 * @param {string} transactionUUID - Unique transaction ID
 * @param {string} productCode - Product/Order code
 */
const generatePaymentHash = (totalAmount, transactionUUID, productCode = ESEWA_CONFIG.MERCHANT_CODE) => {
  try {
    const hashString = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
    const hash = crypto
      .createHmac('sha256', ESEWA_CONFIG.SECRET_KEY)
      .update(hashString)
      .digest('base64');
    
    return hash;
  } catch (error) {
    console.error('Hash generation failed:', error);
    throw new Error('Payment hash generation failed');
  }
};

/**
 * Verify eSewa payment
 * @param {string} refId - Reference ID from eSewa
 * @param {string} orderId - Our order ID
 */
const verifyPayment = async (refId, transactionUUID, totalAmount) => {
  return new Promise((resolve, reject) => {
    try {
      const postData = new URLSearchParams({
        product_code: ESEWA_CONFIG.MERCHANT_CODE,
        total_amount: Number(totalAmount).toFixed(0),
        transaction_uuid: transactionUUID,
        ref_id: refId,
      });

      const gateway = new URL(ESEWA_CONFIG.GATEWAY_URL);
      const options = {
        hostname: gateway.hostname,
        path: `${gateway.pathname}?${postData.toString()}`,
        method: 'GET',
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid payment verification response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Payment verification failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate eSewa payment URL
 * @param {object} orderData - Order information
 */
const generatePaymentURL = (orderData) => {
  try {
    const {
      orderId,
      amount,
      customerName = 'Customer',
      customerEmail = 'customer@ecotrade.com',
      customerPhone = '9800000000',
      transactionUUID,
    } = orderData;

    const tx = transactionUUID || `ECOTRADE-${orderId}-${Date.now()}`;
    const formattedAmount = Number(amount).toFixed(0);
    const hash = generatePaymentHash(formattedAmount, tx);

    const params = new URLSearchParams({
      amount: formattedAmount,
      failure_url: `${ESEWA_CONFIG.FAILURE_URL}?orderId=${orderId}`,
      product_code: ESEWA_CONFIG.MERCHANT_CODE,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${ESEWA_CONFIG.SUCCESS_URL}?orderId=${orderId}`,
      tax_amount: '0',
      total_amount: formattedAmount,
      transaction_uuid: tx,
      signature: hash,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    });

    return {
      url: `${ESEWA_CONFIG.PAYMENT_URL}?${params.toString()}`,
      fields: Object.fromEntries(params.entries()),
      transactionUUID: tx,
      signature: hash,
    };
  } catch (error) {
    console.error('Payment URL generation failed:', error);
    throw error;
  }
};

/**
 * Process payment callback from eSewa
 * @param {object} esewaData - Data from eSewa callback
 */
const processPaymentCallback = async (esewaData) => {
  try {
    const { ref_id, transaction_uuid } = esewaData;

    if (!ref_id || !transaction_uuid) {
      throw new Error('Missing payment reference or transaction ID');
    }

    const verification = await verifyPayment(ref_id, transaction_uuid, esewaData.total_amount);

    return {
      success: verification.status === 'COMPLETE',
      transactionId: ref_id,
      transactionUUID: transaction_uuid,
      status: verification.status,
      message: verification.message,
      amount: verification.total_amount,
    };
  } catch (error) {
    console.error('Payment callback processing failed:', error);
    throw error;
  }
};

module.exports = {
  generatePaymentHash,
  generatePaymentURL,
  verifyPayment,
  processPaymentCallback,
  ESEWA_CONFIG,
};
