import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { invitationApi, Invitation } from '../services/invitationApi';

interface InvitationPageProps {
  token: string;
}

export const InvitationPage: React.FC<InvitationPageProps> = ({ token }) => {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const response = await invitationApi.getInvitation(token);
      
      if (response.success && response.data) {
        setInvitation(response.data);
      } else {
        setError(response.error?.message || 'Failed to load invitation');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await invitationApi.acceptInvitation(token);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          // Redirect to the note
          window.location.href = `/notes/${invitation?.noteId}`;
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      
      const response = await invitationApi.declineInvitation(token);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to decline invitation');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access - view, edit, invite users, and manage the note';
      case 'editor':
        return 'Edit access - view and edit the note';
      case 'viewer':
        return 'Read-only access - view the note';
      default:
        return 'Limited access';
    }
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.66 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Invalid Invitation</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error || 'This invitation is invalid or has expired.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Success!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your invitation has been processed successfully.
            </p>
            <p className="mt-2 text-xs text-gray-400">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Invitation Expired</h3>
            <p className="mt-1 text-sm text-gray-500">
              This invitation expired on {formatDate(invitation.expiresAt)}.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please ask {invitation.invitedBy.name} to send you a new invitation.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Note Invitation</h2>
            <p className="text-sm text-gray-500">
              You've been invited to collaborate on a note
            </p>
          </div>

          {/* Invitation Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Note Details</h3>
              <p className="text-lg font-medium text-gray-900">{invitation.note.title}</p>
              <p className="text-sm text-gray-500">
                by {invitation.note.author.name} ({invitation.note.author.email})
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Your Role</h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {invitation.role}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {getRoleDescription(invitation.role)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Invitation Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>From: {invitation.invitedBy.name} ({invitation.invitedBy.email})</p>
                <p>Invited: {formatDate(invitation.createdAt)}</p>
                <p>Expires: {formatDate(invitation.expiresAt)}</p>
              </div>
            </div>
          </div>

          {/* Authentication Check */}
          {!isAuthenticated ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Login Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You need to be logged in to accept this invitation.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200"
                    >
                      Go to Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : user?.email === invitation.invitedEmail ? null : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Email Mismatch</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>This invitation was sent to {invitation.invitedEmail}, but you're logged in as {user?.email}.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isAuthenticated && user?.email === invitation.invitedEmail && (
            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Accept Invitation'
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};