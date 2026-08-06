"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API Key data structure from Convex database
 */
interface ApiKey {
  _id: Id<"apiKeys">;
  _creationTime: number;
  name: string;
  key: string; // The actual API key (partially masked in UI)
  projectId: Id<"projects">;
  projectName: string;
  status: "active" | "revoked" | "expired";
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  permissions: string[];
  usageCount: number;
  rateLimit?: number;
}

/**
 * Props for API key creation modal
 */
interface CreateApiKeyFormData {
  name: string;
  projectId: string;
  permissions: string[];
  expiresInDays?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ApiKeysPage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<Id<"apiKeys"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ============================================================================
  // CONVEX QUERIES & MUTATIONS
  // ============================================================================

  /**
   * Fetch all API keys for the current user
   * Real implementation: api.apiKeys.listUserApiKeys
   */
  const apiKeys = useQuery(
    api.apiKeys.listUserApiKeys,
    isUserLoaded && user ? { userId: user.id } : "skip"
  );

  /**
   * Fetch user's projects for the creation dropdown
   * Real implementation: api.projects.listUserProjects
   */
  const projects = useQuery(
    api.projects.listUserProjects,
    isUserLoaded && user ? { userId: user.id } : "skip"
  );

  /**
   * Create new API key mutation
   * Real implementation: api.apiKeys.createApiKey
   */
  const createApiKey = useMutation(api.apiKeys.createApiKey);

  /**
   * Revoke API key mutation
   * Real implementation: api.apiKeys.revokeApiKey
   */
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);

  /**
   * Delete API key mutation (hard delete)
   * Real implementation: api.apiKeys.deleteApiKey
   */
  const deleteApiKey = useMutation(api.apiKeys.deleteApiKey);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Calculate API key statistics
   */
  const stats = useMemo(() => {
    if (!apiKeys) return { total: 0, active: 0, revoked: 0, expired: 0 };

    const now = Date.now();
    return {
      total: apiKeys.length,
      active: apiKeys.filter((k) => k.status === "active").length,
      revoked: apiKeys.filter((k) => k.status === "revoked").length,
      expired: apiKeys.filter(
        (k) => k.expiresAt && k.expiresAt < now && k.status === "active"
      ).length,
    };
  }, [apiKeys]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Copy API key to clipboard with visual feedback
   */
  const handleCopyKey = async (keyId: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error("Failed to copy key:", error);
      alert("Failed to copy API key. Please try again.");
    }
  };

  /**
   * Toggle visibility of a specific API key
   */
  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  /**
   * Handle API key creation
   */
  const handleCreateApiKey = async (data: CreateApiKeyFormData) => {
    try {
      const result = await createApiKey({
        name: data.name,
        projectId: data.projectId as Id<"projects">,
        permissions: data.permissions,
        expiresInDays: data.expiresInDays,
      });

      // Show the newly created key once (security best practice)
      setNewApiKey(result.key);
      setShowKeyModal(true);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key. Please try again.");
    }
  };

  /**
   * Handle API key revocation
   */
  const handleRevokeKey = async (keyId: Id<"apiKeys">) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      await revokeApiKey({ apiKeyId: keyId });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      alert("Failed to revoke API key. Please try again.");
    }
  };

  /**
   * Handle API key deletion
   */
  const handleDeleteKey = async () => {
    if (!selectedKeyId) return;

    try {
      await deleteApiKey({ apiKeyId: selectedKeyId });
      setShowDeleteConfirm(false);
      setSelectedKeyId(null);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      alert("Failed to delete API key. Please try again.");
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!isUserLoaded || apiKeys === undefined) {
    return (
      <div className="p-6 space-y-6">
        <ApiKeysPageSkeleton />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-wise-gray-900">API Keys</h1>
          <p className="text-wise-gray-600 mt-1">
            Manage your API keys for accessing OAuth 2.1 services
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-wise-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg"
          aria-label="Create new API key"
        >
          <Plus className="w-5 h-5" />
          <span>New API Key</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Keys" value={stats.total} icon={Key} />
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Revoked"
          value={stats.revoked}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Expired"
          value={stats.expired}
          icon={AlertTriangle}
          color="yellow"
        />
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Security Best Practices</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Never share your API keys publicly or commit them to version control</li>
            <li>Use environment variables to store keys in your applications</li>
            <li>Rotate keys regularly and revoke unused keys immediately</li>
            <li>Set appropriate permissions and expiration dates for each key</li>
          </ul>
        </div>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <EmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <ApiKeyCard
              key={apiKey._id}
              apiKey={apiKey}
              isVisible={visibleKeys.has(apiKey._id)}
              isCopied={copiedKey === apiKey._id}
              onToggleVisibility={() => toggleKeyVisibility(apiKey._id)}
              onCopy={() => handleCopyKey(apiKey._id, apiKey.key)}
              onRevoke={() => handleRevokeKey(apiKey._id)}
              onDelete={() => {
                setSelectedKeyId(apiKey._id);
                setShowDeleteConfirm(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          projects={projects || []}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateApiKey}
        />
      )}

      {/* New API Key Display Modal (shown once after creation) */}
      {showKeyModal && newApiKey && (
        <NewApiKeyModal
          apiKey={newApiKey}
          onClose={() => {
            setShowKeyModal(false);
            setNewApiKey(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onConfirm={handleDeleteKey}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedKeyId(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Stat card component for displaying API key statistics
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "red" | "yellow";
}

function StatCard({ label, value, icon: Icon, color = "green" }: StatCardProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="card-wise p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-wise-gray-600">{label}</p>
          <p className="text-2xl font-bold text-wise-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual API key card component
 */
interface ApiKeyCardProps {
  apiKey: ApiKey;
  isVisible: boolean;
  isCopied: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

function ApiKeyCard({
  apiKey,
  isVisible,
  isCopied,
  onToggleVisibility,
  onCopy,
  onRevoke,
  onDelete,
}: ApiKeyCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Status badge styling
  const statusStyles = {
    active: "bg-green-100 text-green-700",
    revoked: "bg-red-100 text-red-700",
    expired: "bg-yellow-100 text-yellow-700",
  };

  // Check if key is expired
  const isExpired =
    apiKey.expiresAt && apiKey.expiresAt < Date.now() && apiKey.status === "active";
  const displayStatus = isExpired ? "expired" : apiKey.status;

  // Mask API key for security
  const maskedKey = isVisible
    ? apiKey.key
    : `${apiKey.key.substring(0, 8)}${"•".repeat(32)}${apiKey.key.substring(apiKey.key.length - 8)}`;

  // Format dates
  const createdAt = new Date(apiKey.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const lastUsed = apiKey.lastUsedAt
    ? new Date(apiKey.lastUsedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never used";

  const expiresAt = apiKey.expiresAt
    ? new Date(apiKey.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  return (
    <div className="card-wise p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-wise-gray-900">{apiKey.name}</h3>
          <p className="text-sm text-wise-gray-600">Project: {apiKey.projectName}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statusStyles[displayStatus]
            }`}
          >
            {displayStatus}
          </span>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-wise-gray-100 rounded-lg transition-colors"
              aria-label="API key actions"
              aria-expanded={showMenu}
              disabled={apiKey.status === "revoked"}
            >
              <MoreVertical className="w-5 h-5 text-wise-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-wise-gray-200 py-1 z-20">
                  {apiKey.status === "active" && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRevoke();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-wise-gray-700 hover:bg-wise-gray-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Revoke Key</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Key</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* API Key Display */}
      <div className="bg-wise-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <code className="text-sm font-mono text-wise-gray-900 break-all flex-1">
            {maskedKey}
          </code>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onToggleVisibility}
              className="p-2 hover:bg-wise-gray-200 rounded-lg transition-colors"
              aria-label={isVisible ? "Hide API key" : "Show API key"}
              disabled={apiKey.status === "revoked"}
            >
              {isVisible ? (
                <EyeOff className="w-5 h-5 text-wise-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-wise-gray-600" />
              )}
            </button>
            <button
              onClick={onCopy}
              className="p-2 hover:bg-wise-gray-200 rounded-lg transition-colors"
              aria-label="Copy API key"
              disabled={apiKey.status === "revoked"}
            >
              {isCopied ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-wise-gray-600" />
              )}
            </button>
          </div>
        </div>

        {isCopied && (
          <p className="text-xs text-green-600 font-medium">Copied to clipboard!</p>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-wise-gray-600">Created</p>
          <p className="text-wise-gray-900 font-medium flex items-center gap-1 mt-1">
            <Calendar className="w-4 h-4" />
            {createdAt}
          </p>
        </div>
        <div>
          <p className="text-wise-gray-600">Last Used</p>
          <p className="text-wise-gray-900 font-medium mt-1">{lastUsed}</p>
        </div>
        <div>
          <p className="text-wise-gray-600">Expires</p>
          <p className="text-wise-gray-900 font-medium mt-1">{expiresAt}</p>
        </div>
        <div>
          <p className="text-wise-gray-600">Usage Count</p>
          <p className="text-wise-gray-900 font-medium mt-1">
            {apiKey.usageCount.toLocaleString()} calls
          </p>
        </div>
      </div>

      {/* Permissions */}
      {apiKey.permissions.length > 0 && (
        <div>
          <p className="text-sm text-wise-gray-600 mb-2">Permissions</p>
          <div className="flex flex-wrap gap-2">
            {apiKey.permissions.map((permission) => (
              <span
                key={permission}
                className="px-2 py-1 bg-wise-gray-100 text-wise-gray-700 text-xs rounded-md"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="card-wise p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-wise-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Key className="w-8 h-8 text-wise-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-wise-gray-900">No API keys yet</h3>
        <p className="text-wise-gray-600">
          Create your first API key to start integrating with your applications
        </p>
        <button onClick={onCreate} className="btn-wise-primary px-4 py-2 rounded-lg inline-flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Create API Key</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Create API Key Modal Component
 */
interface CreateApiKeyModalProps {
  projects: Array<{ _id: Id<"projects">; name: string }>;
  onClose: () => void;
  onCreate: (data: CreateApiKeyFormData) => void;
}

function CreateApiKeyModal({ projects, onClose, onCreate }: CreateApiKeyModalProps) {
  const [formData, setFormData] = useState<CreateApiKeyFormData>({
    name: "",
    projectId: "",
    permissions: [],
    expiresInDays: 90,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateApiKeyFormData, string>>>({});

  const availablePermissions = [
    "read:projects",
    "write:projects",
    "read:users",
    "write:users",
    "read:analytics",
    "admin:all",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Partial<Record<keyof CreateApiKeyFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.projectId) newErrors.projectId = "Project is required";
    if (formData.permissions.length === 0)
      newErrors.permissions = "At least one permission is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreate(formData);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
    setErrors((prev) => ({ ...prev, permissions: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-wise-gray-900">Create API Key</h2>
            <p className="text-wise-gray-600 mt-1">
              Generate a new API key for your application
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Key Name */}
            <div>
              <label htmlFor="key-name" className="block text-sm font-medium text-wise-gray-700 mb-1">
                Key Name *
              </label>
              <input
                type="text"
                id="key-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: undefined });
                }}
                placeholder="e.g., Production API Key"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary ${
                  errors.name ? "border-red-500" : "border-wise-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Project Selection */}
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-wise-gray-700 mb-1">
                Project *
              </label>
              <select
                id="project"
                value={formData.projectId}
                onChange={(e) => {
                  setFormData({ ...formData, projectId: e.target.value });
                  setErrors({ ...errors, projectId: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary ${
                  errors.projectId ? "border-red-500" : "border-wise-gray-300"
                }`}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-sm text-red-600 mt-1">{errors.projectId}</p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-wise-gray-700 mb-2">
                Permissions *
              </label>
              <div className="space-y-2">
                {availablePermissions.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 p-2 hover:bg-wise-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="w-4 h-4 text-wise-green-primary border-wise-gray-300 rounded focus:ring-wise-green-primary"
                    />
                    <span className="text-sm text-wise-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
              {errors.permissions && (
                <p className="text-sm text-red-600 mt-1">{errors.permissions}</p>
              )}
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="expiration" className="block text-sm font-medium text-wise-gray-700 mb-1">
                Expires In (Days)
              </label>
              <input
                type="number"
                id="expiration"
                value={formData.expiresInDays || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiresInDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Leave empty for no expiration"
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
              />
              <p className="text-xs text-wise-gray-600 mt-1">
                Recommended: 90 days for production keys
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-wise-secondary px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-wise-primary px-4 py-2 rounded-lg"
              >
                Create API Key
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * New API Key Display Modal (shown once after creation)
 */
interface NewApiKeyModalProps {
  apiKey: string;
  onClose: () => void;
}

function NewApiKeyModal({ apiKey, onClose }: NewApiKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900">
              API Key Created Successfully
            </h3>
            <p className="text-sm text-wise-gray-600">
              Copy this key now - it won't be shown again
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Store this API key securely. For security reasons, you
              won't be able to view it again after closing this dialog.
            </p>
          </div>
        </div>

        <div className="bg-wise-gray-50 rounded-lg p-4 space-y-3">
          <code className="text-sm font-mono text-wise-gray-900 break-all block">
            {apiKey}
          </code>
          <button
            onClick={handleCopy}
            className="btn-wise-primary w-full py-2 rounded-lg inline-flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy API Key</span>
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-wise-secondary px-4 py-2 rounded-lg"
            disabled={!copied}
          >
            {copied ? "Close" : "I've Copied the Key"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Modal
 */
interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900">Delete API Key</h3>
            <p className="text-sm text-wise-gray-600">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-wise-gray-700">
          Are you sure you want to delete this API key? Any applications using this key will
          immediately lose access.
        </p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-wise-secondary px-4 py-2 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Delete Key
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function ApiKeysPageSkeleton() {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-wise-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-wise-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-wise-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-wise p-4">
            <div className="h-4 w-24 bg-wise-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-wise-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {[...Array(3)].map((_, i) => (
        <div key={i} className="card-wise p-6">
          <div className="space-y-3">
            <div className="h-6 w-64 bg-wise-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-wise-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-wise-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}
