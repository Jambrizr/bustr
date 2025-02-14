import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Mail,
  ChevronRight,
  Camera,
  User,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  Settings as SettingsIcon,
  Info,
  CreditCard,
  BarChart,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';

// Update mock user data to include billing information
const mockUser = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  security: {
    twoFactorEnabled: false,
    lastLogin: '2024-03-15T10:30:00Z',
    lastLoginLocation: 'San Francisco, CA',
  },
  preferences: {
    theme: 'system',
    notifications: {
      email: true,
      browser: true,
      cleaning: true,
      updates: false,
    },
    dataRetention: 14,
  },
  billing: {
    plan: 'premium',
    status: 'active',
    nextBilling: '2024-04-15',
    usage: {
      records: 45000,
      limit: 100000,
      percentage: 45,
    },
    features: [
      'Up to 100,000 records/month',
      'Advanced data cleaning',
      'Priority support',
      'API access',
    ],
  },
};

export default function Settings() {
  const navigate = useNavigate();
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(mockUser.displayName);
  const [email, setEmail] = useState(mockUser.email);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(mockUser.security.twoFactorEnabled);
  const [notifications, setNotifications] = useState(mockUser.preferences.notifications);
  const [dataRetention, setDataRetention] = useState(mockUser.preferences.dataRetention);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Show subheading with slight delay for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Format the last login date
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Handle notification preference changes
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteAccount = () => {
    // Add your delete account logic here
    console.log('Account deleted');
    // You might want to redirect to login or show a success message
    navigate('/login');
  };

  const handleBillingClick = () => {
    navigate('/billing');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Section */}
      <div className="space-y-4 mb-8">
        <h1 
          className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent"
          role="heading" 
          aria-level={1}
        >
          Settings
        </h1>

        <p 
          className={`text-lg text-text-light/60 dark:text-text-dark/60 transition-all duration-500 ease-out ${
            isSubheadingVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'
          }`}
          aria-live="polite"
        >
          Manage your account, security, and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={mockUser.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-2 border-border-light dark:border-border-dark"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-1">Profile Picture</h3>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 mb-2">
                  Upload a new profile picture
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => console.log('Upload photo')}
                >
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="text-sm font-medium flex items-center gap-2"
              >
                <User className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                Display Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="max-w-md"
                placeholder="Enter your display name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="max-w-md"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Change Button */}
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-between group"
                onClick={() => console.log('Open password modal')}
              >
                <span className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-text-light/40 dark:text-text-dark/40" />
                  Change Password
                </span>
                <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Save Changes Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => console.log('Save changes')}
                className="bg-coral-500 hover:bg-coral-hover transition-colors"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-coral-500" />
              Plan & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan Summary */}
            <div className="p-4 rounded-lg bg-background-light dark:bg-background-dark">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold capitalize">{mockUser.billing.plan} Plan</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    Next billing date: {new Date(mockUser.billing.nextBilling).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  className="bg-coral-500 hover:bg-coral-hover transition-colors"
                  onClick={handleBillingClick}
                >
                  Manage Billing
                </Button>
              </div>

              {/* Usage Stats */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-light/60 dark:text-text-dark/60">Monthly Usage</span>
                  <span className="font-medium">
                    {mockUser.billing.usage.records.toLocaleString()} / {mockUser.billing.usage.limit.toLocaleString()} records
                  </span>
                </div>
                <div className="h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark">
                  <div 
                    className="h-full bg-coral-500 transition-all duration-300"
                    style={{ width: `${mockUser.billing.usage.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                  {100 - mockUser.billing.usage.percentage}% remaining this month
                </p>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Included in your plan:</h4>
              <ul className="space-y-2">
                {mockUser.billing.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help Section */}
            <div className="pt-4 border-t border-border-light dark:border-border-dark">
              <Button
                variant="ghost"
                className="w-full justify-between text-text-light/60 dark:text-text-dark/60 hover:text-coral-500"
                onClick={() => console.log('View billing FAQ')}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Need help with billing?
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Theme</label>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  Choose your preferred theme
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Language</label>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  Select your preferred language
                </p>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-[180px]">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* New Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-coral-500" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Preferences */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background-light dark:bg-background-dark">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Theme Preference</h3>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  Choose your preferred appearance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme()}
                  className="relative"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                  {theme === 'light' && (
                    <span className="absolute -right-1 -top-1 w-2 h-2 bg-coral-500 rounded-full" />
                  )}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTheme()}
                  className="relative"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                  {theme === 'dark' && (
                    <span className="absolute -right-1 -top-1 w-2 h-2 bg-coral-500 rounded-full" />
                  )}
                </Button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Receive cleaning job updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                    aria-label="Toggle email notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Browser Notifications</label>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.browser}
                    onCheckedChange={() => handleNotificationChange('browser')}
                    aria-label="Toggle browser notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Cleaning Updates</label>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Get notified about cleaning progress
                    </p>
                  </div>
                  <Switch
                    checked={notifications.cleaning}
                    onCheckedChange={() => handleNotificationChange('cleaning')}
                    aria-label="Toggle cleaning notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Product Updates</label>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Receive news about new features
                    </p>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={() => handleNotificationChange('updates')}
                    aria-label="Toggle product update notifications"
                  />
                </div>
              </div>
            </div>

            {/* Data Retention Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Data Retention</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Info className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">
                        Choose how long to keep your cleaning history and processed files.
                        After this period, data will be automatically deleted.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Select
                value={String(dataRetention)}
                onValueChange={(value) => setDataRetention(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                Files and cleaning history will be kept for {dataRetention} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email Notifications</label>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  Receive updates about your data cleaning jobs
                </p>
              </div>
              <Switch defaultChecked aria-label="Toggle email notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Browser Notifications</label>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  Get notified when jobs are complete
                </p>
              </div>
              <Switch defaultChecked aria-label="Toggle browser notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-coral-500" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background-light dark:bg-background-dark">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                  {twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-warning/10 text-status-warning">
                      <AlertTriangle className="h-3 w-3" />
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                  {twoFactorEnabled
                    ? 'Your account is protected with two-factor authentication'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                aria-label="Enable Two-Factor Authentication"
              />
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-coral-500 hover:text-coral-hover"
                  onClick={() => console.log('View full history')}
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="p-4 rounded-lg bg-background-light dark:bg-background-dark space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Last Sign In</p>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      {formatLastLogin(mockUser.security.lastLogin)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      {mockUser.security.lastLoginLocation}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full justify-between group"
                  onClick={() => console.log('View session activity')}
                >
                  <span className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-text-light/40 dark:text-text-dark/40" />
                    View Session Activity
                  </span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Security Recommendations */}
            {!twoFactorEnabled && (
              <div className="p-4 rounded-lg border border-status-warning/20 bg-status-warning/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-status-warning">
                      Improve Your Account Security
                    </p>
                    <p className="text-sm text-status-warning/80 mt-1">
                      Enable two-factor authentication to add an extra layer of protection to your account.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}