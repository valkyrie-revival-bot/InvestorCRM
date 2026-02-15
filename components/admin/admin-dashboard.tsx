'use client';

import { useEffect, useState } from 'react';
import { UserManagement } from './user-management';
import { SystemHealth } from './system-health';
import { AuditLogViewer } from './audit-log-viewer';

type TabType = 'users' | 'health' | 'audit';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'health'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            System Health
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Audit Logs
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'health' && <SystemHealth />}
        {activeTab === 'audit' && <AuditLogViewer />}
      </div>
    </div>
  );
}
