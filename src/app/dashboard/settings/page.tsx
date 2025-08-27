'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { InvestorRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserProfile {
  email: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  created_at: Date;
  last_login?: Date;
}

interface NotificationSettings {
  email_notifications: boolean;
  document_alerts: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  login_alerts: boolean;
}

interface SettingsState {
  profile: UserProfile | null;
  notifications: NotificationSettings;
  security: SecuritySettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
}

export default function SettingsPage() {
  const { user, refreshAuth } = useAuth();
  const [state, setState] = useState<SettingsState>({
    profile: null,
    notifications: {
      email_notifications: true,
      document_alerts: true,
      security_alerts: true,
      marketing_emails: false
    },
    security: {
      two_factor_enabled: false,
      session_timeout: 30,
      login_alerts: true
    },
    loading: true,
    saving: false,
    error: null,
    success: null
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock data for now - would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfile: UserProfile = {
        email: user?.email || '',
        company_name: user?.company_name,
        first_name: 'John',
        last_name: 'Doe',
        phone: '(555) 123-4567',
        address: '123 Investment St, Finance City, FC 12345',
        timezone: 'America/New_York',
        created_at: new Date('2024-01-15'),
        last_login: user?.last_login ? new Date(user.last_login) : undefined
      };

      setState(prev => ({
        ...prev,
        profile: mockProfile,
        loading: false
      }));

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  const saveProfile = async () => {
    if (!state.profile) return;

    setState(prev => ({ ...prev, saving: true, error: null, success: null }));
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real implementation, this would make API call to update profile
      
      setState(prev => ({
        ...prev,
        saving: false,
        success: 'Profile updated successfully!'
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: err.message
      }));
    }
  };

  const saveNotifications = async () => {
    setState(prev => ({ ...prev, saving: true, error: null, success: null }));
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        saving: false,
        success: 'Notification settings updated!'
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: err.message
      }));
    }
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setState(prev => ({ ...prev, error: 'New passwords do not match' }));
      return;
    }

    if (passwordData.new_password.length < 8) {
      setState(prev => ({ ...prev, error: 'Password must be at least 8 characters long' }));
      return;
    }

    setState(prev => ({ ...prev, saving: true, error: null, success: null }));
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setState(prev => ({
        ...prev,
        saving: false,
        success: 'Password updated successfully!'
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: err.message
      }));
    }
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, [field]: value } : null
    }));
  };

  const updateNotifications = (field: keyof NotificationSettings, value: boolean) => {
    setState(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  if (state.loading || !state.profile) {
    return (\n      <InvestorRoute>\n        <div className=\"bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen\">\n          <DashboardNavigation />\n          <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n            <div className=\"flex items-center justify-center py-12\">\n              <div className=\"text-center\">\n                <LoadingSpinner size=\"lg\" />\n                <p className=\"mt-3 text-gray-400\">Loading settings...</p>\n              </div>\n            </div>\n          </div>\n        </div>\n      </InvestorRoute>\n    );\n  }\n\n  return (\n    <InvestorRoute>\n      <div className=\"bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen\">\n        <DashboardNavigation />\n        \n        <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n          {/* Header */}\n          <div className=\"mb-8\">\n            <h1 className=\"text-3xl font-bold text-white mb-2\">Account Settings</h1>\n            <p className=\"text-gray-400\">\n              Manage your profile, notifications, and security preferences\n            </p>\n          </div>\n\n          {/* Success/Error Messages */}\n          {state.success && (\n            <div className=\"mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg\">\n              <p className=\"text-green-400\">{state.success}</p>\n            </div>\n          )}\n\n          {state.error && (\n            <div className=\"mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg\">\n              <p className=\"text-red-400\">{state.error}</p>\n            </div>\n          )}\n\n          <div className=\"space-y-8\">\n            {/* Profile Information */}\n            <Card>\n              <CardHeader>\n                <div className=\"flex items-center justify-between\">\n                  <CardTitle>Profile Information</CardTitle>\n                  <RoleBadge role={user?.role || 'user'} />\n                </div>\n              </CardHeader>\n              <CardContent>\n                <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className=\"space-y-6\">\n                  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                    <Input\n                      label=\"First Name\"\n                      value={state.profile.first_name || ''}\n                      onChange={(e) => updateProfile('first_name', e.target.value)}\n                      fullWidth\n                    />\n                    \n                    <Input\n                      label=\"Last Name\"\n                      value={state.profile.last_name || ''}\n                      onChange={(e) => updateProfile('last_name', e.target.value)}\n                      fullWidth\n                    />\n                  </div>\n\n                  <Input\n                    label=\"Email Address\"\n                    type=\"email\"\n                    value={state.profile.email}\n                    onChange={(e) => updateProfile('email', e.target.value)}\n                    fullWidth\n                    disabled\n                    helperText=\"Email address cannot be changed. Contact support if needed.\"\n                  />\n\n                  <Input\n                    label=\"Company Name\"\n                    value={state.profile.company_name || ''}\n                    onChange={(e) => updateProfile('company_name', e.target.value)}\n                    fullWidth\n                  />\n\n                  <Input\n                    label=\"Phone Number\"\n                    value={state.profile.phone || ''}\n                    onChange={(e) => updateProfile('phone', e.target.value)}\n                    fullWidth\n                  />\n\n                  <Textarea\n                    label=\"Address\"\n                    value={state.profile.address || ''}\n                    onChange={(e) => updateProfile('address', e.target.value)}\n                    rows={3}\n                    fullWidth\n                  />\n\n                  <div className=\"flex justify-end\">\n                    <Button\n                      type=\"submit\"\n                      loading={state.saving}\n                      disabled={state.saving}\n                    >\n                      Save Profile\n                    </Button>\n                  </div>\n                </form>\n              </CardContent>\n            </Card>\n\n            {/* Account Information */}\n            <Card>\n              <CardHeader>\n                <CardTitle>Account Information</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                  <div>\n                    <label className=\"block text-sm font-medium text-gray-300 mb-2\">\n                      Account Created\n                    </label>\n                    <p className=\"text-white\">\n                      {state.profile.created_at.toLocaleDateString()}\n                    </p>\n                  </div>\n                  \n                  {state.profile.last_login && (\n                    <div>\n                      <label className=\"block text-sm font-medium text-gray-300 mb-2\">\n                        Last Login\n                      </label>\n                      <p className=\"text-white\">\n                        {state.profile.last_login.toLocaleString()}\n                      </p>\n                    </div>\n                  )}\n                  \n                  <div>\n                    <label className=\"block text-sm font-medium text-gray-300 mb-2\">\n                      Account Type\n                    </label>\n                    <RoleBadge role={user?.role || 'user'} />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            {/* Change Password */}\n            <Card>\n              <CardHeader>\n                <CardTitle>Change Password</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <form onSubmit={(e) => { e.preventDefault(); changePassword(); }} className=\"space-y-6\">\n                  <Input\n                    label=\"Current Password\"\n                    type=\"password\"\n                    value={passwordData.current_password}\n                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}\n                    fullWidth\n                    required\n                  />\n                  \n                  <Input\n                    label=\"New Password\"\n                    type=\"password\"\n                    value={passwordData.new_password}\n                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}\n                    fullWidth\n                    required\n                    helperText=\"Password must be at least 8 characters long\"\n                  />\n                  \n                  <Input\n                    label=\"Confirm New Password\"\n                    type=\"password\"\n                    value={passwordData.confirm_password}\n                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}\n                    fullWidth\n                    required\n                  />\n\n                  <div className=\"flex justify-end\">\n                    <Button\n                      type=\"submit\"\n                      variant=\"primary\"\n                      loading={state.saving}\n                      disabled={state.saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}\n                    >\n                      Update Password\n                    </Button>\n                  </div>\n                </form>\n              </CardContent>\n            </Card>\n\n            {/* Notification Settings */}\n            <Card>\n              <CardHeader>\n                <CardTitle>Notification Preferences</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-6\">\n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Email Notifications</label>\n                      <p className=\"text-gray-400 text-sm\">Receive general email notifications</p>\n                    </div>\n                    <input\n                      type=\"checkbox\"\n                      checked={state.notifications.email_notifications}\n                      onChange={(e) => updateNotifications('email_notifications', e.target.checked)}\n                      className=\"w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500\"\n                    />\n                  </div>\n                  \n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Document Alerts</label>\n                      <p className=\"text-gray-400 text-sm\">Get notified when new documents are available</p>\n                    </div>\n                    <input\n                      type=\"checkbox\"\n                      checked={state.notifications.document_alerts}\n                      onChange={(e) => updateNotifications('document_alerts', e.target.checked)}\n                      className=\"w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500\"\n                    />\n                  </div>\n                  \n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Security Alerts</label>\n                      <p className=\"text-gray-400 text-sm\">Important security and login notifications</p>\n                    </div>\n                    <input\n                      type=\"checkbox\"\n                      checked={state.notifications.security_alerts}\n                      onChange={(e) => updateNotifications('security_alerts', e.target.checked)}\n                      className=\"w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500\"\n                    />\n                  </div>\n                  \n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Marketing Emails</label>\n                      <p className=\"text-gray-400 text-sm\">Receive updates about new features and services</p>\n                    </div>\n                    <input\n                      type=\"checkbox\"\n                      checked={state.notifications.marketing_emails}\n                      onChange={(e) => updateNotifications('marketing_emails', e.target.checked)}\n                      className=\"w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500\"\n                    />\n                  </div>\n\n                  <div className=\"flex justify-end pt-4 border-t border-slate-700\">\n                    <Button\n                      onClick={saveNotifications}\n                      loading={state.saving}\n                      disabled={state.saving}\n                    >\n                      Save Preferences\n                    </Button>\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n\n            {/* Security Settings */}\n            <Card>\n              <CardHeader>\n                <CardTitle>Security Settings</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <div className=\"space-y-6\">\n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Two-Factor Authentication</label>\n                      <p className=\"text-gray-400 text-sm\">Add an extra layer of security to your account</p>\n                    </div>\n                    <Button variant=\"outline\" size=\"sm\">\n                      {state.security.two_factor_enabled ? 'Disable' : 'Enable'}\n                    </Button>\n                  </div>\n                  \n                  <div className=\"flex items-center justify-between\">\n                    <div>\n                      <label className=\"text-white font-medium\">Login Alerts</label>\n                      <p className=\"text-gray-400 text-sm\">Get notified of logins from new devices</p>\n                    </div>\n                    <input\n                      type=\"checkbox\"\n                      checked={state.security.login_alerts}\n                      onChange={(e) => setState(prev => ({\n                        ...prev,\n                        security: { ...prev.security, login_alerts: e.target.checked }\n                      }))}\n                      className=\"w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500\"\n                    />\n                  </div>\n                </div>\n              </CardContent>\n            </Card>\n          </div>\n        </div>\n      </div>\n    </InvestorRoute>\n  );\n}"