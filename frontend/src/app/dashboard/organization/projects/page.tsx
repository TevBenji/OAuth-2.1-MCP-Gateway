'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Key,
  Globe,
  MoreVertical,
  X,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys: any[];
  oauthConfigs: any[];
}

export default function ProjectsPage() {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  // Convex queries and mutations
  const projects = useQuery(api.projects.list, user?.id ? { clerkId: user.id } : 'skip');
  const createProjectMutation = useMutation(api.projects.create);
  const updateProjectMutation = useMutation(api.projects.update);
  const deleteProjectMutation = useMutation(api.projects.remove);

  const loading = projects === undefined;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      await createProjectMutation({
        clerkId: user.id,
        name: formData.name,
        description: formData.description,
      });
      toast.success('Project created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setSaving(true);
      await updateProjectMutation({
        projectId: selectedProject.id as any,
        name: formData.name,
        description: formData.description,
      });
      toast.success('Project updated successfully');
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      setSaving(true);
      await deleteProjectMutation({ projectId: selectedProject.id as any });
      toast.success('Project deleted successfully');
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Projects</h1>
          <p className='text-wise-gray-600 mt-1'>
            Manage your OAuth 2.1 MCP Gateway projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0'
        >
          <Plus className='w-4 h-4 mr-2' />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {projects.map((project) => (
            <div key={project.id} className='card-wise p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-wise-green-50 rounded-lg flex items-center justify-center'>
                    <FolderOpen className='w-5 h-5 text-wise-green-primary' />
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => openEditModal(project)}
                    className='p-1.5 rounded hover:bg-wise-gray-50'
                  >
                    <Edit className='w-4 h-4 text-wise-gray-500' />
                  </button>
                  <button
                    onClick={() => openDeleteModal(project)}
                    className='p-1.5 rounded hover:bg-red-50'
                  >
                    <Trash2 className='w-4 h-4 text-red-500' />
                  </button>
                </div>
              </div>

              <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>{project.name}</h3>
              <p className='text-sm text-wise-gray-600 mb-4 line-clamp-2'>
                {project.description || 'No description provided'}
              </p>

              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-wise-gray-200'>
                <div>
                  <div className='flex items-center text-wise-gray-500'>
                    <Key className='w-4 h-4 mr-1' />
                    <span className='text-xs'>API Keys</span>
                  </div>
                  <p className='text-lg font-semibold text-wise-gray-900 mt-1'>
                    {project.apiKeys?.length || 0}
                  </p>
                </div>
                <div>
                  <div className='flex items-center text-wise-gray-500'>
                    <Globe className='w-4 h-4 mr-1' />
                    <span className='text-xs'>OAuth</span>
                  </div>
                  <p className='text-lg font-semibold text-wise-gray-900 mt-1'>
                    {project.oauthConfigs?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='card-wise p-12 text-center'>
          <FolderOpen className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>No projects yet</h3>
          <p className='text-wise-gray-600 mb-6'>
            Create your first project to start managing OAuth configurations and API keys
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className='btn-wise-primary px-6 py-2 mx-auto'
          >
            <Plus className='w-4 h-4 mr-2' />
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-lg w-full p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-wise-gray-900'>Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className='p-1 rounded hover:bg-wise-gray-100'
              >
                <X className='w-5 h-5 text-wise-gray-500' />
              </button>
            </div>

            <form onSubmit={handleCreate} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Project Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='input-wise'
                  placeholder='Enter project name'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='input-wise min-h-[100px] resize-y'
                  placeholder='Enter project description'
                />
              </div>

              <div className='flex items-center justify-end space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowCreateModal(false)}
                  className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={saving}
                  className='btn-wise-primary px-6 py-2 flex items-center'
                >
                  {saving ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProject && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-lg w-full p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-semibold text-wise-gray-900'>Edit Project</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className='p-1 rounded hover:bg-wise-gray-100'
              >
                <X className='w-5 h-5 text-wise-gray-500' />
              </button>
            </div>

            <form onSubmit={handleEdit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Project Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='input-wise'
                  placeholder='Enter project name'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='input-wise min-h-[100px] resize-y'
                  placeholder='Enter project description'
                />
              </div>

              <div className='flex items-center justify-end space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={saving}
                  className='btn-wise-primary px-6 py-2 flex items-center'
                >
                  {saving ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <div className='flex items-center mb-4'>
              <AlertCircle className='w-6 h-6 text-red-500 mr-3' />
              <h2 className='text-xl font-semibold text-wise-gray-900'>Delete Project</h2>
            </div>

            <p className='text-wise-gray-600 mb-6'>
              Are you sure you want to delete <strong>{selectedProject.name}</strong>? This action
              cannot be undone and will delete all associated API keys and OAuth configurations.
            </p>

            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className='px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center'
              >
                {saving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className='w-4 h-4 mr-2' />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
