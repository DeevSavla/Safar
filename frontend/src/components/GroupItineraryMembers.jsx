import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addCollaborator, removeCollaborator, fetchItineraryById } from '../store/slices/itinerarySlice';
import { FaCheckCircle, FaTimesCircle, FaUserClock } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

function GroupItineraryMembers({ itinerary, isOwner }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [publiclyJoinable, setPubliclyJoinable] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  // Get itinerary ID (handle different API formats)
  const itineraryId = itinerary?.id || itinerary?._id || itinerary?.uuid;
  
  // Check if the itinerary has owner data for display
  const hasOwnerData = itinerary && itinerary.owner && 
    (itinerary.owner.name || itinerary.owner.email);
    
  // For the owner display
  const ownerName = hasOwnerData ? (itinerary.owner.name || itinerary.owner.email) : 'Owner';
  const ownerEmail = hasOwnerData ? itinerary.owner.email : '';
  
  // Fetch join requests when component mounts for owner
  useEffect(() => {
    if (isOwner && itineraryId) {
      fetchJoinRequests();
    }
  }, [isOwner, itineraryId]);

  // Function to fetch join requests
  const fetchJoinRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await api.get(`/itineraries/${itineraryId}/join-requests`);
      
      if (response.data.success) {
        setJoinRequests(response.data.data.joinRequests || []);
        setPubliclyJoinable(response.data.data.publiclyJoinable || false);
      }
    } catch (err) {
      console.error('Error fetching join requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Handle processing a join request
  const handleProcessRequest = async (requesterId, action) => {
    try {
      const response = await api.patch(
        `/itineraries/${itineraryId}/join-request/${requesterId}`,
        { action }
      );

      if (response.data.success) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        // Refresh the join requests
        fetchJoinRequests();
        
        // If approved, refresh the itinerary to update collaborators list
        if (action === 'approve') {
          // Dispatch action to refresh the itinerary
          dispatch(fetchItineraryById(itineraryId)).unwrap()
            .catch(err => {
              console.error('Error refreshing itinerary:', err);
            });
        }
      }
    } catch (err) {
      console.error(`Error ${action}ing join request:`, err);
      toast.error(`Failed to ${action} join request`);
    }
  };
  
  // Handle adding a new collaborator
  const handleAddCollaborator = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError(null);
    setIsAdding(true);
    
    dispatch(addCollaborator({ itineraryId, email, role }))
      .unwrap()
      .then(() => {
        setEmail('');
        setIsAdding(false);
      })
      .catch(err => {
        console.error('Failed to add collaborator:', err);
        setError(typeof err === 'string' ? err : 'Failed to add collaborator. User may not exist.');
        setIsAdding(false);
      });
  };
  
  // Handle removing a collaborator
  const handleRemoveCollaborator = (collaboratorId) => {
    if (window.confirm('Are you sure you want to remove this member from the itinerary?')) {
      dispatch(removeCollaborator({ itineraryId, collaboratorId }))
        .catch(err => {
          console.error('Failed to remove collaborator:', err);
          setError(typeof err === 'string' ? err : 'Failed to remove collaborator');
        });
    }
  };
  
  // Toggle public join setting
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
  
  // Load collaborators from the itinerary
  useEffect(() => {
    if (itinerary) {
      // Make sure collaborators exists and is an array
      const collaboratorsList = itinerary.collaborators || [];
      
      if (Array.isArray(collaboratorsList)) {
        setCollaborators(collaboratorsList.map(collab => {
          // Handle case where user object might be missing
          if (!collab || !collab.user) {
            console.warn('Collaborator or user object is missing', collab);
            return {
              userId: collab?._id || 'unknown',
              name: 'Unknown User',
              email: '',
              role: collab?.role || 'viewer',
              id: collab?._id || collab?.id || 'unknown'
            };
          }
          
          return {
            userId: collab.user._id || collab.user.id || collab.user, // Handle different possible formats
            name: collab.user.name || collab.user.username || 'Unknown',
            email: collab.user.email || '',
            role: collab.role || 'viewer',
            id: collab._id || collab.id // The collaborator record ID
          };
        }));
      } else {
        console.error('Collaborators is not an array:', collaboratorsList);
        setCollaborators([]);
      }
    }
  }, [itinerary]);
  
  // If not the owner, just show the list of collaborators
  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Group Members</h2>
          
          {collaborators.length === 0 ? (
            <p className="text-gray-500">No other members in this itinerary.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {collaborators.map(collaborator => (
                <li key={collaborator.userId} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{collaborator.name}</p>
                    <p className="text-sm text-gray-500">{collaborator.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                      {collaborator.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove member"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
  
  // Count pending requests
  const pendingRequestsCount = joinRequests.filter(req => req.status === 'pending').length;
  
  // For the owner, show the list with add/remove capabilities
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Group Members</h2>
        
        <form onSubmit={handleAddCollaborator} className="mb-6">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Add member by email
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Email address"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isAdding}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isAdding}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-indigo-300"
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Note: Members must have an existing account on this platform to be added.
            </p>
          </div>
        </form>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Current Members</h3>
          
          {/* Show the owner first */}
          {hasOwnerData && (
            <div className="py-3 flex justify-between items-center border-b border-gray-200">
              <div>
                <p className="font-medium">{ownerName}</p>
                <p className="text-sm text-gray-500">{ownerEmail}</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Owner
              </span>
            </div>
          )}
          
          {collaborators.length === 0 ? (
            <p className="text-gray-500 py-3">No other members in this itinerary.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {collaborators.map(collaborator => (
                <li key={collaborator.userId} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{collaborator.name}</p>
                    <p className="text-sm text-gray-500">{collaborator.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                      {collaborator.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove member"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Join Requests Section */}
        <div className="mt-8">
          <div 
            className="flex justify-between items-center"
          >
            <div className="flex items-center">
              <h3 
                className="font-medium text-gray-700 flex items-center cursor-pointer"
                onClick={() => setShowJoinRequests(!showJoinRequests)}
              >
                <FaUserClock className="mr-2 text-indigo-600" />
                Join Requests
                {pendingRequestsCount > 0 && (
                  <span className="ml-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {pendingRequestsCount}
                  </span>
                )}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ml-2 transition-transform ${showJoinRequests ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </h3>
            </div>
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
          
          {showJoinRequests && (
            <div className="mt-3">
              {isLoadingRequests ? (
                <p className="text-center py-4 text-gray-500">Loading requests...</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No join requests to display</p>
              ) : (
                <div className="overflow-x-auto">
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
                                  <FaCheckCircle />
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(request.user._id, 'reject')}
                                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                  title="Reject"
                                >
                                  <FaTimesCircle />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupItineraryMembers; 