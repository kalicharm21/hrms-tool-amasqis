import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSocket } from '../SocketContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoaded } = useUser();
  const socket = useSocket();

  const getAuthToken = () => {
    if (typeof window !== 'undefined' && window.Clerk) {
      return window.Clerk.session?.getToken();
    }
    return null;
  };

  const fetchPosts = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/socialfeed/posts?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.done) {
        setPosts(data.data || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData) => {
    return new Promise((resolve, reject) => {

      if (!socket) {
        console.error('Socket not connected for createPost');
        reject(new Error('Socket not connected'));
        return;
      }

      if (!socket.connected) {
        console.error('Socket not connected to server');
        reject(new Error('Socket not connected to server'));
        return;
      }

      const timeout = setTimeout(() => {
        socket.off('socialfeed:create-post-response', handleResponse);
        reject(new Error('Create post timeout - no response from server'));
      }, 15000);

      const handleResponse = (response) => {
        clearTimeout(timeout);
        socket.off('socialfeed:create-post-response', handleResponse);
        if (response.done) {
          console.log('Post created successfully via socket');
          resolve(response.data);
        } else {
          console.error('Failed to create post via socket:', response.error);
          reject(new Error(response.error || 'Failed to create post'));
        }
      };

      socket.on('socialfeed:create-post-response', handleResponse);
      socket.emit('socialfeed:create-post', postData);

      setTimeout(() => {
        socket.off('socialfeed:create-post-response', handleResponse);
        reject(new Error('Create post timeout'));
      }, 10000);
    });
  };

  const toggleLike = async (postId) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        console.error('Socket not connected for toggleLike');
        reject(new Error('Socket not connected'));
        return;
      }

      if (!socket.connected) {
        console.error('Socket not connected to server');
        reject(new Error('Socket not connected to server'));
        return;
      }

      const handleResponse = (response) => {
        socket.off('socialfeed:toggle-like-response', handleResponse);
        if (response.done) {
          console.log('Like toggled successfully via socket');
          resolve(response.data);
        } else {
          console.error('Failed to toggle like via socket:', response.error);
          reject(new Error(response.error || 'Failed to toggle like'));
        }
      };

      socket.on('socialfeed:toggle-like-response', handleResponse);
      socket.emit('socialfeed:toggle-like', { postId });

      setTimeout(() => {
        socket.off('socialfeed:toggle-like-response', handleResponse);
        reject(new Error('Toggle like timeout'));
      }, 10000);
    });
  };

  const addComment = async (postId, content) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        console.error('Socket not connected for addComment');
        reject(new Error('Socket not connected'));
        return;
      }

      if (!socket.connected) {
        console.error('Socket not connected to server');
        reject(new Error('Socket not connected to server'));
        return;
      }

      const handleResponse = (response) => {
        socket.off('socialfeed:add-comment-response', handleResponse);
        if (response.done) {
          console.log('Comment added successfully via socket');
          resolve(response.data);
        } else {
          console.error('Failed to add comment via socket:', response.error);
          reject(new Error(response.error || 'Failed to add comment'));
        }
      };

      socket.on('socialfeed:add-comment-response', handleResponse);
      socket.emit('socialfeed:add-comment', { postId, content });

      setTimeout(() => {
        socket.off('socialfeed:add-comment-response', handleResponse);
        reject(new Error('Add comment timeout'));
      }, 10000);
    });
  };

  const getCurrentUserProfile = () => {
    if (isLoaded && user) {
      return {
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        username: `@${user.username || user.firstName?.toLowerCase() || 'user'}`,
        avatar: user.imageUrl || 'assets/img/users/user-11.jpg',
        avatarIsExternal: !!user.imageUrl,
        followers: 1250,
        following: 180,
        posts: posts.filter(post => post.userId === user.id).length
      };
    }

    return {
      name: 'Loading...',
      username: '@user',
      avatar: 'assets/img/users/user-11.jpg',
      avatarIsExternal: false,
      followers: 0,
      following: 0,
      posts: 0
    };
  };

  useEffect(() => {
    if (socket) {
      const handleNewPost = (data) => {
        console.log('New post received via socket:', data);
        if (data.done && data.data) {
          setPosts(prevPosts => [data.data, ...prevPosts]);
        }
      };

      const handlePostUpdate = (data) => {
        console.log('Post update received via socket:', data);
        if (data.done && data.data) {
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post._id === data.data._id ? data.data : post
            )
          );
        }
      };

      const handlePostDeleted = (data) => {
        console.log('Post deleted via socket:', data);
        if (data.done && data.data?.postId) {
          setPosts(prevPosts =>
            prevPosts.filter(post => post._id !== data.data.postId)
          );
        }
      };

      const handleSocialFeedError = (error) => {
        console.error('Social feed error:', error);
        setError(error.error || 'Social feed error occurred');
      };

      socket.on('socialfeed:newPost', handleNewPost);
      socket.on('socialfeed:postUpdate', handlePostUpdate);
      socket.on('socialfeed:postDeleted', handlePostDeleted);
      socket.on('socialfeed:error', handleSocialFeedError);

      return () => {
        socket.off('socialfeed:newPost', handleNewPost);
        socket.off('socialfeed:postUpdate', handlePostUpdate);
        socket.off('socialfeed:postDeleted', handlePostDeleted);
        socket.off('socialfeed:error', handleSocialFeedError);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (isLoaded) {
      fetchPosts();
    }
  }, [isLoaded]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    toggleLike,
    addComment,
    getCurrentUserProfile
  };
};
