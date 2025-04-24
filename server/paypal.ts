import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { log } from './vite';

// Pastikan kredensial ini diambil dari environment variables
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

// Ini akan secara otomatis memilih environment yang tepat berdasarkan NODE_ENV
function environment() {
  if (ENVIRONMENT === 'production') {
    return new checkoutNodeJssdk.core.LiveEnvironment(CLIENT_ID, CLIENT_SECRET);
  } else {
    // Gunakan environment sandbox untuk development
    return new checkoutNodeJssdk.core.SandboxEnvironment(CLIENT_ID, CLIENT_SECRET);
  }
}

// Membuat klien untuk PayPal API
export function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

// Fungsi untuk membuat order baru di PayPal
export async function createOrder(items: any[], amount: number, currency = 'USD', invoiceId: string) {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  
  // Tentukan format untuk request
  request.prefer("return=representation");
  
  // Set request body
  request.requestBody({
    intent: 'CAPTURE', // Pilihan lain: AUTHORIZE
    purchase_units: [{
      reference_id: invoiceId,
      custom_id: `invoice_${invoiceId}`,
      description: "FourByte Project Payment",
      amount: {
        currency_code: currency,
        value: (amount / 100).toFixed(2), // Konversi dari sen ke dolar untuk PayPal
        breakdown: {
          item_total: {
            currency_code: currency,
            value: (amount / 100).toFixed(2)
          }
        }
      },
      items: items.map(item => ({
        name: item.name,
        unit_amount: {
          currency_code: currency,
          value: (item.amount / 100).toFixed(2)
        },
        quantity: '1',
        description: item.description || ''
      }))
    }],
    application_context: {
      user_action: 'PAY_NOW',
      brand_name: 'FourByte Developer Agency',
      shipping_preference: 'NO_SHIPPING',
      return_url: `${process.env.DOMAIN_URL || 'http://localhost:5000'}/invoice-payment/success`,
      cancel_url: `${process.env.DOMAIN_URL || 'http://localhost:5000'}/invoice-payment/cancel`
    }
  });

  try {
    // Panggil API untuk membuat order
    const order = await client().execute(request);
    log(`PayPal order created: ${order.result.id}`, 'paypal');
    return order.result;
  } catch (err) {
    console.error("Error creating PayPal order:", err);
    throw err;
  }
}

// Fungsi untuk menangkap pembayaran setelah user memberikan persetujuan
export async function capturePayment(orderId: string) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await client().execute(request);
    log(`PayPal payment captured for order: ${orderId}`, 'paypal');
    return capture.result;
  } catch (err) {
    console.error("Error capturing PayPal payment:", err);
    throw err;
  }
}

// Fungsi untuk mendapatkan detail order
export async function getOrderDetails(orderId: string) {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);
  
  try {
    const details = await client().execute(request);
    return details.result;
  } catch (err) {
    console.error("Error getting PayPal order details:", err);
    throw err;
  }
}