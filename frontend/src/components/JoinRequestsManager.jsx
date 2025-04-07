import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaUserClock, FaBell } from 'react-icons/fa';
import api from '../services/api';

const JoinRequestsManager = ({ itineraryId, isOwner, showNotification = false }) => {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(false);
  const [publiclyJoinable, setPubliclyJoinable] = useState(false);
  
  // Only fetch for owners
  useEffect(() => {
    if (isOwner) {
      fetchJoinRequests();
    }
  }, [itineraryId, isOwner]);

  // Auto-expand if there are pending requests and showNotification is true
  useEffect(() => {
    const pendingCount = joinRequests.filter(req => req.status === 'pending').length;
    if (showNotification && pendingCount > 0) {
      setExpandedSection(true);
    }
  }, [joinRequests, showNotification]);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/itineraries/${itineraryId}/join-requests`
      );

      if (response.data.success) {
        setJoinRequests(response.data.data.joinRequests || []);
        setPubliclyJoinable(response.data.data.publiclyJoinable || false);
      }
    } catch (err) {
      console.error('Error fetching join requests:', err);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requesterId, action) => {
    try {
      const response = await api.patch(
        `/itineraries/${itineraryId}/join-request/${requesterId}`,
        { action }
      );

      if (response.data.success) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        // Remove the processed request from the list
        setJoinRequests(joinRequests.filter(req => req.user._id !== requesterId));
      }
    } catch (err) {
      console.error(`Error ${action}ing join request:`, err);
      toast.error(`Failed to ${action} join request`);
    }
  };

  const togglePublicJoinSetting = async () => {
    try {
      const response = await api.patch(
        `/itineraries/${itineraryId}/joinable`,
        { publiclyJoinable: !publiclyJoinable }
      );

      if (response.data.success) {
        setPubliclyJoinable(!publiclyJoinable);
        toast.success(`Itinerary is now ${!publiclyJoinable ? 'open' : 'closed'} for join requests`);
      }
    } catch (err) {
      console.error('Error toggling public join setting:', err);
      toast.error(err.response?.data?.message || 'Failed to update join setting');
    }
  };

  // If not owner, don't show anything
  if (!isOwner) return null;

  // Count pending requests
  const pendingRequestsCount = joinRequests.filter(req => req.status === 'pending').length;

  return (
    <div className={`mt-6 border border-gray-200 rounded-lg p-4 ${pendingRequestsCount > 0 ? 'border-orange-300 bg-orange-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 
          className="text-lg font-semibold flex items-center cursor-pointer" 
          onClick={() => setExpandedSection(!expandedSection)}
        >
          <FaUserClock className="mr-2 text-indigo-600" />
          Join Requests
          {pendingRequestsCount > 0 && (
            <span className="ml-2 flex items-center text-orange-500">
              <FaBell className="animate-pulse mr-1" />
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {pendingRequestsCount}
              </span>
            </span>
          )}
        </h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm">Allow Join Requests:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={publiclyJoinable}
              onChange={togglePublicJoinSetting}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {expandedSection && (
        <>
          {loading ? (
            <p className="text-center py-4 text-gray-500">Loading requests...</p>
          ) : joinRequests.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No pending join requests</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {joinRequests.map((request) => (
                    <tr key={request._id} className={request.status === 'pending' ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.user.username || request.user.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(request.requestDate || request.requestedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleProcessRequest(request.user._id, 'approve')}
                              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleProcessRequest(request.user._id, 'reject')}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                              title="Reject"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JoinRequestsManager; 