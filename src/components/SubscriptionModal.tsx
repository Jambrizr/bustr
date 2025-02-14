import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { StripePaymentForm } from './StripePaymentForm';
import { useToast } from '@/components/ui/toast';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number;
  onSuccess: () => void;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  planName,
  amount,
  onSuccess,
}: SubscriptionModalProps) {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Payment Successful',
      description: `You are now subscribed to the ${planName} plan!`,
    });
    onSuccess();
    onOpenChange(false);
  };

  const handleError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to {planName}</DialogTitle>
        </DialogHeader>
        <Elements stripe={getStripe()}>
          <StripePaymentForm
            amount={amount}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}