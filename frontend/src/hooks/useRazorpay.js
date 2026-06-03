import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/**
 * useRazorpay()
 * Returns a `pay()` function that:
 *   1. Calls your backend to get a Razorpay order
 *   2. Loads the Razorpay SDK if not already loaded
 *   3. Opens the checkout modal
 *   4. On success calls your verify endpoint
 *   5. Returns { success, data } or throws on failure
 *
 * Usage:
 *   const pay = useRazorpay();
 *   await pay({
 *     createEndpoint: '/payments/create-order',
 *     verifyEndpoint: '/payments/verify',
 *     createBody:     { amount: 499 },
 *     verifyExtra:    { productId, quantity, shippingAddress },
 *     description:    'Purchase: Blue Shirt',
 *   });
 */
export const useRazorpay = () => {
  const { user } = useAuth();

  const loadSDK = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = resolve;
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });

  const pay = useCallback(
    async ({ createEndpoint, verifyEndpoint, createBody, verifyExtra = {}, description = '' }) => {
      // 1. Load SDK
      await loadSDK();

      // 2. Create Razorpay order on backend
      const { data: createData } = await api.post(createEndpoint, createBody);
      if (!createData.success) throw new Error(createData.message || 'Could not initiate payment');

      // 3. Open checkout
      const result = await new Promise((resolve, reject) => {
        const options = {
          key:         createData.keyId,
          amount:      createData.amount,
          currency:    createData.currency || 'INR',
          order_id:    createData.orderId,
          name:        'CreatorHub',
          description,
          prefill: {
            name:  user?.name  || '',
            email: user?.email || '',
          },
          theme: { color: '#7c6fef' },
          handler: (response) => resolve(response),
          modal:   { ondismiss: () => reject(new Error('Payment cancelled')) },
        };
        new window.Razorpay(options).open();
      });

      // 4. Verify on backend
      const { data: verifyData } = await api.post(verifyEndpoint, {
        razorpay_order_id:   result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature:  result.razorpay_signature,
        ...verifyExtra,
      });
      if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed');

      return verifyData;
    },
    [user]
  );

  return pay;
};