import { FC, useState } from 'react';
import { OAuthClient } from '../../database/schema';

export interface ClientManagementProps {
  initialClients?: OAuthClient[];
}

export const ClientManagement: FC<ClientManagementProps> = ({ 
  initialClients = [] 
}) => {
  const [clients, setClients] = useState<OAuthClient[]>(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState<Omit<OAuthClient, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>({
    client_id: '',
    client_secret: '',
    client_name: '',
    client_uri: '',
    redirect_uris: [''],
    grant_types: ['authorization_code'],
    response_types: ['code'],
    scope: '',
    logo_uri: '',
    client_type: 'public',
    status: 'active',
  });

  const handleAddClient = () => {
    const client: OAuthClient = {
      ...newClient,
      id: `client-${Date.now()}`,
      tenant_id: 'default-tenant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_secret: newClient.client_secret || undefined
    };
    
    setClients([...clients, client]);
    setNewClient({
      client_id: '',
      client_secret: '',
      client_name: '',
      client_uri: '',
      redirect_uris: [''],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: '',
      logo_uri: '',
      client_type: 'public',
      status: 'active',
    });
    setShowForm(false);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter(client => client.id !== clientId));
  };

  const handleAddRedirectUri = () => {
    setNewClient({
      ...newClient,
      redirect_uris: [...newClient.redirect_uris, '']
    });
  };

  const handleRedirectUriChange = (index: number, value: string) => {
    const updatedUris = [...newClient.redirect_uris];
    updatedUris[index] = value;
    setNewClient({
      ...newClient,
      redirect_uris: updatedUris
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">OAuth Client Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showForm ? 'Cancel' : 'Add New Client'}
        </button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">Add New OAuth Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={newClient.client_name}
                onChange={(e) => setNewClient({...newClient, client_name: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client URI</label>
              <input
                type="text"
                value={newClient.client_uri || ''}
                onChange={(e) => setNewClient({...newClient, client_uri: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URI</label>
              <input
                type="text"
                value={newClient.logo_uri || ''}
                onChange={(e) => setNewClient({...newClient, logo_uri: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <input
                type="text"
                value={newClient.scope}
                onChange={(e) => setNewClient({...newClient, scope: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
              <select
                value={newClient.client_type}
                onChange={(e) => setNewClient({...newClient, client_type: e.target.value as 'public' | 'confidential'})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="public">Public</option>
                <option value="confidential">Confidential</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newClient.status}
                onChange={(e) => setNewClient({...newClient, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          {/* Redirect URIs */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URIs</label>
            {newClient.redirect_uris.map((uri, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={uri}
                  onChange={(e) => handleRedirectUriChange(index, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://yourapp.com/callback"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddRedirectUri}
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              + Add Redirect URI
            </button>
          </div>
          
          {/* Grant Types */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grant Types</label>
            <div className="grid grid-cols-3 gap-2">
              {['authorization_code', 'client_credentials', 'refresh_token', 'implicit'].map((grantType) => (
                <div key={grantType} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`grant-${grantType}`}
                    checked={newClient.grant_types.includes(grantType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (!newClient.grant_types.includes(grantType)) {
                          setNewClient({
                            ...newClient,
                            grant_types: [...newClient.grant_types, grantType]
                          });
                        }
                      } else {
                        setNewClient({
                          ...newClient,
                          grant_types: newClient.grant_types.filter(gt => gt !== grantType)
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`grant-${grantType}`} className="ml-2 block text-sm text-gray-900">
                    {grantType.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Response Types */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Types</label>
            <div className="grid grid-cols-2 gap-2">
              {['code', 'token', 'id_token'].map((responseType) => (
                <div key={responseType} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`response-${responseType}`}
                    checked={newClient.response_types.includes(responseType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (!newClient.response_types.includes(responseType)) {
                          setNewClient({
                            ...newClient,
                            response_types: [...newClient.response_types, responseType]
                          });
                        }
                      } else {
                        setNewClient({
                          ...newClient,
                          response_types: newClient.response_types.filter(rt => rt !== responseType)
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`response-${responseType}`} className="ml-2 block text-sm text-gray-900">
                    {responseType}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleAddClient}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Client
            </button>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{client.client_name}</div>
                  <div className="text-sm text-gray-500">{client.client_uri}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.client_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.client_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : client.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Key Rotation Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Key Management</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Current API Keys</h4>
              <p className="text-3xl font-bold text-indigo-600">12</p>
              <p className="text-sm text-gray-500 mt-1">Active keys across all tenants</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Last Rotation</h4>
              <p className="text-lg font-medium text-gray-900">2023-06-15</p>
              <p className="text-sm text-gray-500 mt-1">Automated monthly rotation</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Usage</h4>
              <p className="text-lg font-medium text-gray-900">85%</p>
              <p className="text-sm text-gray-500 mt-1">of rate limit capacity</p>
            </div>
          </div>
          <div className="mt-6">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Rotate All API Keys
            </button>
            <button className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Generate New Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};