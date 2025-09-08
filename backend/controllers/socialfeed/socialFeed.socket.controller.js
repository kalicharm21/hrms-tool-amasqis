import { SocialFeedService } from '../../services/socialfeed/socialFeed.services.js';

const socialFeedSocketController = (socket, io) => {

  if (!socket.userId || !socket.authenticated) {
    console.error(`User not authenticated for socket: ${socket.id}`, {
      hasUserId: !!socket.userId,
      isAuthenticated: socket.authenticated
    });
    socket.emit('socialfeed:error', {
      done: false,
      error: 'Authentication required'
    });
    return;
  }

  const companyId = socket.companyId;
  if (companyId) {
    socket.join(`socialfeed:${companyId}`);
  } else {
    console.error(`User ${socket.userId} has no company ID`);
    socket.emit('socialfeed:error', {
      done: false,
      error: 'Company ID required for social feed'
    });
    return;
  }

  socket.on("socialfeed:create-post", async (postData) => {
    try {
      const { content, images = [], tags = [], location, isPublic = true } = postData;
      const userId = socket.userId;

      if (!content || !content.trim()) {
        socket.emit("socialfeed:create-post-response", {
          done: false,
          error: "Post content is required"
        });
        return;
      }

      const newPost = await SocialFeedService.createPost(companyId, {
        userId,
        companyId,
        content: content.trim(),
        images,
        tags,
        location,
        isPublic
      });

      io.to(`socialfeed:${companyId}`).emit("socialfeed:newPost", {
        done: true,
        data: newPost,
        message: "New post created"
      });

      socket.emit("socialfeed:create-post-response", {
        done: true,
        data: newPost,
        message: "Post created successfully"
      });

    } catch (error) {
      console.error("Error creating post:", error);
      socket.emit("socialfeed:create-post-response", {
        done: false,
        error: error.message || "Failed to create post"
      });
    }
  });

  socket.on("socialfeed:toggle-like", async (data) => {
    try {

      const { postId } = data;
      const userId = socket.userId;

      if (!postId) {
        socket.emit("socialfeed:toggle-like-response", {
          done: false,
          error: "Post ID is required"
        });
        return;
      }

      const updatedPost = await SocialFeedService.toggleLike(companyId, postId, userId);

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postUpdate", {
        done: true,
        data: updatedPost,
        action: "like",
        message: "Post like updated"
      });

      socket.emit("socialfeed:toggle-like-response", {
        done: true,
        data: updatedPost,
        message: "Like updated successfully"
      });

    } catch (error) {
      console.error("Error toggling like:", error);
      socket.emit("socialfeed:toggle-like-response", {
        done: false,
        error: error.message || "Failed to toggle like"
      });
    }
  });

  socket.on("socialfeed:add-comment", async (data) => {
    try {
      const { postId, content } = data;
      const userId = socket.userId;

      if (!postId) {
        socket.emit("socialfeed:add-comment-response", {
          done: false,
          error: "Post ID is required"
        });
        return;
      }

      if (!content || !content.trim()) {
        socket.emit("socialfeed:add-comment-response", {
          done: false,
          error: "Comment content is required"
        });
        return;
      }

      const updatedPost = await SocialFeedService.addComment(companyId, postId, userId, content.trim());

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postUpdate", {
        done: true,
        data: updatedPost,
        action: "comment",
        message: "New comment added"
      });

      socket.emit("socialfeed:add-comment-response", {
        done: true,
        data: updatedPost,
        message: "Comment added successfully"
      });

    } catch (error) {
      console.error("Error adding comment:", error);
      socket.emit("socialfeed:add-comment-response", {
        done: false,
        error: error.message || "Failed to add comment"
      });
    }
  });

  socket.on("socialfeed:delete-post", async (data) => {
    try {
      const { postId } = data;
      const userId = socket.userId;

      if (!postId) {
        socket.emit("socialfeed:delete-post-response", {
          done: false,
          error: "Post ID is required"
        });
        return;
      }

      const result = await SocialFeedService.deletePost(companyId, postId, userId);

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postDeleted", {
        done: true,
        data: { postId },
        message: "Post deleted"
      });

      socket.emit("socialfeed:delete-post-response", {
        done: true,
        data: result,
        message: "Post deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting post:", error);
      socket.emit("socialfeed:delete-post-response", {
        done: false,
        error: error.message || "Failed to delete post"
      });
    }
  });

  socket.on("socialfeed:delete-comment", async (data) => {
    try {
      const { postId, commentId } = data;
      const userId = socket.userId;

      if (!postId || !commentId) {
        socket.emit("socialfeed:delete-comment-response", {
          done: false,
          error: "Post ID and Comment ID are required"
        });
        return;
      }

      const result = await SocialFeedService.deleteComment(companyId, postId, commentId, userId);

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postUpdate", {
        done: true,
        data: result.updatedPost,
        action: "deleteComment",
        message: "Comment deleted"
      });

      socket.emit("socialfeed:delete-comment-response", {
        done: true,
        data: result,
        message: "Comment deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting comment:", error);
      socket.emit("socialfeed:delete-comment-response", {
        done: false,
        error: error.message || "Failed to delete comment"
      });
    }
  });

  socket.on("socialfeed:toggle-bookmark", async (data) => {
    try {
      const { postId } = data;
      const userId = socket.userId;

      if (!postId) {
        socket.emit("socialfeed:toggle-bookmark-response", {
          done: false,
          error: "Post ID is required"
        });
        return;
      }

      const result = await SocialFeedService.toggleBookmark(companyId, postId, userId);

      socket.emit("socialfeed:toggle-bookmark-response", {
        done: true,
        data: result,
        message: "Bookmark updated successfully"
      });

    } catch (error) {
      console.error("Error toggling bookmark:", error);
      socket.emit("socialfeed:toggle-bookmark-response", {
        done: false,
        error: error.message || "Failed to toggle bookmark"
      });
    }
  });

  socket.on("socialfeed:add-reply", async (data) => {
    try {
      const { postId, commentId, content } = data;
      const userId = socket.userId;

      if (!postId || !commentId) {
        socket.emit("socialfeed:add-reply-response", {
          done: false,
          error: "Post ID and Comment ID are required"
        });
        return;
      }

      if (!content || !content.trim()) {
        socket.emit("socialfeed:add-reply-response", {
          done: false,
          error: "Reply content is required"
        });
        return;
      }

      const updatedPost = await SocialFeedService.addReply(companyId, postId, commentId, userId, content.trim());

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postUpdate", {
        done: true,
        data: updatedPost,
        action: "reply",
        message: "New reply added"
      });

      socket.emit("socialfeed:add-reply-response", {
        done: true,
        data: updatedPost,
        message: "Reply added successfully"
      });

    } catch (error) {
      console.error("Error adding reply:", error);
      socket.emit("socialfeed:add-reply-response", {
        done: false,
        error: error.message || "Failed to add reply"
      });
    }
  });

  socket.on("socialfeed:toggle-reply-like", async (data) => {
    try {
      const { postId, commentId, replyId } = data;
      const userId = socket.userId;

      if (!postId || !commentId || !replyId) {
        socket.emit("socialfeed:toggle-reply-like-response", {
          done: false,
          error: "Post ID, Comment ID, and Reply ID are required"
        });
        return;
      }

      const updatedPost = await SocialFeedService.toggleReplyLike(companyId, postId, commentId, replyId, userId);

      io.to(`socialfeed:${companyId}`).emit("socialfeed:postUpdate", {
        done: true,
        data: updatedPost,
        action: "replyLike",
        message: "Reply like updated"
      });

      socket.emit("socialfeed:toggle-reply-like-response", {
        done: true,
        data: updatedPost,
        message: "Reply like updated successfully"
      });

    } catch (error) {
      console.error("Error toggling reply like:", error);
      socket.emit("socialfeed:toggle-reply-like-response", {
        done: false,
        error: error.message || "Failed to toggle reply like"
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected from social feed`);
    if (companyId) {
      socket.leave(`socialfeed:${companyId}`);
    }
  });
};

export default socialFeedSocketController;
