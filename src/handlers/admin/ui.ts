import { Hono } from 'hono';
import { Bindings } from '../../types/bindings';

type AdminContext = {
  Bindings: Bindings;
};

const app = new Hono<AdminContext>();

// Serve the admin UI main page
app.get('/admin', async (c) => {
  // In a real implementation with a build process, 
  // the React app would be built to static files in a public directory
  // For now, return a HTML page that will load the admin UI
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>OAuth 2.1 MCP Gateway Admin</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
        
        <script type="text/babel">
          const { useState, useEffect } = React;
          
          // Simple mock API calls
          function useMockData() {
            const [data, setData] = useState({
              tenants: [],
              auditLogs: [],
              usageMetrics: {},
              clients: []
            });
            
            useEffect(() => {
              // Mock data initialization
              setData({
                tenants: [
                  { id: 'tenant-1', name: 'Acme Corp', status: 'active', compliance_tier: 'enterprise' },
                  { id: 'tenant-2', name: 'Globex Inc', status: 'active', compliance_tier: 'standard' }
                ],
                auditLogs: [
                  { id: 'log-1', timestamp: new Date().toISOString(), user_id: 'user-1', action: 'tenant_created', success: true },
                  { id: 'log-2', timestamp: new Date(Date.now() - 3600000).toISOString(), user_id: 'user-2', action: 'token_issued', success: true }
                ],
                usageMetrics: {
                  total_requests: 85000,
                  successful_requests: 84500,
                  failed_requests: 500,
                  average_response_time_ms: 120,
                  active_users: 250,
                  active_mcp_servers: 8,
                  active_oauth_clients: 15,
                  billable_requests: 85000,
                  estimated_cost: 299.00,
                },
                clients: [
                  { id: 'client-1', name: 'Web App', status: 'active' },
                  { id: 'client-2', name: 'Mobile App', status: 'active' }
                ]
              });
            }, []);
            
            return data;
          }
          
          function AdminDashboard() {
            const { tenants, auditLogs, usageMetrics, clients } = useMockData();
            
            const [activeTab, setActiveTab] = useState('tenants');
            
            return (
              <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                      <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-900">OAuth 2.1 MCP Gateway Admin</h1>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Admin User</span>
                        <button className="text-sm text-indigo-600 hover:text-indigo-900">
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </header>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {/* Navigation Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      {['tenants', 'clients', 'audit', 'usage'].map((tab) => (
                        <button
                          key={tab}
                          className={\`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm \${activeTab === tab 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Main Content */}
                  <div className="mt-6">
                    {activeTab === 'tenants' && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-lg font-medium text-gray-900">Tenants</h2>
                          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add New Tenant
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Compliance
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Created
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${tenant.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'}\`}>
                                      {tenant.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenant.compliance_tier}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date().toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button className="text-red-600 hover:text-red-900">Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'clients' && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-lg font-medium text-gray-900">OAuth Clients</h2>
                          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add New Client
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Created
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {clients.map((client) => (
                                <tr key={client.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {client.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${client.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'}\`}>
                                      {client.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date().toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button className="text-red-600 hover:text-red-900">Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'audit' && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Audit Logs</h2>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Timestamp
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Success
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {auditLogs.map((log) => (
                                <tr key={log.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.user_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {log.action}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${log.success 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'}\`}>
                                      {log.success ? 'Success' : 'Failed'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'usage' && (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Usage Analytics</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                              {usageMetrics.total_requests?.toLocaleString() || '0'}
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-500">Successful Requests</h3>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                              {usageMetrics.successful_requests?.toLocaleString() || '0'}
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                              {usageMetrics.average_response_time_ms?.toFixed(2) || '0'}ms
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-500">Estimated Cost</h3>
                            <p className="text-3xl font-bold text-indigo-600 mt-2">
                              \$ {usageMetrics.estimated_cost?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage vs Limit</h3>
                          <div className="flex items-center justify-center h-64">
                            <div className="relative w-64 h-64">
                              <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="8"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="#4f46e5"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray="219.91 283"  // 77% of full circle
                                  transform="rotate(-90 50 50)"
                                />
                                <text
                                  x="50"
                                  y="50"
                                  textAnchor="middle"
                                  dy="0.3em"
                                  fontSize="14"
                                  fontWeight="bold"
                                  fill="#1f2937"
                                >
                                  77%
                                </text>
                                <text
                                  x="50"
                                  y="60"
                                  textAnchor="middle"
                                  fontSize="8"
                                  fill="#6b7280"
                                >
                                  Requests
                                </text>
                              </svg>
                            </div>
                          </div>
                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500">
                              {usageMetrics.total_requests?.toLocaleString() || '0'} of 110,000 requests used
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(AdminDashboard));
        </script>
      </body>
    </html>
  `;
  
  return c.html(html);
});

export default app;