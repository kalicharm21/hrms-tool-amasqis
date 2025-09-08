import { SocialFeedService } from '../../services/socialfeed/socialFeed.services.js';
import { clerkClient, verifyToken } from '@clerk/express';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        done: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);
    const verifiedToken = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(',') || []
    });

    if (!verifiedToken) {
      return res.status(401).json({
        done: false,
        error: 'Invalid token'
      });
    }

    const user = await clerkClient.users.getUser(verifiedToken.sub);

    if (!user) {
      return res.status(401).json({
        done: false,
        error: 'User not found'
      });
    }

    const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV !== "production";

    let userMetadata = { ...user.publicMetadata };
    if (isDevelopment && !userMetadata.companyId) {
      userMetadata.companyId = "dev_company_123";
      console.log(`[Development] Setting default companyId for user ${user.id}`);
    }

    req.user = {
      sub: user.id,
      publicMetadata: userMetadata
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      done: false,
      error: 'Authentication failed'
    });
  }
};

export const socialFeedController = {
  getAllPosts: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { page = 1, limit = 20 } = req.query;

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.getAllPosts(companyId, parseInt(page), parseInt(limit));

      res.json({
        done: true,
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching social feed posts:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to fetch social feed posts'
      });
    }
  },

  getPostsByUser: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        return res.status(400).json({
          done: false,
          error: 'User ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.getPostsByUser(companyId, userId, parseInt(page), parseInt(limit));

      res.json({
        done: true,
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to fetch user posts'
      });
    }
  },

  createPost: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { companyId } = req.user.publicMetadata || {};
      const { content, images, tags, location, isPublic = true } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          done: false,
          error: 'Post content is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const postData = {
        userId,
        companyId,
        content: content.trim(),
        images: images || [],
        tags: tags || [],
        location: location || null,
        isPublic
      };

      const newPost = await SocialFeedService.createPost(companyId, postData);

      res.status(201).json({
        done: true,
        data: newPost,
        message: 'Post created successfully'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to create post'
      });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId } = req.params;
      const userId = req.user.sub;
      const { content, images, tags, location, isPublic } = req.body;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          done: false,
          error: 'Post content is required'
        });
      }

      const updateData = {
        content: content.trim(),
        images: images || [],
        tags: tags || [],
        location: location || null,
        isPublic,
        updatedAt: new Date()
      };

      const updatedPost = await SocialFeedService.updatePost(companyId, postId, userId, updateData);

      res.json({
        done: true,
        data: updatedPost,
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to update post'
      });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId } = req.params;
      const userId = req.user.sub;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.deletePost(companyId, postId, userId);

      res.json({
        done: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to delete post'
      });
    }
  },

  toggleLike: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId } = req.params;
      const userId = req.user.sub;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const updatedPost = await SocialFeedService.toggleLike(companyId, postId, userId);

      res.json({
        done: true,
        data: updatedPost,
        message: 'Like updated successfully'
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to toggle like'
      });
    }
  },

  addComment: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId } = req.params;
      const userId = req.user.sub;
      const { content } = req.body;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          done: false,
          error: 'Comment content is required'
        });
      }

      const updatedPost = await SocialFeedService.addComment(companyId, postId, userId, content.trim());

      res.json({
        done: true,
        data: updatedPost,
        message: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to add comment'
      });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId, commentId } = req.params;
      const userId = req.user.sub;

      if (!postId || !commentId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID and Comment ID are required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.deleteComment(companyId, postId, commentId, userId);

      res.json({
        done: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to delete comment'
      });
    }
  },

  toggleBookmark: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId } = req.params;
      const userId = req.user.sub;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.toggleBookmark(companyId, postId, userId);

      res.json({
        done: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to toggle bookmark'
      });
    }
  },

  getTrendingHashtags: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { limit = 10 } = req.query;

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const hashtags = await SocialFeedService.getTrendingHashtags(companyId, parseInt(limit));

      res.json({
        done: true,
        data: hashtags
      });
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to fetch trending hashtags'
      });
    }
  },

  getBookmarkedPosts: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const userId = req.user.sub;
      const { page = 1, limit = 20 } = req.query;

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.getBookmarkedPosts(companyId, userId, parseInt(page), parseInt(limit));

      res.json({
        done: true,
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to fetch bookmarked posts'
      });
    }
  },

  searchPosts: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { query, page = 1, limit = 20 } = req.query;

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      if (!query || !query.trim()) {
        return res.status(400).json({
          done: false,
          error: 'Search query is required'
        });
      }

      const result = await SocialFeedService.searchPosts(companyId, query.trim(), parseInt(page), parseInt(limit));

      res.json({
        done: true,
        data: result.posts,
        pagination: result.pagination,
        query: query.trim()
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to search posts'
      });
    }
  },

  addReply: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId, commentId } = req.params;
      const userId = req.user.sub;
      const { content } = req.body;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!commentId) {
        return res.status(400).json({
          done: false,
          error: 'Comment ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          done: false,
          error: 'Reply content is required'
        });
      }

      const updatedPost = await SocialFeedService.addReply(companyId, postId, commentId, userId, content.trim());

      res.json({
        done: true,
        data: updatedPost,
        message: 'Reply added successfully'
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to add reply'
      });
    }
  },

  // Toggle like on a reply
  toggleReplyLike: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId, commentId, replyId } = req.params;
      const userId = req.user.sub;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!commentId) {
        return res.status(400).json({
          done: false,
          error: 'Comment ID is required'
        });
      }

      if (!replyId) {
        return res.status(400).json({
          done: false,
          error: 'Reply ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const updatedPost = await SocialFeedService.toggleReplyLike(companyId, postId, commentId, replyId, userId);

      res.json({
        done: true,
        data: updatedPost,
        message: 'Reply like toggled successfully'
      });
    } catch (error) {
      console.error('Error toggling reply like:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to toggle reply like'
      });
    }
  },

  getCommentReplies: async (req, res) => {
    try {
      const { companyId } = req.user.publicMetadata || {};
      const { postId, commentId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!postId) {
        return res.status(400).json({
          done: false,
          error: 'Post ID is required'
        });
      }

      if (!commentId) {
        return res.status(400).json({
          done: false,
          error: 'Comment ID is required'
        });
      }

      if (!companyId) {
        return res.status(400).json({
          done: false,
          error: 'Company ID not found in user metadata'
        });
      }

      const result = await SocialFeedService.getCommentReplies(
        companyId,
        postId,
        commentId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        done: true,
        data: result.replies,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting comment replies:', error);
      res.status(500).json({
        done: false,
        error: error.message || 'Failed to get comment replies'
      });
    }
  }
};
