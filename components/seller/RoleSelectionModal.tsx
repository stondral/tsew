"use client";

import { useState } from "react";
import { X, Shield, AlertTriangle, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  securityLevel: 'critical' | 'high' | 'medium' | 'low';
  permissions: string[];
}

export const ROLES: RoleOption[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full control. Billing, payouts, delete seller, transfer ownership.',
    icon: '👑',
    color: 'border-red-500 bg-red-500/5',
    securityLevel: 'critical',
    permissions: ['Everything', 'Billing & Payouts', 'Delete Seller', 'Transfer Ownership']
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full operations. Cannot withdraw payouts or delete seller.',
    icon: '🛡️',
    color: 'border-amber-500 bg-amber-500/5',
    securityLevel: 'high',
    permissions: ['Products CRUD', 'Orders', 'Inventory', 'Team Management', 'Analytics']
  },
  {
    value: 'operations_manager',
    label: 'Operations Manager',
    description: 'Orders, returns, inventory. View analytics.',
    icon: '📦',
    color: 'border-blue-500 bg-blue-500/5',
    securityLevel: 'medium',
    permissions: ['Fulfill Orders', 'Handle Returns', 'Adjust Inventory', 'View Analytics']
  },
  {
    value: 'inventory_manager',
    label: 'Inventory Manager',
    description: 'Stock levels, transfers, damaged items.',
    icon: '📊',
    color: 'border-indigo-500 bg-indigo-500/5',
    securityLevel: 'medium',
    permissions: ['View/Adjust Stock', 'Transfer Inventory', 'Mark Damaged']
  },
  {
    value: 'warehouse_staff',
    label: 'Warehouse Staff',
    description: 'Pack, ship, scan. Cannot adjust stock manually.',
    icon: '🏭',
    color: 'border-teal-500 bg-teal-500/5',
    securityLevel: 'low',
    permissions: ['Pack Orders', 'Ship Orders', 'Scan Barcodes', 'View Pick Lists']
  },
  {
    value: 'customer_support',
    label: 'Customer Support',
    description: 'View orders, message customers, create returns.',
    icon: '💬',
    color: 'border-emerald-500 bg-emerald-500/5',
    securityLevel: 'low',
    permissions: ['View Orders', 'Message Customers', 'Create Return Requests']
  },
  {
    value: 'finance',
    label: 'Finance / Accountant',
    description: 'Payouts, invoices, tax reports. Read-only orders.',
    icon: '💰',
    color: 'border-purple-500 bg-purple-500/5',
    securityLevel: 'medium',
    permissions: ['View Payouts', 'Download Invoices', 'Tax Reports']
  },
  {
    value: 'marketing_manager',
    label: 'Marketing Manager',
    description: 'Discounts, campaigns, analytics.',
    icon: '📣',
    color: 'border-pink-500 bg-pink-500/5',
    securityLevel: 'low',
    permissions: ['Create Discounts', 'Manage Campaigns', 'View Analytics']
  },
  {
    value: 'viewer',
    label: 'Viewer (Read-Only)',
    description: 'View everything. Cannot edit anything.',
    icon: '👁️',
    color: 'border-slate-400 bg-slate-500/5',
    securityLevel: 'low',
    permissions: ['View Dashboard', 'View Orders', 'View Products', 'View Analytics']
  }
];

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (role: string) => void;
  currentRole?: string;
  memberName?: string;
  mode: 'change' | 'invite';
}

export function RoleSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentRole,
  memberName,
  mode 
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [confirmingHighRisk, setConfirmingHighRisk] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (role: RoleOption) => {
    if (role.securityLevel === 'critical' || role.securityLevel === 'high') {
      setSelectedRole(role.value);
      setConfirmingHighRisk(true);
    } else {
      onSelect(role.value);
      onClose();
    }
  };

  const confirmHighRiskSelection = () => {
    if (selectedRole) {
      onSelect(selectedRole);
      onClose();
      setConfirmingHighRisk(false);
      setSelectedRole(null);
    }
  };

  const securityBadge = (level: string) => {
    const styles = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      high: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      low: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
    };
    return styles[level as keyof typeof styles] || styles.low;
  };

  return (
    <div className="fixed top-24 left-0 lg:left-[280px] right-0 bottom-0 z-30 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-10rem)] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              {mode === 'change' ? 'Change Role' : 'Select Role'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {memberName ? `For ${memberName}` : 'Choose the appropriate access level'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Dialog for High-Risk Roles - Restricted to absolute within the modal container */}
        {confirmingHighRisk && selectedRole && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 m-8 max-w-md shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">High-Privilege Role</h3>
                  <p className="text-sm text-slate-500">This role grants extensive access</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                You are about to assign the <span className="font-bold text-amber-600">{ROLES.find(r => r.value === selectedRole)?.label}</span> role. 
                This grants significant permissions to <span className="font-bold text-slate-900 dark:text-white lowercase">{memberName || 'this member'}</span>. Are you sure?
              </p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
                  onClick={() => { setConfirmingHighRisk(false); setSelectedRole(null); }}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center"
                  onClick={confirmHighRiskSelection}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Cards Grid - Now flex-1 to fill space and scroll */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROLES.filter(role => role.value !== 'owner' || mode === 'change').map((role) => (
              <button
                key={role.value}
                onClick={() => handleSelect(role)}
                disabled={role.value === currentRole}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                  role.color,
                  role.value === currentRole 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 overflow-hidden"
                )}
              >
                {role.value === currentRole && (
                  <div className="absolute top-2 right-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full z-10">
                    Current
                  </div>
                )}
                <div className="flex items-start gap-3 relative z-0">
                  <span className="text-2xl shrink-0">{role.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-slate-900 dark:text-white truncate">
                        {role.label}
                      </h3>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0", securityBadge(role.securityLevel))}>
                        {role.securityLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((perm, i) => (
                        <span key={i} className="text-[10px] bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-100 dark:border-slate-700">
                          {perm}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{role.permissions.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <p className="text-xs text-slate-500 text-center">
            💡 Tip: Always assign the minimum permissions required for the job.
          </p>
        </div>
      </div>
    </div>
  );
}
