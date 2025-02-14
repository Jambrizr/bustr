import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Types
export interface SubscriptionPlan {
  id: string;
  stripe_price_id: string;
  name: string;
  description: string;
  type: 'freemium' | 'core' | 'premium';
  interval: 'monthly' | 'annual';
  amount: number;
  currency: string;
  features: string[];
  limits: {
    max_rows_per_month: number;
    max_storage_bytes: number;
    max_file_size_bytes: number;
  };
}

export interface CustomerSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

export interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_pdf?: string;
  period_start: string;
  period_end: string;
  paid_at?: string;
}

// Helper functions
export async function getSubscriptionPlans() {
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('amount');

  if (error) throw error;
  return plans as SubscriptionPlan[];
}

export async function getCurrentSubscription() {
  const { data: subscription, error } = await supabase
    .rpc('get_current_subscription', {
      user_uuid: (await supabase.auth.getUser()).data.user?.id
    });

  if (error) throw error;
  return subscription as CustomerSubscription | null;
}

export async function getBillingHistory() {
  const { data: history, error } = await supabase
    .from('billing_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return history as BillingHistory[];
}

export async function createCheckoutSession(priceId: string) {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ priceId }),
  });

  const { sessionId } = await response.json();
  const stripe = await getStripe();
  
  if (!stripe) throw new Error('Failed to load Stripe');
  
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
}

export async function createPortalSession() {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
  });

  const { url } = await response.json();
  window.location.href = url;
}