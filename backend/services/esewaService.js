// eSewa Payment Integration Service
// Uses eSewa test credentials for payment processing

const crypto = require('crypto');
const https = require('https');

// eSewa Test Credentials
const ESEWA_CONFIG = {
  MERCHANT_CODE: 'EPAYTEST',
  SUCCESS_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/success`,
  FAILURE_URL: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/failed`,
  GATEWAY_URL: 'https://uat.esewa.com.np/epay/api/v2/verify', // Test URL
  PAYMENT_URL: 'https://uat.esewa.com.np/epay/pay', // Test payment URL
  SECRET_KEY: '8gBm/:&EnhH.1/q', // For Epay-v2
};

/**
 * Generate eSewa payment hash
 * @param {number} totalAmount - Total payment amount
 * @param {string} transactionUUID - Unique transaction ID
 * @param {string} productCode - Product/Order code
 */
const generatePaymentHash = (totalAmount, transactionUUID, productCode = 'ECOTRADE') => {
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
const verifyPayment = async (refId, orderId) => {
  return new Promise((resolve, reject) => {
    try {
      const postData = new URLSearchParams({
        product_code: 'ECOTRADE',
        total_amount: '100', // Will be overridden by actual amount
        transaction_uuid: orderId,
        ref_id: refId,
      });

      const options = {
        hostname: 'uat.esewa.com.np',
        path: '/epay/api/v2/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length,
        },
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
    } = orderData;

    const transactionUUID = `ECOTRADE-${orderId}-${Date.now()}`;
    const hash = generatePaymentHash(amount, transactionUUID);

    const params = new URLSearchParams({
      amount: amount,
      failure_url: ESEWA_CONFIG.FAILURE_URL,
      product_code: 'ECOTRADE',
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: ESEWA_CONFIG.SUCCESS_URL,
      tax_amount: '0',
      total_amount: amount,
      transaction_uuid: transactionUUID,
      signature: hash,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    });

    return {
      url: `${ESEWA_CONFIG.PAYMENT_URL}?${params.toString()}`,
      transactionUUID,
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

    const verification = await verifyPayment(ref_id, transaction_uuid);

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
