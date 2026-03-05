import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Bell, Monitor, Shield, Check, ToggleLeft, ToggleRight, Globe } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings, toggleSetting } = useSettings();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const ToggleSwitch = ({ settingKey, label, description }) => (
        <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
            <div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button onClick={() => toggleSetting(settingKey)} className="relative transition-all">
                {settings[settingKey] ? (
                    <ToggleRight className="w-10 h-10 text-blue-600 hover:text-blue-700 transition-colors" />
                ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300 hover:text-slate-400 transition-colors" />
                )}
            </button>
        </div>
    );

    const SelectField = ({ settingKey, label, options, description }) => (
        <div className="py-4 border-b border-slate-50 last:border-0">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
                </div>
                <select
                    value={settings[settingKey]}
                    onChange={(e) => updateSettings({ [settingKey]: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        </div>
    );

    return (
        <ControlTowerLayout>
            <div className="max-w-3xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">Configure your Aegis Nexus experience</p>
                    </div>
                    <button onClick={handleSave}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200">
                        <Check className="w-4 h-4" /> Save Changes
                    </button>
                </div>

                {/* Success toast */}
                {saved && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">Settings saved successfully!</span>
                    </div>
                )}

                {/* Notifications Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                            <p className="text-xs text-slate-400">Choose how you want to be notified</p>
                        </div>
                    </div>
                    <ToggleSwitch settingKey="emailNotifications" label="Email Notifications" description="Receive order updates and alerts via email" />
                    <ToggleSwitch settingKey="pushNotifications" label="Push Notifications" description="Browser push notifications for critical alerts" />
                    <ToggleSwitch settingKey="smsAlerts" label="SMS Alerts" description="Text message alerts for disruptions" />
                    <ToggleSwitch settingKey="disruptionAlerts" label="Disruption Alerts" description="Get notified when supply chain disruptions are detected" />
                    <ToggleSwitch settingKey="orderUpdates" label="Order Updates" description="Status changes for your active orders" />
                    <ToggleSwitch settingKey="weeklyReport" label="Weekly Report" description="Receive a weekly summary of your supply chain performance" />
                </div>

                {/* Appearance Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Appearance</h3>
                            <p className="text-xs text-slate-400">Customize the look and feel</p>
                        </div>
                    </div>
                    <ToggleSwitch settingKey="darkMode" label="Dark Mode" description="Switch to a dark theme for reduced eye strain" />
                    <ToggleSwitch settingKey="compactView" label="Compact View" description="Reduce spacing to show more data on screen" />
                    <ToggleSwitch settingKey="animationsEnabled" label="Animations" description="Enable smooth transitions and micro-animations" />
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Security</h3>
                            <p className="text-xs text-slate-400">Protect your account</p>
                        </div>
                    </div>
                    <ToggleSwitch settingKey="twoFactorAuth" label="Two-Factor Authentication" description="Add an extra layer of security to your account" />
                    <SelectField settingKey="sessionTimeout" label="Session Timeout (minutes)" description="Auto-logout after inactivity" options={['15', '30', '60', '120']} />
                </div>

                {/* Preferences Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Preferences</h3>
                            <p className="text-xs text-slate-400">Regional and display preferences</p>
                        </div>
                    </div>
                    <SelectField settingKey="language" label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese']} />
                    <SelectField settingKey="timezone" label="Timezone" options={['PST (UTC-8)', 'EST (UTC-5)', 'CST (UTC-6)', 'GMT (UTC+0)', 'IST (UTC+5:30)', 'JST (UTC+9)']} />
                    <SelectField settingKey="dateFormat" label="Date Format" description="Changes how dates are displayed across the app" options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} />
                    <SelectField settingKey="currency" label="Currency" description="Changes currency display on dashboards and orders" options={['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'JPY (¥)']} />
                    <SelectField settingKey="refreshInterval" label="Auto-Refresh Interval (seconds)" description="How often dashboards refresh data" options={['15', '30', '60', '120', '300']} />
                </div>
            </div>
        </ControlTowerLayout>
    );
}
