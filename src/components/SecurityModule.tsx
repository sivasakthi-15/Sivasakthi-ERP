import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile, RoleConfig, UserPermissions, SecurityNotification } from '../types';
import { 
  Users, Key, ShieldCheck, ClipboardList, ShieldAlert, Search, Plus, Trash2, 
  UserPlus, UserCheck, UserX, KeyRound, Check, RefreshCw, AlertTriangle, 
  MapPin, Radio, Monitor, Clock, ChevronDown, ChevronRight, FileText, Download,
  Filter, Bell, CheckCircle2, ShieldOff
} from 'lucide-react';

export const SecurityModule: React.FC = () => {
  const { 
    currentUser, users, roles, sessions, securityNotifications, auditLogs, loginHistory,
    addUser, updateUser, deactivateUser, deleteUser, resetUserPasswordAdmin,
    addCustomRole, updateCustomRole, deleteCustomRole,
    markNotificationRead, clearNotifications, triggerNotification
  } = useApp();

  // Active sub-tabs inside Security Admin panel
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'rbac' | 'sessions' | 'audits'>('users');

  // Search/Filters states
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditUserFilter, setAuditUserFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  // Form states: User Dialog
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    branch: 'sivasakthi_elec',
    password: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Form states: Admin Password Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUserId, setResetTargetUserId] = useState<string | null>(null);
  const [newAdminResetPass, setNewAdminResetPass] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form states: Custom Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormLabel, setRoleFormLabel] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormPerms, setRoleFormPerms] = useState<UserPermissions>({
    billing: { view: true, create: true, edit: false, delete: false, print: true, export: false },
    purchase: { view: true, create: true, edit: false, delete: false, print: true, export: false },
    inventory: { view: true, stockAdjustment: false, stockTransfer: true },
    reports: { view: true, export: false },
    accounting: { view: true, edit: false },
    settings: { fullControl: false }
  });

  // Expand states for Audit Rows to view details (Diffs and IPs)
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Helper: Format Dates
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ----------------------------------------------------
  // HANDLERS: USER MANAGEMENT
  // ----------------------------------------------------
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'manager',
      branch: 'sivasakthi_elec',
      password: '',
      status: 'active'
    });
    setUserFormError(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      branch: u.branch,
      password: '', // blank password unless overriding
      status: u.status
    });
    setUserFormError(null);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (editingUserId) {
      // Edit mode
      updateUser(editingUserId, {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        branch: userForm.branch,
        status: userForm.status
      });
      setShowUserModal(false);
    } else {
      // Create mode
      if (!userForm.password) {
        setUserFormError('Password is required for new users.');
        return;
      }
      const res = await addUser({
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        branch: userForm.branch,
        status: 'active',
        permittedBranches: userForm.branch === 'all' ? ['sivasakthi_elec', 'meenatchi_pipes'] : [userForm.branch]
      }, userForm.password);

      if (res.success) {
        setShowUserModal(false);
      } else {
        setUserFormError(res.error || 'Failed to create user account.');
      }
    }
  };

  const handleTriggerAdminReset = (userId: string) => {
    setResetTargetUserId(userId);
    setNewAdminResetPass('');
    setResetError(null);
    setResetSuccess(false);
    setShowResetModal(true);
  };

  const handleConfirmAdminReset = async () => {
    if (!resetTargetUserId || !newAdminResetPass) return;
    setResetError(null);
    const res = await resetUserPasswordAdmin(resetTargetUserId, newAdminResetPass);
    if (res.success) {
      setResetSuccess(true);
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(false);
      }, 1500);
    } else {
      setResetError(res.error || 'Failed to override password.');
    }
  };

  // ----------------------------------------------------
  // HANDLERS: ROLE / PERMISSIONS MANAGEMENT
  // ----------------------------------------------------
  const handleTogglePerm = (roleName: string, module: keyof UserPermissions, action: string) => {
    const role = roles.find(r => r.name === roleName);
    if (!role) return;

    // Full control overrides everything
    if (module === 'settings' && action === 'fullControl') {
      const currentVal = !role.permissions.settings.fullControl;
      const updatedPerms = { ...role.permissions, settings: { fullControl: currentVal } };
      updateCustomRole(roleName, updatedPerms);
      return;
    }

    const currentPerms = { ...role.permissions } as any;
    if (currentPerms[module]) {
      currentPerms[module] = {
        ...currentPerms[module],
        [action]: !currentPerms[module][action]
      };
      updateCustomRole(roleName, currentPerms);
    }
  };

  const handleCreateCustomRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName || !roleFormLabel) return;
    
    const roleId = roleFormName.toLowerCase().replace(/\s+/g, '_');
    const newRole: RoleConfig = {
      name: roleId,
      label: roleFormLabel,
      description: roleFormDesc,
      permissions: roleFormPerms,
      isSystem: false
    };
    
    addCustomRole(newRole);
    setShowRoleModal(false);
    setRoleFormName('');
    setRoleFormLabel('');
    setRoleFormDesc('');
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.user.toLowerCase().includes(auditSearch.toLowerCase());
    
    const matchesAction = auditActionFilter === 'all' || log.action.toLowerCase() === auditActionFilter.toLowerCase();
    const matchesUser = auditUserFilter === 'all' || log.user.toLowerCase() === auditUserFilter.toLowerCase();
    const matchesDate = !auditDateFilter || log.date === auditDateFilter;

    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  // Export Audits to JSON
  const handleExportAudits = () => {
    const jsonStr = JSON.stringify(filteredAudits, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get distinct list of audit action and user types for filter dropdowns
  const auditActions = Array.from(new Set(auditLogs.map(l => l.action)));
  const auditUsers = Array.from(new Set(auditLogs.map(l => l.user)));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-y-auto">
      
      {/* Module Title Bar */}
      <div className="bg-white border-b border-gray-150 py-4 px-6 sticky top-0 z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-50 text-red-700 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Enterprise Security & Admin Node
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure system branch routing, security controls, custom roles, and review the immutable cryptographic audit trails.
          </p>
        </div>
        
        {/* Branch / User Status badge */}
        <div className="flex items-center gap-2 bg-neutral-900 text-white text-xs py-2 px-3.5 rounded-xl font-mono shadow-sm">
          <Monitor className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Operator: <strong>{currentUser?.name}</strong> ({(currentUser?.role || '').toUpperCase()})</span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* SUMMARY TILES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-150 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Corporate Directory</div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{users.length} Users</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Across {new Set(users.map(u=>u.branch)).size} branch networks</div>
            </div>
            <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-600">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-150 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Active Terminal Nodes</div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
                {sessions.filter(s => s.isActive).length} Sessions
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live socket tunnels
              </div>
            </div>
            <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-150 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Security Alerts</div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
                {securityNotifications.filter(n => !n.read).length} Unread
              </div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                {securityNotifications.filter(n => n.type === 'failed_login').length} Auth alerts pending
              </div>
            </div>
            <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-150 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Audit Log Ledger</div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
                {auditLogs.length} Entries
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">100% Cryptographic integrity</div>
            </div>
            <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* SECURITY ALERT FEED PANEL (Section 10) */}
        {securityNotifications.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-red-600 animate-bounce" />
                <h3 className="text-xs font-bold tracking-tight uppercase text-gray-800">Real-time Node Security Alerts</h3>
              </div>
              <button
                onClick={clearNotifications}
                className="text-[10px] text-gray-500 hover:text-black font-semibold font-mono"
              >
                Clear Alert Cache
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto">
              {securityNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.read 
                      ? 'bg-gray-50/50 border-gray-100 text-gray-400' 
                      : notif.type === 'failed_login' 
                        ? 'bg-red-50/70 border-red-100 text-red-900' 
                        : notif.type === 'low_stock'
                          ? 'bg-amber-50/70 border-amber-100 text-amber-900'
                          : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
                  }`}
                >
                  <AlertTriangle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                    notif.type === 'failed_login' ? 'text-red-600' : 'text-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold truncate">{notif.title}</span>
                      <span className="text-[9px] font-mono shrink-0 opacity-75">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-normal">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB TAB CONTROLS */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'rbac', label: 'Custom Roles & RBAC', icon: ShieldCheck },
            { id: 'sessions', label: 'Terminal Sessions', icon: Monitor },
            { id: 'audits', label: 'Immutable Audit Trail', icon: ClipboardList }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB VIEW 1: USER ACCOUNTS DIRECTORY */}
        {activeSubTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            
            {/* Toolbar */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user profile..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <button
                onClick={handleOpenAddUser}
                className="w-full sm:w-auto py-2 px-3 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create User Account</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/30 text-gray-500 border-b border-gray-100 uppercase tracking-wider font-mono text-[10px]">
                    <th className="p-4 font-bold">User / Profile</th>
                    <th className="p-4 font-bold">Role Assignment</th>
                    <th className="p-4 font-bold">Branch Access</th>
                    <th className="p-4 font-bold">Account Status</th>
                    <th className="p-4 font-bold">Last Active login</th>
                    <th className="p-4 font-bold text-right">Terminal Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono tracking-tight mt-0.5">{user.email}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{user.phone}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold px-2 py-1 bg-neutral-100 text-neutral-800 rounded font-mono text-[10px] uppercase">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold px-2 py-1 bg-blue-50 text-blue-800 rounded font-mono text-[10px] uppercase">
                          {user.branch === 'all' ? 'All Branches' : user.branch}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold leading-none ${
                          user.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'bg-red-50 text-red-800'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Admin override password reset"
                            onClick={() => handleTriggerAdminReset(user.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            title="Edit Profile"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          {user.role !== 'owner' && (
                            <>
                              {user.status === 'active' ? (
                                <button
                                  title="Deactivate Account"
                                  onClick={() => deactivateUser(user.id)}
                                  className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-700 cursor-pointer"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  title="Activate Account"
                                  onClick={() => updateUser(user.id, { status: 'active' })}
                                  className="p-1.5 hover:bg-emerald-50 rounded text-gray-400 hover:text-emerald-700 cursor-pointer"
                                >
                                  <UserCheck className="h-4 w-4 text-emerald-600" />
                                </button>
                              )}
                              <button
                                title="Delete Permanently"
                                onClick={() => {
                                  if (confirm(`Are you absolutely sure you want to permanently delete user ${user.name}? This cannot be undone.`)) {
                                    deleteUser(user.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB VIEW 2: ROLE CONFIGURATIONS & RBAC (Section 3 & 4) */}
        {activeSubTab === 'rbac' && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Custom Role Matrix Definitions</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Granular permission overrides for each modular ledger. Owner role possesses immutable administrative overrides.
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(true)}
                className="py-2 px-3 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Define Custom Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {roles.map((role) => {
                const isSystem = role.isSystem;
                return (
                  <div key={role.name} className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{role.label}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold ${
                            isSystem ? 'bg-neutral-200 text-neutral-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isSystem ? 'System Core' : 'Custom Defined'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      </div>

                      {!isSystem && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete the custom defined role ${role.label}? All users bound to this role will need to be reallocated.`)) {
                              deleteCustomRole(role.name);
                            }
                          }}
                          className="py-1 px-2 hover:bg-red-50 text-red-700 hover:text-red-900 text-[10px] font-semibold border border-red-200 hover:border-red-300 rounded font-mono"
                        >
                          Decommission Role
                        </button>
                      )}
                    </div>

                    {/* Permissions grid */}
                    <div className="p-4">
                      {role.permissions.settings.fullControl ? (
                        <div className="bg-neutral-900 text-white rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold font-mono uppercase tracking-widest text-emerald-400">Owner Level Overrides Enabled</div>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                              This system operational profile possesses full execution rights bypass. All ledger actions are authorized natively.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          
                          {/* Module: POS Billing */}
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/20">
                            <div className="font-bold text-gray-900 font-mono tracking-wider uppercase text-[10px] border-b border-gray-100 pb-1.5 mb-2 flex items-center justify-between">
                              <span>POS Billing</span>
                            </div>
                            <div className="space-y-2">
                              {['view', 'create', 'edit', 'delete', 'print', 'export'].map((action) => {
                                const active = !!(role.permissions.billing as any)?.[action];
                                return (
                                  <label key={action} className="flex items-center justify-between text-[11px] font-mono font-medium text-gray-600 cursor-pointer">
                                    <span className="capitalize">{action}</span>
                                    <input 
                                      type="checkbox" 
                                      checked={active}
                                      onChange={() => handleTogglePerm(role.name, 'billing', action)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Module: Purchase */}
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/20">
                            <div className="font-bold text-gray-900 font-mono tracking-wider uppercase text-[10px] border-b border-gray-100 pb-1.5 mb-2">
                              Purchase Inward
                            </div>
                            <div className="space-y-2">
                              {['view', 'create', 'edit', 'delete', 'print', 'export'].map((action) => {
                                const active = !!(role.permissions.purchase as any)?.[action];
                                return (
                                  <label key={action} className="flex items-center justify-between text-[11px] font-mono font-medium text-gray-600 cursor-pointer">
                                    <span className="capitalize">{action}</span>
                                    <input 
                                      type="checkbox" 
                                      checked={active}
                                      onChange={() => handleTogglePerm(role.name, 'purchase', action)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Module: Inventory */}
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/20">
                            <div className="font-bold text-gray-900 font-mono tracking-wider uppercase text-[10px] border-b border-gray-100 pb-1.5 mb-2">
                              Inventory Register
                            </div>
                            <div className="space-y-2">
                              {[
                                { key: 'view', label: 'View Register' },
                                { key: 'stockAdjustment', label: 'Stock Adjustment' },
                                { key: 'stockTransfer', label: 'Warehouse Transfer' }
                              ].map((action) => {
                                const active = !!(role.permissions.inventory as any)?.[action.key];
                                return (
                                  <label key={action.key} className="flex items-center justify-between text-[11px] font-mono font-medium text-gray-600 cursor-pointer">
                                    <span>{action.label}</span>
                                    <input 
                                      type="checkbox" 
                                      checked={active}
                                      onChange={() => handleTogglePerm(role.name, 'inventory', action.key)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Module: Reports */}
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/20">
                            <div className="font-bold text-gray-900 font-mono tracking-wider uppercase text-[10px] border-b border-gray-100 pb-1.5 mb-2">
                              Ledger Reports
                            </div>
                            <div className="space-y-2">
                              {[
                                { key: 'view', label: 'View Reports' },
                                { key: 'export', label: 'Export Books' }
                              ].map((action) => {
                                const active = !!(role.permissions.reports as any)?.[action.key];
                                return (
                                  <label key={action.key} className="flex items-center justify-between text-[11px] font-mono font-medium text-gray-600 cursor-pointer">
                                    <span>{action.label}</span>
                                    <input 
                                      type="checkbox" 
                                      checked={active}
                                      onChange={() => handleTogglePerm(role.name, 'reports', action.key)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Module: Accounting */}
                          <div className="border border-gray-150 rounded-xl p-3 bg-gray-50/20">
                            <div className="font-bold text-gray-900 font-mono tracking-wider uppercase text-[10px] border-b border-gray-100 pb-1.5 mb-2">
                              Accounting Book
                            </div>
                            <div className="space-y-2">
                              {[
                                { key: 'view', label: 'View Ledger' },
                                { key: 'edit', label: 'Modify Entry' }
                              ].map((action) => {
                                const active = !!(role.permissions.accounting as any)?.[action.key];
                                return (
                                  <label key={action.key} className="flex items-center justify-between text-[11px] font-mono font-medium text-gray-600 cursor-pointer">
                                    <span>{action.label}</span>
                                    <input 
                                      type="checkbox" 
                                      checked={active}
                                      onChange={() => handleTogglePerm(role.name, 'accounting', action.key)}
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB VIEW 3: LIVE TERMINAL SESSIONS & HISTORY (Section 6 & 13) */}
        {activeSubTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Sessions Left */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm lg:col-span-2">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-gray-800">Active Live Terminal Sessions</h3>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {sessions.filter(s=>s.isActive).map((sess) => (
                  <div key={sess.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 text-xs">
                      <div className="p-2.5 bg-neutral-900 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                        <Monitor className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <span>{sess.userName}</span>
                          <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                            {sess.role}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] font-mono mt-0.5">{sess.email}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-[11px] text-gray-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                            <span>Logged In: {formatDate(sess.loginTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                            <span>Source Network: {sess.ipAddress}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 truncate max-w-md font-mono">UA: {sess.device}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historic login logs Right (Section 13) */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-gray-800">Login Authentication History</h3>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {loginHistory.map((hist) => (
                  <div key={hist.id} className="p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 font-mono truncate">{hist.email}</span>
                      <span className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[9px] font-bold ${
                        hist.action === 'LOGIN' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {hist.action}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-1">
                      <span>{formatDate(hist.timestamp)}</span>
                      <span>{hist.ip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB VIEW 4: IMMUTABLE AUDIT TRAIL LOGS (Section 5 & 14) */}
        {activeSubTab === 'audits' && (
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            
            {/* Audits Filter bar */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-150 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Filter className="h-4 w-4" />
                  <span>Ledger Audit Log Filters</span>
                </div>
                <button
                  onClick={handleExportAudits}
                  className="py-1.5 px-3 border border-gray-200 hover:border-black text-black hover:bg-gray-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export JSON Ledger</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs details..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Filter Action */}
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="all">All Actions</option>
                  {auditActions.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>

                {/* Filter User */}
                <select
                  value={auditUserFilter}
                  onChange={(e) => setAuditUserFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="all">All Operator Users</option>
                  {auditUsers.map(usr => (
                    <option key={usr} value={usr}>{usr}</option>
                  ))}
                </select>

                {/* Filter Date */}
                <input
                  type="date"
                  value={auditDateFilter}
                  onChange={(e) => setAuditDateFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />

              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 text-gray-500 border-b border-gray-100 uppercase tracking-wider font-mono text-[10px]">
                    <th className="p-4 w-10"></th>
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">Operator</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Audit Description Details</th>
                    <th className="p-4 font-bold">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAudits.map((log) => {
                    const isExpanded = expandedAuditId === log.id;
                    const hasDiff = log.oldValue || log.newValue;
                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          onClick={() => hasDiff && setExpandedAuditId(isExpanded ? null : log.id)}
                          className={`hover:bg-gray-50/50 transition-colors ${hasDiff ? 'cursor-pointer' : ''}`}
                        >
                          <td className="p-4 text-center">
                            {hasDiff ? (
                              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            ) : null}
                          </td>
                          <td className="p-4 text-gray-500 font-mono">
                            {log.date} {log.time}
                          </td>
                          <td className="p-4 font-semibold text-gray-900">
                            {log.user}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-mono text-[9px] uppercase">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700 leading-normal">
                            {log.details}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[10px]">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>

                        {/* Collapsible differential details sub-row (Section 5) */}
                        {isExpanded && hasDiff && (
                          <tr className="bg-neutral-50 animate-fade-in border-b border-gray-150">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-400">Old Value Ledger State:</div>
                                  <pre className="p-3 bg-neutral-900 text-gray-200 border border-neutral-800 rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                                    {log.oldValue ? JSON.stringify(JSON.parse(log.oldValue), null, 2) : 'NULL'}
                                  </pre>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-600">New Value Ledger State:</div>
                                  <pre className="p-3 bg-neutral-900 text-gray-200 border border-neutral-800 rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                                    {log.newValue ? JSON.stringify(JSON.parse(log.newValue), null, 2) : 'NULL'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredAudits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-mono">
                        No audit ledger records found matching selection filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT USER DIALOG */}
      {/* ----------------------------------------------------------------- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {editingUserId ? 'Edit Operator Account' : 'Provision User Account'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-black">
                <Trash2 className="h-5 w-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Operator Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Karthik Electrician"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address (Login ID)</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="karthik@sivasakthi.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mobile/Phone Number</label>
                <input
                  type="text"
                  required
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="9443211223"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Access Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {roles.map(r => (
                      <option key={r.name} value={r.name}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Branch Authorization</label>
                  <select
                    value={userForm.branch}
                    onChange={(e) => setUserForm({...userForm, branch: e.target.value})}
                    className="w-full px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="all">All Branches (Corp)</option>
                    <option value="sivasakthi_elec">Sivasakthi Electricals</option>
                    <option value="meenatchi_pipes">Meenatchi Pipes</option>
                  </select>
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Secret Access Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="••••••••"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 font-mono leading-normal">
                    Strict Policy: Min 8 characters, uppercase, lowercase, number, symbol.
                  </div>
                </div>
              )}

              {userFormError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[11px] text-red-800 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{userFormError}</div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2 px-3 border border-gray-250 text-gray-600 hover:text-black font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white hover:bg-neutral-800 font-semibold text-xs rounded-lg cursor-pointer shadow-sm"
                >
                  Confirm Account Setup
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 2: MANUAL OVERRIDE PASSWORD MODAL (ADMIN ACTION) */}
      {/* ----------------------------------------------------------------- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-red-600" />
                <span>Override Account Password</span>
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 leading-normal">
                Override the target operator password credentials manually. The user will be requested to change this password on next login.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Operator Password</label>
                <input
                  type="password"
                  required
                  value={newAdminResetPass}
                  onChange={(e) => setNewAdminResetPass(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Enter secure password override"
                />
              </div>

              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px] text-red-800 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{resetError}</div>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Password overridden successfully!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="py-1.5 px-3 border border-gray-200 text-gray-500 hover:text-black font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdminReset}
                  className="py-1.5 px-3.5 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-sm"
                >
                  Confirm Override
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL 3: DEFINE CUSTOM ROLE DIALOG */}
      {/* ----------------------------------------------------------------- */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Define Custom Access Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-black">
                <Trash2 className="h-5 w-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomRoleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Unique Role Identifier (Id)</label>
                <input
                  type="text"
                  required
                  value={roleFormName}
                  onChange={(e) => setRoleFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. auditor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={roleFormLabel}
                  onChange={(e) => setRoleFormLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Internal Auditor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description</label>
                <textarea
                  required
                  value={roleFormDesc}
                  onChange={(e) => setRoleFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Access tax reports and corporate sales invoices without modification rights."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="py-2 px-3 border border-gray-250 text-gray-600 hover:text-black font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white hover:bg-neutral-800 font-semibold text-xs rounded-lg cursor-pointer shadow-sm"
                >
                  Instantiate Access Role
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
