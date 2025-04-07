import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import api from "../services/api";

const DayComments = ({ dayId, itineraryId }) => {
  const { token, user } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const commentsEndRef = useRef(null);
  const [error, setError] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [itineraryDetails, setItineraryDetails] = useState(null);

  // First, get itinerary details to check access rights
  useEffect(() => {
    if (itineraryId && itineraryId !== "undefined") {
      checkItineraryAccess();
    } else if (dayId && dayId !== "undefined") {
      // If no itineraryId is provided, we'll need to fetch it first
      getDayDetails();
    } else {
      setError("Invalid day or itinerary ID provided");
      setIsLoading(false);
    }
  }, [itineraryId, dayId]);

  // Get day details to find parent itinerary
  const getDayDetails = async () => {
    try {
      // Skip the API call if the dayId is invalid
      if (!dayId || dayId === "undefined") {
        setError("Missing or invalid day ID");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log("Fetching day details to get parent itinerary:", dayId);

      const response = await api.get(`/itineraries/days/${dayId}`);

      if (response.data && response.data.status === "success") {
        const day = response.data.data.day;
        // Now that we have the itinerary ID, check access
        console.log("Found parent itinerary:", day.itinerary);
        checkItineraryAccess(day.itinerary);
      }
    } catch (error) {
      console.error("Error fetching day details:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to view this day's comments");
      } else {
        setError("Failed to load day information");
      }
      setIsLoading(false);
    }
  };

  // Check if user has permission to access this itinerary
  const checkItineraryAccess = async (id = itineraryId) => {
    try {
      // Skip the API call if the ID is undefined or invalid
      if (!id || id === "undefined") {
        setError("Missing or invalid itinerary ID");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log("Checking access to itinerary:", id);

      const response = await api.get(`/itineraries/${id}`);

      if (response.data && response.data.status === "success") {
        const itinerary = response.data.data.itinerary;
        setItineraryDetails(itinerary);

        // Check if current user is owner or collaborator
        // Make sure we're comparing string to string or ObjectId to ObjectId
        const isOwner = itinerary.owner.id === user?.id;
        const isCollaborator = itinerary.collaborators?.some(
          (c) => c.user.id === user?.id
        );

        console.log("User is owner:", isOwner);
        console.log("User is collaborator:", isCollaborator);
        console.log("Owner ID:", itinerary.owner.id);
        console.log("User ID:", user?.id);

        if (isOwner || isCollaborator) {
          console.log("User has access to itinerary, connecting to comments");
          // Now initialize socket and fetch comments
          initializeSocket();

          // Wait a moment for socket and permissions to sync
          setTimeout(() => {
            fetchComments();
          }, 500);
        } else {
          setError(
            "You don't have permission to view comments for this itinerary"
          );
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error checking itinerary access:", error);
      setError("Failed to verify access to this itinerary");
      setIsLoading(false);
    }
  };

  // Initialize socket connection
  const initializeSocket = () => {
    // If there's already a connected socket, disconnect it first
    if (socket) {
      console.log("Disconnecting existing socket before reconnecting");
      socket.disconnect();
    }

    // Get token directly from localStorage to ensure it's the most current
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      setError("Authentication required to view comments");
      return;
    }

    const socketInstance = io(`${import.meta.env.NODE_API_URL}`, {
      auth: { token: authToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      // Join day room
      socketInstance.emit("join-day", dayId);
      console.log("Joined day room:", dayId);
      // Clear any socket-related errors
      if (error && error.includes("Socket")) {
        setError(null);
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setError(`Socket connection error: ${err.message}`);
      // We've checked permissions, so proceed with traditional REST API for comments
      fetchComments();
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, reconnect manually
        setTimeout(() => {
          console.log("Attempting to reconnect socket...");
          socketInstance.connect();
        }, 1000);
      }
    });

    socketInstance.on("new-comment", (data) => {
      if (data.dayId === dayId) {
        setComments((prev) => [...prev, data.comment]);
      }
    });

    socketInstance.on("comment-deleted", (data) => {
      if (data.dayId === dayId) {
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
      }
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Socket error: " + error.message);
    });

    setSocket(socketInstance);
  };

  // Cleanup socket on unmount
  useEffect(() => {
    // Return cleanup function
    return () => {
      if (socket) {
        console.log("Unmounting component, disconnecting socket");
        socket.disconnect();
      }
    };
  }, [socket]);

  // Scroll to bottom when comments change
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);

      // We've already verified access through itinerary check
      console.log("Fetching comments for day:", dayId);

      // Add a small delay to ensure server-side permissions are fully processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await api.get(`/comments/days/${dayId}`);

      console.log("Comments response:", response.data);

      if (response.data && response.data.status === "success") {
        setComments(response.data.data.comments || []);
        setError(null); // Clear any previous errors on success
      } else {
        setError("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);

      // Handle specific errors
      if (error.response) {
        console.log("Error response status:", error.response.status);
        console.log("Error response data:", error.response.data);

        if (error.response.status === 403) {
          // This is likely a timing issue with permission propagation
          setError(
            `Access denied: ${
              error.response.data.message ||
              "You need permission to view these comments"
            }`
          );

          // If we already have itinerary details but still get 403, there might be a backend permissions issue
          if (itineraryDetails) {
            const isOwner = itineraryDetails?.owner?.id === user?.id;
            const isCollaborator = itineraryDetails?.collaborators?.some(
              (c) => c.user.id === user?.id
            );

            if (isOwner || isCollaborator) {
              console.log("User should have access, retrying in 2 seconds...");
              // Try again in 2 seconds
              setTimeout(() => {
                console.log("Retrying comment fetch");
                fetchComments();
              }, 2000);
            }
          }
        } else if (error.response.status === 401) {
          setError("Please login to view comments");
        } else if (error.response.status === 404) {
          setComments([]);
        } else {
          setError(
            `Failed to fetch comments: ${
              error.response.data?.message || "Server error"
            }`
          );
        }
      } else {
        setError("Failed to connect to the server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error("Comment text is required");
      return;
    }

    try {
      setIsLoading(true);

      // Using socket to add comment
      if (socket && socket.connected) {
        console.log("Adding comment via socket");
        socket.emit("add-comment", {
          dayId,
          text: newComment,
        });

        // Clear input field
        setNewComment("");
      } else {
        // Fallback to REST API if socket is not available
        console.log("Adding comment via REST API");

        const response = await api.post(`/comments/days/${dayId}`, {
          text: newComment,
        });

        if (response.data.status === "success") {
          setComments((prev) => [...prev, response.data.data.comment]);
          setNewComment("");
          toast.success("Comment added successfully");
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);

      if (error.response?.status === 403) {
        toast.error("You don't have permission to add comments");
      } else {
        toast.error(
          "Failed to add comment: " +
            (error.response?.data?.message || error.message)
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setIsLoading(true);

      console.log("Deleting comment:", commentId);

      const response = await api.delete(
        `/comments/days/${dayId}/comments/${commentId}`
      );

      if (response.data.status === "success") {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);

      if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this comment");
      } else {
        toast.error("Failed to delete comment");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Comments</h2>

        <button
          onClick={() => {
            if (itineraryId && itineraryId !== "undefined") {
              checkItineraryAccess();
            } else if (dayId && dayId !== "undefined") {
              getDayDetails();
            } else {
              setError("Invalid day or itinerary ID provided");
            }
          }}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
          title="Refresh comments"
          disabled={isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoading && <span className="ml-1">Loading...</span>}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex flex-col">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <div className="flex">
              {error.includes("Access denied") && (
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-gray-500 hover:text-gray-700 ml-2"
                  title="Show debug info"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  if (itineraryId && itineraryId !== "undefined") {
                    checkItineraryAccess();
                  } else if (dayId && dayId !== "undefined") {
                    getDayDetails();
                  } else {
                    setError("Invalid day or itinerary ID provided");
                  }
                }}
                className="text-red-700 hover:text-red-900 ml-2"
                title="Try again"
              >
                Try again
              </button>
            </div>
          </div>

          {showDebugInfo && (
            <div className="mt-3 p-3 bg-gray-100 rounded text-gray-700 text-sm">
              <h4 className="font-bold mb-2">Debug Information</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Day ID: {dayId}</li>
                <li>Itinerary ID: {itineraryDetails?._id || "Not loaded"}</li>
                <li>User ID: {user?.id || "Not available"}</li>
                <li>Owner ID: {itineraryDetails?.owner?.id || "Unknown"}</li>
                <li>
                  Is owner:{" "}
                  {user?.id &&
                  itineraryDetails?.owner?.id &&
                  user.id === itineraryDetails.owner.id
                    ? "Yes"
                    : "No"}
                </li>
                <li>
                  Is collaborator:{" "}
                  {user?.id &&
                  itineraryDetails?.collaborators?.some(
                    (c) => c.user.id === user.id
                  )
                    ? "Yes"
                    : "No"}
                </li>
                <li>Socket connected: {socket?.connected ? "Yes" : "No"}</li>
              </ul>
              <p className="mt-2 text-xs">
                The current user must be an owner or collaborator on this
                itinerary to view comments.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-96 overflow-y-auto">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-2 text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-3 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-indigo-700">
                      {comment.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(comment.createdAt)}
                    </div>
                  </div>
                  {comment.user.id === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete comment"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2">{comment.text}</p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleAddComment} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          disabled={isLoading}
        >
          {isLoading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default DayComments;
