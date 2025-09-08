import { getTenantCollections } from '../../config/db.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { ObjectId } from 'mongodb';

export class SocialFeedService {
  static enrichComment(comment, userMap) {
    const commentUser = userMap[comment.userId];
    let enrichedComment = { ...comment };

    if (!commentUser) {
      const fallbackUsername = comment.userId && comment.userId.includes ? (comment.userId.includes('user_') ? comment.userId.replace('user_', '') : comment.userId) : 'Unknown';
      enrichedComment.user = {
        id: comment.userId,
        firstName: fallbackUsername,
        lastName: '',
        imageUrl: null,
        email: null
      };
    } else {
      enrichedComment.user = commentUser;
    }

    if (comment.likes && comment.likes.length > 0) {
      enrichedComment.likes = comment.likes.map((like) => {
        const likeUser = userMap[like.userId];
        if (!likeUser) {
          const fallbackUsername = like.userId && like.userId.includes ? (like.userId.includes('user_') ? like.userId.replace('user_', '') : like.userId) : 'Unknown';
          return {
            ...like,
            user: {
              id: like.userId,
              firstName: fallbackUsername,
              lastName: '',
              imageUrl: null,
              email: null
            }
          };
        }
        return {
          ...like,
          user: likeUser
        };
      });
    }

    if (comment.replies && comment.replies.length > 0) {
      enrichedComment.replies = comment.replies.map(reply => this.enrichComment(reply, userMap));
    }

    return enrichedComment;
  }

  static async enrichPostsWithUserData(posts) {
    try {
      const rawUserIds = [
        ...posts.map(post => post.userId),
        ...posts.flatMap(post => post.likes?.map(like => like.userId) || []),
        ...posts.flatMap(post => post.comments?.map(comment => comment.userId) || []),
        ...posts.flatMap(post => post.comments?.flatMap(comment => comment.replies?.map(reply => reply.userId) || []) || []),
        ...posts.flatMap(post => post.comments?.flatMap(comment => comment.replies?.flatMap(reply => reply.likes?.map(like => like.userId) || []) || []) || []),
        ...posts.flatMap(post => post.shares?.map(share => share.userId) || []),
        ...posts.flatMap(post => post.bookmarks?.map(bookmark => bookmark.userId) || [])
      ];

      const userIds = [...new Set(rawUserIds.filter(userId => userId && typeof userId === 'string' && userId.trim().length > 0))]; // Filter out null, undefined, and empty userIds

      const userPromises = userIds.map(async (userId) => {
        try {
          console.log(`Fetching user data for ${userId}`);
          const user = await clerkClient.users.getUser(userId);
          return {
            id: userId,
            firstName: user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
            lastName: user.lastName || '',
            imageUrl: user.imageUrl || null,
            email: user.primaryEmailAddress?.emailAddress || null,
            publicMetadata: user.publicMetadata || {}
          };
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error.message);
          const fallbackUsername = userId.includes('user_') ? userId.replace('user_', '') : userId;

          return {
            id: userId,
            firstName: fallbackUsername,
            lastName: '',
            imageUrl: null,
            email: null,
            publicMetadata: {}
          };
        }
      });

      const users = await Promise.all(userPromises);
      const userMap = Object.fromEntries(users.map(user => [user.id, user]));

      return posts.map(post => {
        const userData = userMap[post.userId];
        if (!userData) {
          const fallbackUsername = post.userId && post.userId.includes ? (post.userId.includes('user_') ? post.userId.replace('user_', '') : post.userId) : 'Unknown';
          return {
            ...post,
            user: {
              id: post.userId,
              firstName: fallbackUsername,
              lastName: '',
              imageUrl: null,
              email: null,
              publicMetadata: {}
            }
          };
        }

        return {
          ...post,
          user: userData,
          likes: post.likes?.map(like => {
            const likeUser = userMap[like.userId];
            if (!likeUser) {
              const fallbackUsername = like.userId && like.userId.includes ? (like.userId.includes('user_') ? like.userId.replace('user_', '') : like.userId) : 'Unknown';
              return {
                ...like,
                user: {
                  id: like.userId,
                  firstName: fallbackUsername,
                  lastName: '',
                  imageUrl: null,
                  email: null
                }
              };
            }
            return {
              ...like,
              user: likeUser
            };
          }) || [],
          comments: post.comments?.map(comment => this.enrichComment(comment, userMap)) || [],
          shares: post.shares?.map(share => {
            const shareUser = userMap[share.userId];
            if (!shareUser) {
              const fallbackUsername = share.userId && share.userId.includes ? (share.userId.includes('user_') ? share.userId.replace('user_', '') : share.userId) : 'Unknown';
              return {
                ...share,
                user: {
                  id: share.userId,
                  firstName: fallbackUsername,
                  lastName: '',
                  imageUrl: null,
                  email: null
                }
              };
            }
            return {
              ...share,
              user: shareUser
            };
          }) || [],
          bookmarks: post.bookmarks?.map(bookmark => {
            const bookmarkUser = userMap[bookmark.userId];
            if (!bookmarkUser) {
              const fallbackUsername = bookmark.userId && bookmark.userId.includes ? (bookmark.userId.includes('user_') ? bookmark.userId.replace('user_', '') : bookmark.userId) : 'Unknown';
              return {
                ...bookmark,
                user: {
                  id: bookmark.userId,
                  firstName: fallbackUsername,
                  lastName: '',
                  imageUrl: null,
                  email: null
                }
              };
            }
            return {
              ...bookmark,
              user: bookmarkUser
            };
          }) || []
      }});
    } catch (error) {
      console.error('Error enriching posts with user data:', error);
      return posts;
    }
  }

  static async getAllPosts(companyId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const collections = getTenantCollections(companyId);

      const posts = await collections.socialFeeds
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collections.socialFeeds.countDocuments({});
      const enrichedPosts = await this.enrichPostsWithUserData(posts);

      return {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch social feed posts: ${error.message}`);
    }
  }

  static async getPostsByUser(companyId, userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const collections = getTenantCollections(companyId);

      const posts = await collections.socialFeeds
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collections.socialFeeds.countDocuments({ userId });

      const enrichedPosts = await this.enrichPostsWithUserData(posts);

      return {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch user posts: ${error.message}`);
    }
  }

  static async createPost(companyId, postData) {
    try {
      const collections = getTenantCollections(companyId);

      const postToInsert = {
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: postData.likes || [],
        comments: postData.comments || [],
        shares: postData.shares || [],
        bookmarks: postData.bookmarks || []
      };

      const result = await collections.socialFeeds.insertOne(postToInsert);
      const post = await collections.socialFeeds.findOne({ _id: result.insertedId });
      const enrichedPost = await this.enrichPostsWithUserData([post]);
      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  static async updatePost(companyId, postId, userId, updateData) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({
        _id: new ObjectId(postId),
        userId: userId
      });

      if (!post) {
        throw new Error('Post not found or unauthorized');
      }

      const updateResult = await collections.socialFeeds.updateOne(
        { _id: new ObjectId(postId), userId: userId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update post');
      }

      const updatedPost = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });
      const enrichedPost = await this.enrichPostsWithUserData([updatedPost]);
      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  static async deletePost(companyId, postId, userId) {
    try {
      const collections = getTenantCollections(companyId);
      const deleteResult = await collections.socialFeeds.deleteOne({
        _id: new ObjectId(postId),
        userId: userId
      });

      if (deleteResult.deletedCount === 0) {
        throw new Error('Post not found or unauthorized');
      }

      return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  static async toggleLike(companyId, postId, userId) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        throw new Error('Post not found');
      }

      const existingLikeIndex = post.likes.findIndex(like => like.userId === userId);

      let updateOperation;
      if (existingLikeIndex !== -1) {
        updateOperation = {
          $pull: { likes: { userId: userId } }
        };
      } else {
        updateOperation = {
          $push: { likes: { userId: userId, createdAt: new Date() } }
        };
      }

      const updateResult = await collections.socialFeeds.updateOne(
        { _id: new ObjectId(postId) },
        updateOperation
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update like');
      }

      const updatedPost = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });
      const enrichedPost = await this.enrichPostsWithUserData([updatedPost]);
      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to toggle like: ${error.message}`);
    }
  }

  static async addComment(companyId, postId, userId, content) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        throw new Error('Post not found');
      }

      const commentData = {
        userId,
        content,
        createdAt: new Date(),
        likes: []
      };

      const updateResult = await collections.socialFeeds.updateOne(
        { _id: new ObjectId(postId) },
        {
          $push: { comments: commentData },
          $set: { updatedAt: new Date() }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to add comment');
      }

      const updatedPost = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });
      const enrichedPost = await this.enrichPostsWithUserData([updatedPost]);
      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  static async deleteComment(companyId, postId, commentId, userId) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        throw new Error('Post not found');
      }

      const commentIndex = post.comments.findIndex(
        comment => comment._id && comment._id.toString() === commentId && comment.userId === userId
      );

      if (commentIndex === -1) {
        throw new Error('Comment not found or unauthorized');
      }

      const updateResult = await collections.socialFeeds.updateOne(
        { _id: new ObjectId(postId) },
        {
          $pull: { comments: { _id: new ObjectId(commentId), userId: userId } },
          $set: { updatedAt: new Date() }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to delete comment');
      }

      return { success: true, message: 'Comment deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  static async toggleBookmark(companyId, postId, userId) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });

      if (!post) {
        throw new Error('Post not found');
      }

      const existingBookmarkIndex = post.bookmarks.findIndex(bookmark => bookmark.userId === userId);

      let updateOperation;
      if (existingBookmarkIndex !== -1) {
        updateOperation = {
          $pull: { bookmarks: { userId: userId } }
        };
      } else {
        updateOperation = {
          $push: { bookmarks: { userId: userId, createdAt: new Date() } }
        };
      }

      const updateResult = await collections.socialFeeds.updateOne(
        { _id: new ObjectId(postId) },
        updateOperation
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update bookmark');
      }

      return { success: true, message: 'Bookmark updated successfully' };
    } catch (error) {
      throw new Error(`Failed to toggle bookmark: ${error.message}`);
    }
  }

  static async getTrendingHashtags(companyId, limit = 10) {
    try {
      const collections = getTenantCollections(companyId);

      const pipeline = [
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
            lastUsed: { $max: '$createdAt' }
          }
        },
        {
          $sort: {
            count: -1,
            lastUsed: -1
          }
        },
        { $limit: limit },
        {
          $project: {
            hashtag: '$_id',
            count: 1,
            lastUsed: 1,
            _id: 0
          }
        }
      ];

      const result = await collections.socialFeeds.aggregate(pipeline).toArray();
      return result;
    } catch (error) {
      throw new Error(`Failed to get trending hashtags: ${error.message}`);
    }
  }

  static async getBookmarkedPosts(companyId, userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const collections = getTenantCollections(companyId);

      const posts = await collections.socialFeeds
        .find({ 'bookmarks.userId': userId })
        .sort({ 'bookmarks.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collections.socialFeeds.countDocuments({ 'bookmarks.userId': userId });
      const enrichedPosts = await this.enrichPostsWithUserData(posts);

      return {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch bookmarked posts: ${error.message}`);
    }
  }

  static async searchPosts(companyId, query, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const collections = getTenantCollections(companyId);

      const searchRegex = new RegExp(query, 'i');

      const posts = await collections.socialFeeds
        .find({
          $or: [
            { content: searchRegex },
            { tags: searchRegex }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collections.socialFeeds.countDocuments({
        $or: [
          { content: searchRegex },
          { tags: searchRegex }
        ]
      });

      const enrichedPosts = await this.enrichPostsWithUserData(posts);

      return {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }

  static async addReply(companyId, postId, commentId, userId, content) {
    try {
      const collections = getTenantCollections(companyId);

      const reply = {
        _id: new ObjectId(),
        userId,
        content,
        createdAt: new Date(),
        likes: [],
        replies: []
      };

      const result = await collections.socialFeeds.updateOne(
        {
          _id: new ObjectId(postId),
          'comments._id': new ObjectId(commentId)
        },
        {
          $push: { 'comments.$.replies': reply },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Comment not found or reply could not be added');
      }

      const updatedPost = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });
      const enrichedPost = await this.enrichPostsWithUserData([updatedPost]);

      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to add reply: ${error.message}`);
    }
  }

  static async toggleReplyLike(companyId, postId, commentId, replyId, userId) {
    try {
      const collections = getTenantCollections(companyId);
      const post = await collections.socialFeeds.findOne({
        _id: new ObjectId(postId),
        'comments._id': new ObjectId(commentId),
        'comments.replies._id': new ObjectId(replyId)
      });

      if (!post) {
        throw new Error('Reply not found');
      }

      const comment = post.comments.find(c => c._id.toString() === commentId);
      const reply = comment.replies.find(r => r._id.toString() === replyId);

      const hasLiked = reply.likes.some(like => like.userId === userId);

      let updateOperation;
      if (hasLiked) {
        updateOperation = {
          $pull: { 'comments.$[comment].replies.$[reply].likes': { userId } }
        };
      } else {
        updateOperation = {
          $push: { 'comments.$[comment].replies.$[reply].likes': { userId, createdAt: new Date() } }
        };
      }

      const result = await collections.socialFeeds.updateOne(
        {
          _id: new ObjectId(postId),
          'comments._id': new ObjectId(commentId),
          'comments.replies._id': new ObjectId(replyId)
        },
        updateOperation,
        {
          arrayFilters: [
            { 'comment._id': new ObjectId(commentId) },
            { 'reply._id': new ObjectId(replyId) }
          ]
        }
      );

      if (result.modifiedCount === 0) {
        throw new Error('Failed to toggle reply like');
      }

      const updatedPost = await collections.socialFeeds.findOne({ _id: new ObjectId(postId) });
      const enrichedPost = await this.enrichPostsWithUserData([updatedPost]);

      return enrichedPost[0];
    } catch (error) {
      throw new Error(`Failed to toggle reply like: ${error.message}`);
    }
  }

  static async getCommentReplies(companyId, postId, commentId, page = 1, limit = 10) {
    try {
      const collections = getTenantCollections(companyId);

      const post = await collections.socialFeeds.findOne({
        _id: new ObjectId(postId),
        'comments._id': new ObjectId(commentId)
      });

      if (!post) {
        throw new Error('Post or comment not found');
      }

      const comment = post.comments.find(c => c._id.toString() === commentId);
      const replies = comment.replies || [];
      const sortedReplies = replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReplies = sortedReplies.slice(startIndex, endIndex);
      const enrichedReplies = paginatedReplies.map(reply => this.enrichComment(reply, {}));

      return {
        replies: enrichedReplies,
        pagination: {
          page,
          limit,
          total: replies.length,
          pages: Math.ceil(replies.length / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get comment replies: ${error.message}`);
    }
  }
}
