import express from 'express';
import { socialFeedController, authenticateUser } from '../controllers/socialfeed/socialFeed.controller.js';
import { validateCompanyAccess } from '../controllers/socialfeed/validation.middleware.js';

const router = express.Router();
router.use(authenticateUser);
router.use(validateCompanyAccess);
router.get('/posts', socialFeedController.getAllPosts);
router.get('/posts/user/:userId', socialFeedController.getPostsByUser);
router.post('/posts', socialFeedController.createPost);
router.put('/posts/:postId', socialFeedController.updatePost);
router.delete('/posts/:postId', socialFeedController.deletePost);
router.post('/posts/:postId/like', socialFeedController.toggleLike);
router.post('/posts/:postId/comments', socialFeedController.addComment);
router.delete('/posts/:postId/comments/:commentId', socialFeedController.deleteComment);
router.post('/posts/:postId/comments/:commentId/replies', socialFeedController.addReply);
router.post('/posts/:postId/comments/:commentId/replies/:replyId/like', socialFeedController.toggleReplyLike);
router.get('/posts/:postId/comments/:commentId/replies', socialFeedController.getCommentReplies);
router.post('/posts/:postId/bookmark', socialFeedController.toggleBookmark);
router.get('/hashtags/trending', socialFeedController.getTrendingHashtags);
router.get('/bookmarks', socialFeedController.getBookmarkedPosts);
router.get('/search', socialFeedController.searchPosts);

export default router;
