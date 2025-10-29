"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Activity,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Project data structure from Convex database
 */
interface Project {
  _id: Id<"projects">;
  _creationTime: number;
  name: string;
  description?: string;
  status: "active" | "paused" | "archived";
  environment: "development" | "staging" | "production";
  apiCallsCount: number;
  lastActivityAt?: number;
  createdBy: string;
  teamId?: Id<"teams">;
}

/**
 * Filter options for project list
 */
interface FilterOptions {
  status: "all" | "active" | "paused" | "archived";
  environment: "all" | "development" | "staging" | "production";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProjectsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    environment: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ============================================================================
  // CONVEX QUERIES & MUTATIONS
  // ============================================================================

  /**
   * Fetch all projects for the current user
   * Real implementation would use: api.projects.listUserProjects
   */
  const projects = useQuery(
    api.projects.listUserProjects,
    isUserLoaded && user ? { userId: user.id } : "skip"
  );

  /**
   * Delete project mutation
   * Real implementation would use: api.projects.deleteProject
   */
  const deleteProject = useMutation(api.projects.deleteProject);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Filter and search projects based on current criteria
   */
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      // Search filter: match name or description
      const matchesSearch =
        searchQuery.trim() === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        filters.status === "all" || project.status === filters.status;

      // Environment filter
      const matchesEnvironment =
        filters.environment === "all" ||
        project.environment === filters.environment;

      return matchesSearch && matchesStatus && matchesEnvironment;
    });
  }, [projects, searchQuery, filters]);

  /**
   * Calculate project statistics for display
   */
  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, paused: 0, archived: 0 };

    return {
      total: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      paused: projects.filter((p) => p.status === "paused").length,
      archived: projects.filter((p) => p.status === "archived").length,
    };
  }, [projects]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle project deletion with confirmation
   */
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject({ projectId: selectedProject });
      setShowDeleteConfirm(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  /**
   * Reset all filters to default state
   */
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      environment: "all",
    });
    setSearchQuery("");
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!isUserLoaded || projects === undefined) {
    return (
      <div className="p-6 space-y-6">
        <ProjectsPageSkeleton />
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
          <h1 className="text-3xl font-bold text-wise-gray-900">Projects</h1>
          <p className="text-wise-gray-600 mt-1">
            Manage your OAuth 2.1 projects and API integrations
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="btn-wise-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg"
          aria-label="Create new project"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats.total} icon={Activity} />
        <StatCard
          label="Active"
          value={stats.active}
          icon={Activity}
          color="green"
        />
        <StatCard
          label="Paused"
          value={stats.paused}
          icon={Activity}
          color="yellow"
        />
        <StatCard
          label="Archived"
          value={stats.archived}
          icon={Activity}
          color="gray"
        />
      </div>

      {/* Search and Filters */}
      <div className="card-wise p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wise-gray-400" />
            <input
              type="text"
              placeholder="Search projects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary focus:border-transparent"
              aria-label="Search projects"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-wise-secondary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable Filter Section */}
        {showFilters && (
          <div className="pt-4 border-t border-wise-gray-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-wise-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status: e.target.value as FilterOptions["status"],
                    })
                  }
                  className="w-full px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Environment Filter */}
              <div>
                <label
                  htmlFor="environment-filter"
                  className="block text-sm font-medium text-wise-gray-700 mb-1"
                >
                  Environment
                </label>
                <select
                  id="environment-filter"
                  value={filters.environment}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      environment: e.target
                        .value as FilterOptions["environment"],
                    })
                  }
                  className="w-full px-3 py-2 border border-wise-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wise-green-primary"
                >
                  <option value="all">All Environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-sm text-wise-green-primary hover:text-wise-green-primary/80 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          hasFilters={
            searchQuery !== "" ||
            filters.status !== "all" ||
            filters.environment !== "all"
          }
          onReset={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onDelete={(id) => {
                setSelectedProject(id);
                setShowDeleteConfirm(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onConfirm={handleDeleteProject}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedProject(null);
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
 * Stat card component for displaying project statistics
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "yellow" | "gray";
}

function StatCard({ label, value, icon: Icon, color = "green" }: StatCardProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    gray: "bg-wise-gray-100 text-wise-gray-600",
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
 * Individual project card component
 */
interface ProjectCardProps {
  project: Project;
  onDelete: (id: Id<"projects">) => void;
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Status badge styling
  const statusStyles = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    archived: "bg-wise-gray-100 text-wise-gray-700",
  };

  // Environment badge styling
  const envStyles = {
    development: "bg-blue-100 text-blue-700",
    staging: "bg-purple-100 text-purple-700",
    production: "bg-red-100 text-red-700",
  };

  // Format last activity timestamp
  const lastActivity = project.lastActivityAt
    ? new Date(project.lastActivityAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No activity";

  return (
    <div className="card-wise p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Project Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-wise-gray-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-wise-gray-600 mt-1">{project.description}</p>
              )}
            </div>

            {/* Status & Environment Badges */}
            <div className="flex gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  statusStyles[project.status]
                }`}
              >
                {project.status}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  envStyles[project.environment]
                }`}
              >
                {project.environment}
              </span>
            </div>
          </div>

          {/* Project Metrics */}
          <div className="flex flex-wrap gap-4 text-sm text-wise-gray-600">
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              <span>{project.apiCallsCount.toLocaleString()} API calls</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Last active: {lastActivity}</span>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-wise-gray-100 rounded-lg transition-colors"
            aria-label="Project actions"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-5 h-5 text-wise-gray-600" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-wise-gray-200 py-1 z-20">
                <Link
                  href={`/dashboard/projects/${project._id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-wise-gray-700 hover:bg-wise-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
                <Link
                  href={`/dashboard/projects/${project._id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-wise-gray-700 hover:bg-wise-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Project</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(project._id);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Project</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component shown when no projects match filters
 */
interface EmptyStateProps {
  hasFilters: boolean;
  onReset: () => void;
}

function EmptyState({ hasFilters, onReset }: EmptyStateProps) {
  return (
    <div className="card-wise p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-wise-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 text-wise-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-wise-gray-900">
          {hasFilters ? "No projects found" : "No projects yet"}
        </h3>
        <p className="text-wise-gray-600">
          {hasFilters
            ? "Try adjusting your search or filter criteria to find what you're looking for."
            : "Get started by creating your first OAuth 2.1 project to manage API integrations."}
        </p>
        <div className="flex gap-3 justify-center">
          {hasFilters ? (
            <button
              onClick={onReset}
              className="btn-wise-secondary px-4 py-2 rounded-lg"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/dashboard/projects/new"
              className="btn-wise-primary px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Project</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Delete confirmation modal component
 */
interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900">
              Delete Project
            </h3>
            <p className="text-sm text-wise-gray-600">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-wise-gray-700">
          Are you sure you want to delete this project? All associated API keys,
          configurations, and data will be permanently removed.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn-wise-secondary px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for projects page
 */
function ProjectsPageSkeleton() {
  return (
    <>
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-wise-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-wise-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-wise-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-wise p-4">
            <div className="h-4 w-24 bg-wise-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-wise-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Search Skeleton */}
      <div className="card-wise p-4">
        <div className="h-10 w-full bg-wise-gray-200 rounded animate-pulse" />
      </div>

      {/* Project Cards Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card-wise p-6">
          <div className="space-y-3">
            <div className="h-6 w-64 bg-wise-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-wise-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-wise-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}
