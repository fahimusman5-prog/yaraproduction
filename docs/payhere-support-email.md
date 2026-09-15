# PayHere support email

Subject: Urgent: Live Card Payment Error – "Error Initializing Payment" – YARA Productions

Dear PayHere Support Team,

I am the developer of the YARA Productions e-commerce website and we are currently experiencing an issue with our live PayHere Checkout integration.

Website: https://yaraproduct.com

The checkout successfully redirects customers to the PayHere hosted payment page. PayHere displays the YARA merchant, order reference, amount, and available payment methods including Visa and Mastercard. However, when a customer selects a card payment method, the payment interface does not proceed to card entry and instead displays:

“Sorry!\nError initializing payment\nPlease contact your Merchant to get this error resolved.”

We reviewed the integration against the current PayHere Checkout API documentation and verified:

- The application uses the required form POST fields and `application/x-www-form-urlencoded` notification handling.
- The live checkout action is exactly `https://www.payhere.lk/pay/checkout`.
- The hash is generated server-side with the documented MD5 formula and the exact formatted amount submitted to PayHere.
- PayHere receives LKR only. UAE commercial totals remain AED and are converted once server-side to a snapshotted whole-LKR charge.
- The live database records the provider environment as `live`; the latest observed live attempts use LKR amounts such as `7747.00`, and no PayHere notification has been received for the observed live attempts.
- Both Sri Lanka and UAE card payment settings are enabled in the YARA payment-method configuration.
- The notification route is server-side at `https://www.yaraproduct.com/api/payments/payhere/notify` and verifies `merchant_id`, `order_id`, `payhere_amount`, `payhere_currency`, `status_code`, and `md5sig` before updating an order.
- The return URL is `https://www.yaraproduct.com/payment/success` and the cancel URL is `https://www.yaraproduct.com/payment/failure`.
- The application never marks an order paid from the browser return URL; only a verified notification can do so.

Environment: LIVE

Merchant ID: REDACTED — available on request through a verified channel

Order reference used for diagnosis: `YARA-20260915043340-8EB0B5`

Amount: `7747.00`

Currency: `LKR`

Checkout endpoint: `https://www.payhere.lk/pay/checkout`

Return URL: `https://www.yaraproduct.com/payment/success`

Cancel URL: `https://www.yaraproduct.com/payment/failure`

Notify URL: `https://www.yaraproduct.com/api/payments/payhere/notify`

Could you please check whether the live merchant account is fully approved and activated for card payments, whether the domain/app integration for `yaraproduct.com` has been approved, whether the Merchant Secret belongs to that exact approved domain record, whether duplicate domain records exist, and whether there is any PayHere-side error or payment-method configuration issue for the transaction above?

This issue is preventing customers from completing live card payments. We have screenshots showing (1) the PayHere payment-method screen loading successfully and (2) the “Error initializing payment” message after selecting a card method. No real card details or test charge is included in this report.

Please provide the exact reason for the initialization failure and any configuration or integration changes required from our side.

Thank you.

Best regards,
Developer
YARA Productions
https://yaraproduct.com
