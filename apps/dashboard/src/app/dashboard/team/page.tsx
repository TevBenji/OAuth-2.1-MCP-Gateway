'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import {
  Users,
  Plus,
  Mail,
  Shield,
  Trash2,
  Crown,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeamPage() {
  const { user } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'USER' | 'ADMIN'>('USER');
  const [inviting, setInviting] = useState(false);

  const members = useQuery(api.team.getTeamMembers, user?.id ? { clerkId: user.id } : 'skip');
  const inviteMutation = useMutation(api.team.inviteMember);
  const updateRoleMutation = useMutation(api.team.updateMemberRole);
  const removeMutation = useMutation(api.team.removeMember);

  const loading = members === undefined;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !inviteEmail) return;

    try {
      setInviting(true);
      await inviteMutation({
        clerkId: user.id,
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('USER');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: any, newRole: 'USER' | 'ADMIN') => {
    if (!user?.id) return;

    try {
      await updateRoleMutation({
        clerkId: user.id,
        memberId,
        role: newRole,
      });
      toast.success('Member role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: any, memberName: string) => {
    if (!user?.id) return;
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    try {
      await removeMutation({
        clerkId: user.id,
        memberId,
      });
      toast.success('Member removed from team');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Team Members</h1>
          <p className='text-wise-gray-600 mt-1'>
            Manage your team and their access
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0'
        >
          <Plus className='w-4 h-4 mr-2' />
          Invite Member
        </button>
      </div>

      {members && members.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {members.map((member) => (
            <div key={member._id} className='card-wise p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-wise-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-lg font-semibold text-wise-green-primary'>
                      {member.name?.[0] || member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className='font-semibold text-wise-gray-900'>
                      {member.name || member.email}
                    </h3>
                    <p className='text-sm text-wise-gray-600'>{member.email}</p>
                  </div>
                </div>
                {member.isOwner && (
                  <Crown className='w-5 h-5 text-yellow-500' />
                )}
              </div>

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-wise-gray-600'>Role</span>
                  {!member.isOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member._id, e.target.value as 'USER' | 'ADMIN')}
                      className='text-sm px-3 py-1 border border-wise-gray-200 rounded-lg'
                    >
                      <option value='USER'>User</option>
                      <option value='ADMIN'>Admin</option>
                    </select>
                  ) : (
                    <span className='text-sm font-medium text-wise-gray-900'>Owner</span>
                  )}
                </div>

                {!member.isOwner && (
                  <button
                    onClick={() => handleRemoveMember(member._id, member.name || member.email)}
                    className='w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center'
                  >
                    <Trash2 className='w-4 h-4 mr-2' />
                    Remove Member
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title='No team members yet'
          description='Invite team members to collaborate on your projects'
          action={{
            label: 'Invite Member',
            onClick: () => setShowInviteModal(true),
          }}
        />
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title='Invite Team Member'
      >
        <form onSubmit={handleInvite} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Email Address
            </label>
            <input
              type='email'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className='input-wise'
              placeholder='member@example.com'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'USER' | 'ADMIN')}
              className='input-wise'
            >
              <option value='USER'>User</option>
              <option value='ADMIN'>Admin</option>
            </select>
            <p className='text-xs text-wise-gray-500 mt-1'>
              Admins can manage team members and settings
            </p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2'>
            <AlertCircle className='w-5 h-5 text-blue-500 mt-0.5' />
            <p className='text-sm text-blue-700'>
              An invitation email will be sent to this address
            </p>
          </div>

          <div className='flex items-center justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={() => setShowInviteModal(false)}
              className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={inviting}
              className='btn-wise-primary px-6 py-2 flex items-center'
            >
              {inviting ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className='w-4 h-4 mr-2' />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
