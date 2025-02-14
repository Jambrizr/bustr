import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  primaryContact?: Contact;
}

// Mock data for demonstration
const mockDuplicates: DuplicateGroup[] = [
  {
    id: '1',
    contacts: [
      {
        id: '1a',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1 555-0123',
        company: 'Acme Inc',
        source: 'Salesforce',
        confidence: 0.95,
        status: 'pending',
      },
      {
        id: '1b',
        name: 'John D. Smith',
        email: 'john.smith@example.com',
        phone: '555-0123',
        company: 'ACME Corporation',
        source: 'HubSpot',
        confidence: 0.85,
        status: 'pending',
      },
    ],
  },
  {
    id: '2',
    contacts: [
      {
        id: '2a',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555-0124',
        source: 'ActiveCampaign',
        confidence: 0.92,
        status: 'pending',
      },
      {
        id: '2b',
        name: 'Jane M. Doe',
        email: 'jane.doe@example.com',
        phone: '555-0124',
        source: 'Salesforce',
        confidence: 0.88,
        status: 'pending',
      },
    ],
  },
];

export default function MergeReview() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>(mockDuplicates);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load duplicates from API
  useEffect(() => {
    // In a real implementation, fetch duplicates from the API
    setDuplicates(mockDuplicates);
  }, []);

  const currentGroup = duplicates[currentIndex];

  const handleSelectPrimary = (contactId: string) => {
    setDuplicates(prev =>
      prev.map(group =>
        group.id === currentGroup.id
          ? {
              ...group,
              primaryContact: group.contacts.find(c => c.id === contactId),
              contacts: group.contacts.map(c => ({
                ...c,
                status: c.id === contactId ? 'approved' : 'rejected',
              })),
            }
          : group
      )
    );
  };

  const handleSkip = () => {
    if (currentIndex < duplicates.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, fetch new duplicates from the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDuplicates(mockDuplicates);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentGroup) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-status-success mx-auto" />
              <h2 className="text-2xl font-bold">All Caught Up!</h2>
              <p className="text-text-light/60 dark:text-text-dark/60">
                No duplicate contacts to review at this time.
              </p>
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Check for New Duplicates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Merge Review</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-text-light/60 dark:text-text-dark/60">
            {currentIndex + 1} of {duplicates.length} groups
          </p>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="relative"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            Potential Duplicate Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Warning Message */}
            <div className="p-4 bg-status-warning/10 text-status-warning rounded-lg">
              <p className="text-sm">
                These contacts appear to be duplicates. Please select which contact should be
                the primary record. The other contact will be marked as a duplicate.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="grid gap-4">
              {currentGroup.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`
                    relative p-4 rounded-lg border
                    ${
                      contact.status === 'approved'
                        ? 'border-status-success bg-status-success/5'
                        : contact.status === 'rejected'
                        ? 'border-status-error bg-status-error/5 opacity-50'
                        : 'border-border-light dark:border-border-dark hover:border-coral-500 dark:hover:border-coral-500'
                    }
                    transition-all duration-200
                  `}
                >
                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60">Name</p>
                      <p className="font-medium">{contact.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60">Email</p>
                      <p className="font-medium">{contact.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60">Phone</p>
                      <p className="font-medium">{contact.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60">Company</p>
                      <p className="font-medium">{contact.company || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Source & Confidence */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-light/60 dark:text-text-dark/60">
                        Source:
                      </span>
                      <span className="text-sm font-medium">{contact.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-light/60 dark:text-text-dark/60">
                        Match Confidence:
                      </span>
                      <span className="text-sm font-medium">
                        {(contact.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {contact.status === 'pending' && (
                    <Button
                      className="mt-4 w-full bg-coral-500 hover:bg-coral-hover"
                      onClick={() => handleSelectPrimary(contact.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Select as Primary
                    </Button>
                  )}

                  {/* Status Indicator */}
                  {contact.status === 'approved' && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-status-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Primary Contact</span>
                    </div>
                  )}
                  {contact.status === 'rejected' && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-status-error">
                      <UserX className="h-5 w-5" />
                      <span className="text-sm font-medium">Duplicate</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-border-light dark:border-border-dark">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="group"
              >
                <ChevronLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Previous
              </Button>
              <Button
                onClick={handleSkip}
                disabled={currentIndex === duplicates.length - 1}
                className="group"
              >
                Skip
                <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}