import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  FileText,
  Download,
  ChevronRight,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Wallet,
  Clock,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Database,
  Code,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Subscription plan data
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out our service',
    features: [
      'Up to 5,000 records/month',
      'Basic data cleaning',
      'Email support',
      'Standard processing speed',
    ],
    limits: {
      records: 5000,
      cleaningSpeed: 'Standard',
      support: 'Email',
    },
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'Best for growing businesses',
    features: [
      'Up to 100,000 records/month',
      'Advanced data cleaning',
      'Priority support',
      'API access',
      'Custom validation rules',
      'Batch processing',
    ],
    limits: {
      records: 100000,
      cleaningSpeed: 'Fast',
      support: 'Priority',
    },
    cta: 'Upgrade Now',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    description: 'For large-scale operations',
    features: [
      'Unlimited records',
      'Enterprise-grade cleaning',
      '24/7 dedicated support',
      'Advanced API features',
      'Custom integrations',
      'SLA guarantees',
      'Dedicated account manager',
    ],
    limits: {
      records: 'Unlimited',
      cleaningSpeed: 'Fastest',
      support: '24/7 Dedicated',
    },
    cta: 'Contact Sales',
    popular: false,
  },
];

// Feature comparison data
const FEATURE_COMPARISON = [
  {
    name: 'Monthly Records',
    free: '5,000',
    pro: '100,000',
    enterprise: 'Unlimited',
    tooltip: 'Number of records you can process per month',
  },
  {
    name: 'Processing Speed',
    free: 'Standard',
    pro: 'Fast',
    enterprise: 'Fastest',
    tooltip: 'Speed at which your data is processed and cleaned',
  },
  {
    name: 'Data Cleaning',
    free: 'Basic',
    pro: 'Advanced',
    enterprise: 'Enterprise-grade',
    tooltip: 'Level of data cleaning and validation available',
  },
  {
    name: 'Support',
    free: 'Email',
    pro: 'Priority',
    enterprise: '24/7 Dedicated',
    tooltip: 'Level of customer support provided',
  },
  {
    name: 'API Access',
    free: '❌',
    pro: '✓',
    enterprise: '✓',
    tooltip: 'Access to our REST API for automation',
  },
  {
    name: 'Custom Rules',
    free: '❌',
    pro: '✓',
    enterprise: '✓',
    tooltip: 'Create custom validation and cleaning rules',
  },
  {
    name: 'Batch Processing',
    free: '❌',
    pro: '✓',
    enterprise: '✓',
    tooltip: 'Process multiple files simultaneously',
  },
  {
    name: 'Custom Integrations',
    free: '❌',
    pro: '❌',
    enterprise: '✓',
    tooltip: 'Build custom integrations with your existing tools',
  },
];

export default function Billing() {
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced plan change handler with loading state
  const handlePlanChange = useCallback(async (planId: string) => {
    setSelectedPlanId(planId);
    setIsChangingPlan(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Changed to plan: ${planId}`);
    } finally {
      setIsChangingPlan(false);
      setSelectedPlanId(null);
    }
  }, []);

  // Keyboard navigation for plan cards
  const handlePlanKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLDivElement>,
    planId: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlanChange(planId);
    }
  }, [handlePlanChange]);

  return (
    <TooltipProvider>
      <div 
        className="container mx-auto px-4 py-8 max-w-4xl"
        role="main"
        aria-labelledby="billing-title"
      >
        {/* Header Section */}
        <div className="space-y-4 mb-8">
          <h1 
            id="billing-title"
            className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent"
          >
            Billing
          </h1>

          <p 
            className={`
              text-lg text-text-light/60 dark:text-text-dark/60 
              transition-all duration-500 ease-out
              motion-reduce:transition-none
              ${isSubheadingVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'}
            `}
            aria-live="polite"
          >
            Manage your subscription, view your billing history, and adjust your plan
          </p>
        </div>

        {/* Billing Summary */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative">
            <div 
              className="absolute inset-0 bg-gradient-to-br from-coral-500/5 to-teal-500/5"
              aria-hidden="true"
            />
            <div 
              className="absolute inset-0 bg-mesh-pattern opacity-[0.03] dark:opacity-[0.05]"
              aria-hidden="true"
            />

            <div className="relative p-6">
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                role="group"
                aria-label="Billing summary"
              >
                {/* Current Plan */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-text-light/60 dark:text-text-dark/60">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Current Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">Premium</span>
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success"
                      role="status"
                    >
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    $49/month
                  </p>
                </div>

                {/* Usage */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-text-light/60 dark:text-text-dark/60">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Monthly Usage</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">45,000</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-light/60 dark:text-text-dark/60">
                        of 100,000 records
                      </span>
                      <span className="text-status-success">55% remaining</span>
                    </div>
                    <div 
                      className="h-1.5 bg-background-light dark:bg-background-dark rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={45}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Monthly usage progress"
                    >
                      <div 
                        className="h-full bg-coral-500 transition-all duration-300 motion-reduce:transition-none"
                        style={{ width: '45%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Next Billing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-text-light/60 dark:text-text-dark/60">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Next Billing</span>
                  </div>
                  <p className="text-xl font-bold">April 1, 2025</p>
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    Auto-renewal enabled
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                <Button
                  className="
                    bg-coral-500 hover:bg-coral-hover 
                    transition-colors motion-reduce:transition-none
                    focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2
                  "
                  onClick={() => console.log('Manage payment methods')}
                >
                  Manage Payment Methods
                </Button>
                <Button
                  variant="outline"
                  className="
                    group focus-visible:ring-2 focus-visible:ring-coral-500 
                    focus-visible:ring-offset-2
                  "
                  onClick={() => console.log('View invoices')}
                >
                  <span className="flex items-center gap-2">
                    View Invoices
                    <ChevronRight 
                      className="
                        h-4 w-4 transition-transform 
                        motion-reduce:transition-none
                        group-hover:translate-x-1
                      " 
                      aria-hidden="true"
                    />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Plans */}
        <section 
          className="mb-8 space-y-6"
          aria-labelledby="available-plans"
        >
          <h2 id="available-plans" className="text-2xl font-bold">
            Available Plans
          </h2>
          
          {/* Plan Cards Grid */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            role="list"
            aria-label="Subscription plans"
          >
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`
                  relative overflow-hidden cursor-pointer
                  transition-all duration-200 motion-reduce:transition-none
                  hover:shadow-lg hover:scale-[1.02]
                  focus-within:ring-2 focus-within:ring-coral-500 focus-within:ring-offset-2
                  ${plan.popular ? 'border-coral-500 dark:border-coral-500' : ''}
                `}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => handlePlanKeyDown(e, plan.id)}
                aria-label={`${plan.name} plan at $${plan.price} per month`}
              >
                {plan.popular && (
                  <div 
                    className="absolute top-4 right-4"
                    aria-label="Most popular plan"
                  >
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-coral-500 text-white">
                      Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-text-light/60 dark:text-text-dark/60 mt-1">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        ${plan.price}
                      </span>
                      <span className="text-sm text-text-light/60 dark:text-text-dark/60 ml-2">
                        /month
                      </span>
                    </div>
                  </div>

                  <ul 
                    className="space-y-3 mb-6"
                    role="list"
                    aria-label={`${plan.name} plan features`}
                  >
                    {plan.features.map((feature, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2"
                        role="listitem"
                      >
                        <CheckCircle2 
                          className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" 
                          aria-hidden="true"
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isChangingPlan}
                    className={`
                      w-full group
                      transition-all duration-200 motion-reduce:transition-none
                      ${plan.popular 
                        ? 'bg-coral-500 hover:bg-coral-hover text-white' 
                        : 'bg-background-light dark:bg-background-dark hover:bg-coral-500/10'
                      }
                    `}
                    aria-busy={isChangingPlan && selectedPlanId === plan.id}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isChangingPlan && selectedPlanId === plan.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ChevronRight 
                            className="
                              h-4 w-4 transition-transform 
                              motion-reduce:transition-none
                              group-hover:translate-x-1
                            " 
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="overflow-x-auto"
                role="region"
                aria-label="Feature comparison table"
                tabIndex={0}
              >
                <table className="w-full" role="grid">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
                        Feature
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
                        Free
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
                        Pro
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-sm font-semibold">
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_COMPARISON.map((feature, idx) => (
                      <tr
                        key={idx}
                        className="
                          border-b border-border-light dark:border-border-dark
                          hover:bg-background-light dark:hover:bg-background-dark
                          transition-colors motion-reduce:transition-none
                        "
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {feature.name}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label={`Learn more about ${feature.name}`}
                                >
                                  <Info className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm max-w-xs">
                                  {feature.tooltip}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{feature.free}</td>
                        <td className="px-4 py-3 text-sm">{feature.pro}</td>
                        <td className="px-4 py-3 text-sm">{feature.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Current Plan Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-coral-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-background-light dark:bg-background-dark">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Pro Plan</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    Next billing date: April 1, 2025
                  </p>
                </div>
                <Button
                  className="bg-coral-500 hover:bg-coral-hover transition-colors"
                  onClick={() => console.log('Manage billing')}
                >
                  Manage Plan
                </Button>
              </div>

              {/* Usage Stats */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-light/60 dark:text-text-dark/60">Monthly Usage</span>
                  <span className="font-medium">45,000 / 100,000 records</span>
                </div>
                <div className="h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark">
                  <div 
                    className="h-full bg-coral-500 transition-all duration-300"
                    style={{ width: '45%' }}
                  />
                </div>
                <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                  55% remaining this month
                </p>
              </div>
            </div>

            {/* Plan Features */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium">Included in your plan:</h4>
              <ul className="space-y-2">
                {[
                  'Up to 100,000 records/month',
                  'Advanced data cleaning',
                  'Priority support',
                  'API access',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-coral-500" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border-dark">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-background-light dark:bg-background-dark rounded flex items-center justify-center">
                  <span className="text-sm font-medium">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium">•••• 4242</p>
                  <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                    Expires 12/25
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="group"
                onClick={() => console.log('Manage payment methods')}
              >
                <span className="flex items-center gap-2">
                  Manage
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </div>

            {/* Need Help Section */}
            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
              <Button
                variant="ghost"
                className="w-full justify-between text-text-light/60 dark:text-text-dark/60 hover:text-coral-500"
                onClick={() => console.log('View billing FAQ')}
              >
                <span className="flex items-center gap-2">
                  Need help with billing?
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}