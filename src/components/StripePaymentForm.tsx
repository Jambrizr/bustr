import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePaymentForm({ amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = React.useState<string | null>(null);
  const [cardComplete, setCardComplete] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'An error occurred');
        onError(stripeError.message || 'Payment failed');
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        onError('Payment failed');
        return;
      }

      // Here you would typically send the paymentMethod.id to your server
      // to complete the payment
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      onError('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Card Element */}
        <div className="rounded-md border border-border-light dark:border-border-dark p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else {
                setError(null);
              }
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-status-error text-sm">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {cardComplete && !error && (
          <div className="flex items-center gap-2 text-status-success text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Card information complete
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={processing || !cardComplete}
        className="w-full"
      >
        {processing ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount / 100)}`
        )}
      </Button>

      {/* Secure Payment Notice */}
      <p className="text-center text-sm text-text-light/60 dark:text-text-dark/60">
        🔒 Payments are secure and encrypted
      </p>
    </form>
  );
}