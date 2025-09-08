import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useSocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoaded } = useUser();

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
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/socialfeed/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (data.done) {
        await fetchPosts();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };

  const toggleLike = async (postId) => {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/socialfeed/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.done) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === data.data._id ? data.data : post
          )
        );
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to toggle like');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  };

  const addComment = async (postId, content) => {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/socialfeed/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (data.done) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === data.data._id ? data.data : post
          )
        );
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const getCurrentUserProfile = () => {
    if (isLoaded && user) {
      return {
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        username: `@${user.username || user.firstName?.toLowerCase() || 'user'}`,
        avatar: user.imageUrl || 'assets/img/users/user-11.jpg',
        followers: 1250,
        following: 180,
        posts: posts.filter(post => post.userId === user.id).length
      };
    }

    return {
      name: 'Loading...',
      username: '@user',
      avatar: 'assets/img/users/user-11.jpg',
      followers: 0,
      following: 0,
      posts: 0
    };
  };

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
