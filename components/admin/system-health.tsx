'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SystemMetrics {
  users: {
    total: number;
    activeToday: number;
  };
  database: {
    size: string;
    connectionPoolSize: number;
    activeConnections: number;
  };
  api: {
    requestsLastHour: number;
    errorsLastHour: number;
    avgResponseTime: number;
  };
  integrations: {
    supabase: 'healthy' | 'degraded' | 'down';
    google: 'healthy' | 'degraded' | 'down';
  };
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      const response = await fetch('/api/admin/health');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast.error('Failed to load system metrics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load metrics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.users.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Today</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.users.activeToday}</p>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Database Size</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.database.size}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pool Size</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.database.connectionPoolSize}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Connections</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.database.activeConnections}
            </p>
          </div>
        </div>
      </div>

      {/* API Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Requests (Last Hour)</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.api.requestsLastHour}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Errors (Last Hour)</p>
            <p className="text-2xl font-bold text-red-600">
              {metrics.api.errorsLastHour}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.api.avgResponseTime}ms
            </p>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integrations</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Supabase</span>
            <StatusBadge status={metrics.integrations.supabase} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Google Workspace</span>
            <StatusBadge status={metrics.integrations.google} />
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-xs text-gray-500 text-center">
        Auto-refreshing every 30 seconds
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
