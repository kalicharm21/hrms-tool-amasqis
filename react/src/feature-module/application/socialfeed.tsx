import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Lightbox from 'yet-another-react-lightbox';
import "yet-another-react-lightbox/styles.css";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useSocialFeed } from "../../hooks/useSocialFeed";
import { useUser } from "@clerk/clerk-react";

interface PostUser {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  email?: string | null;
  publicMetadata?: any;
}

interface PostComment {
  _id: string;
  content: string;
  userId: string;
  user: PostUser;
  likes?: any[];
  replies?: PostComment[];
  createdAt: string;
}

interface Post {
  _id: string;
  content: string;
  userId: string;
  user: PostUser;
  images?: string[];
  tags?: string[];
  likes?: any[];
  comments?: PostComment[];
  shares?: any[];
  bookmarks?: any[];
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
}

const SocialFeed = () => {
  const { user } = useUser();
  const {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    toggleLike,
    addComment,
    addReply,
    toggleReplyLike,
    toggleCommentLike,
    deleteComment,
    deletePost,
    getCurrentUserProfile
  } = useSocialFeed();

  const [open1, setOpen1] = useState(false);
  const [toggle2, setToggle2] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});
  const [collapsedComments, setCollapsedComments] = useState<Record<string, boolean>>({});
  const [collapsedPosts, setCollapsedPosts] = useState<Record<string, boolean>>({});
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);

  const settings = {
    dots: false,
    autoplay: false,
    slidesToShow: 8,
    margin: 24,
    speed: 500,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 8,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };
  const settings2 = {
    dots: false,
    autoplay: false,
    slidesToShow: 4,
    margin: 24,
    speed: 500,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await createPost({
        content: newPostContent,
        images: [],
        tags: [],
        isPublic: true
      });
      setNewPostContent("");
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  }, [newPostContent, createPost]);

  const handleLikePost = useCallback(async (postId: string) => {
    console.log('Toggling like for post:', postId);
    try {
      await toggleLike(postId);
      console.log('Like toggled successfully for post:', postId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  }, [toggleLike]);

  const handleAddComment = useCallback(async (postId: string, commentContent: string) => {
    if (!commentContent.trim()) return;

    try {
      await addComment(postId, commentContent);
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  }, [addComment]);

  const handleCommentInputChange = useCallback((postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  }, []);

  const handleReplyInputChange = useCallback((commentId: string, value: string) => {
    console.log('Reply input change for comment:', commentId, 'value:', value);
    setReplyInputs(prev => {
      console.log('Previous replyInputs state:', prev);
      const newState = { ...prev, [commentId]: value };
      console.log('New replyInputs state:', newState);
      return newState;
    });
  }, []);

  const handleAddReply = useCallback(async (postId: string, commentId: string, replyContent: string) => {
    if (!replyContent.trim()) return;

    console.log('Adding reply with data:', {
      postId,
      commentId,
      replyContent,
      commentIdType: typeof commentId,
      commentIdLength: commentId?.length
    });

    try {
      await addReply(postId, commentId, replyContent);
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (err) {
      console.error('Failed to add reply:', err);
    }
  }, []);

  const handleToggleReplyLike = useCallback(async (postId: string, commentId: string, replyId: string) => {
    try {
      await toggleReplyLike(postId, commentId, replyId);
    } catch (err) {
      console.error('Failed to toggle reply like:', err);
    }
  }, [toggleReplyLike]);

  const handleToggleCommentLike = useCallback(async (postId: string, commentId: string) => {
    try {
      await toggleCommentLike(postId, commentId);
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    }
  }, [toggleCommentLike]);

  const handleDeleteComment = useCallback(async (postId: string, commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(postId, commentId);
      } catch (err) {
        console.error('Failed to delete comment:', err);
        alert('Failed to delete comment. Please try again.');
      }
    }
  }, [deleteComment]);

  const handleEditComment = useCallback((commentId: string) => {
    console.log('Edit comment:', commentId);
    alert('Edit comment functionality coming soon!');
  }, []);

  const toggleCommentCollapse = useCallback((commentId: string) => {
    setCollapsedComments(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  const togglePostComments = useCallback((postId: string) => {
    console.log('Toggling comments for post:', postId);
    setCollapsedPosts(prev => {
      const newState = { ...prev, [postId]: !prev[postId] };
      console.log('Post comments state after toggle:', newState);
      return newState;
    });
  }, []);

  const toggleShowReplies = useCallback((commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(postId);
        console.log('Post deleted successfully');
      } catch (err) {
        console.error('Failed to delete post:', err);
        alert('Failed to delete post. Please try again.');
      }
    }
  }, [deletePost]);

  const toggleReplyInput = useCallback((commentId: string) => {
    console.log('Toggling reply input for comment:', commentId);
    setShowReplyInput(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (key !== commentId) {
          newState[key] = false;
        }
      });
      newState[commentId] = !prev[commentId];
      console.log('Reply input state after toggle:', newState);
      return newState;
    });
  }, []);

  const openLightbox = (images?: string[]) => {
    if (!images || images.length === 0) return;
    setLightboxImages(images.map((img: string) => ({ src: img })));
    setOpen1(true);
  };

  const userProfile = useMemo(() => getCurrentUserProfile(), [getCurrentUserProfile]);

  const formatTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

  const isExternalImage = useCallback((src: string): boolean => {
    return !!(src && (src.startsWith('http://') || src.startsWith('https://')));
  }, []);

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-xl-3 theiaStickySidebar">
              <div className="card sticky-class">
                <div className="card-body">
                  <div className="bg-light rounded p-3 mb-4">
                    <div className="text-center mb-3">
                      <Link
                        to="#"
                        className="avatar avatar-xl online avatar-rounded"
                      >
                        <ImageWithBasePath
                          src={userProfile.avatar}
                          alt="Img"
                          isLink={userProfile.avatarIsExternal}
                        />
                      </Link>
                      <h5 className="mb-1">
                        <Link to="#">{userProfile.name}</Link>
                      </h5>
                      <p className="fs-12">{userProfile.username}</p>
                    </div>
                    <div className="row g-1">
                      <div className="col-sm-4">
                        <div className="rounded bg-white text-center py-1">
                          <h4 className="mb-1">{userProfile.followers.toLocaleString()}</h4>
                          <p className="fs-12">Followers</p>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="rounded bg-white text-center py-1">
                          <h4 className="mb-1">{userProfile.following}</h4>
                          <p className="fs-12">Follows</p>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="rounded bg-white text-center py-1">
                          <h4 className="mb-1">{userProfile.posts}</h4>
                          <p className="fs-12">Post</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Link
                      to="#"
                      className="btn btn-primary d-inline-flex align-items-center justify-content-center w-100"
                    >
                      <i className="ti ti-circle-plus me-2" />
                      Create Post
                    </Link>
                  </div>
                  <div className="files-list pb-2">
                    <Link
                      to="#"
                      className="d-flex align-items-center justify-content-between active fw-medium p-2"
                    >
                      <span>
                        <i className="ti ti-brand-feedly me-2" />
                        All Feeds
                      </span>
                      <span className="badge badge-danger badge-xs rounded-pill">
                        56
                      </span>
                    </Link>
                    <Link
                      to="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-bookmark me-2" />
                      Bookmark
                    </Link>
                    <Link
                      to="#"
                      className="d-flex align-items-center justify-content-between fw-medium p-2"
                    >
                      <span>
                        <i className="ti ti-file-text me-2" />
                        Files
                      </span>
                      <span className="badge badge-info badge-xs rounded-pill">
                        14
                      </span>
                    </Link>
                    <Link
                      to="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-user-share me-2" />
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div>
                <div className="card">
                  <div className="card-body">
                    <form onSubmit={handleCreatePost}>
                      <div className="mb-3">
                        <label className="form-label fs-16">Create Post</label>
                        <div className="position-relative">
                          <textarea
                            className="form-control post-textarea"
                            rows={3}
                            placeholder="What's on your mind?"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                          />
                          <span className="avatar avatar-lg avatar-rounded text-area-avatar">
                            <ImageWithBasePath
                              src={userProfile.avatar}
                              alt="Img"
                              isLink={userProfile.avatarIsExternal}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-photo fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-link fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-paperclip fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-video fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-hash fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-map-pin-heart fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-mood-smile fs-16" />
                          </Link>
                        </div>
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-refresh fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-trash fs-16" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-sm rounded-circle"
                          >
                            <i className="ti ti-world fs-16" />
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary d-inline-flex align-items-center ms-2"
                            disabled={!newPostContent.trim() || loading}
                          >
                            <i className="ti ti-circle-plus fs-16 me-2" />
                            {loading ? 'Posting...' : 'Share Post'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <h5 className="me-2">Popular</h5>
                      <div className="owl-nav custom-nav nav-control" />
                    </div>
                    <Slider {...settings} className="channels-slider owl-carousel">
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-01.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-02.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-03.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-04.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-05.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-06.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-07.svg" alt="Img" />
                      </Link>
                      <Link to="#">
                        <ImageWithBasePath src="assets/img/icons/channel-08.svg" alt="Img" />
                      </Link>
                    </Slider>
                  </div>
                </div>
                {/* Loading state */}
                {loading && (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading posts...</p>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <div className="text-danger">
                        <i className="ti ti-alert-circle fs-1" />
                        <p className="mt-2">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts */}
                {posts && posts.length > 0 ? posts.map((post: Post) => (
                  <div key={post._id} className="card">
                    <div className="card-header border-0 pb-0">
                      <div className="d-flex align-items-center justify-content-between border-bottom flex-wrap row-gap-3 pb-3">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar avatar-lg avatar-rounded flex-shrink-0 me-2"
                          >
                            <ImageWithBasePath
                              src={post.user?.imageUrl || userProfile.avatar}
                              alt="Img"
                              isLink={isExternalImage(post.user?.imageUrl || userProfile.avatar)}
                            />
                          </Link>
                          <div>
                            <h5 className="mb-1">
                              <Link to="#">
                                {post.user ? `${post.user.firstName} ${post.user.lastName || ''}`.trim() || 'User' : 'User'}
                                {post.user?.publicMetadata?.isVerified && <i className="ti ti-circle-check-filled text-success ms-1" />}
                              </Link>
                            </h5>
                            <p className="d-flex align-items-center">
                              <span className="text-info">@{post.user?.firstName?.toLowerCase() || 'user'}</span>
                              <i className="ti ti-circle-filled fs-5 mx-2" />
                              {formatTimeAgo(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="dropdown">
                            <Link
                              to="#"
                              className="d-inline-flex align-items-center show"
                              data-bs-toggle="dropdown"
                              aria-expanded="true"
                            >
                              <i className="ti ti-dots-vertical" />
                            </Link>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li>
                                <Link to="#" className="dropdown-item rounded-1">
                                  <i className="ti ti-edit me-2" />
                                  Edit
                                </Link>
                              </li>
                              <li>
                                <Link to="#" className="dropdown-item rounded-1">
                                  <i className="ti ti-eye me-2" />
                                  Hide Post
                                </Link>
                              </li>
                              <li>
                                <Link to="#" className="dropdown-item rounded-1">
                                  <i className="ti ti-report me-2" />
                                  Report
                                </Link>
                              </li>
                              {post.userId === user?.id && (
                                <li>
                                  <Link
                                    to="#"
                                    className="dropdown-item rounded-1 text-danger"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeletePost(post._id);
                                    }}
                                  >
                                    <i className="ti ti-trash-x me-2" />
                                    Delete Post
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-2">
                        <p className="text-dark fw-medium">{post.content}</p>
                      </div>

                      {/* Post images */}
                      {post.images && post.images.length > 0 && (
                        <>
                          {post.images.length === 1 ? (
                            <div className="mb-2">
                              <ImageWithBasePath
                                src={post.images[0]}
                                className="rounded"
                                alt="Img"
                              />
                            </div>
                          ) : (
                            <Slider {...settings2} className="social-gallery-slider owl-carousel mb-3">
                              {post.images.map((image: string, index: number) => (
                                <Link
                                  key={index}
                                  to="#"
                                  onClick={() => openLightbox(post.images)}
                                  className="gallery-item"
                                >
                                  <ImageWithBasePath
                                    src={image}
                                    className="rounded"
                                    alt="img"
                                  />
                                  <span className="avatar avatar-md avatar-rounded">
                                    <i className="ti ti-eye" />
                                  </span>
                                </Link>
                              ))}
                            </Slider>
                          )}
                        </>
                      )}

                      {/* Lightbox for images */}
                      <Lightbox
                        open={open1}
                        close={() => setOpen1(false)}
                        slides={lightboxImages}
                      />

                      <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                        <div className="d-flex align-items-center flex-wrap row-gap-3">
                          <Link
                            to="#"
                            className={`d-inline-flex align-items-center me-3 ${post.likes?.includes(user?.id || '') ? 'text-danger' : 'text-muted'}`}
                            onClick={() => handleLikePost(post._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`ti ${post.likes?.includes(user?.id || '') ? 'ti-heart-filled' : 'ti-heart'} me-2`}
                               title={post.likes?.includes(user?.id || '') ? 'Unlike' : 'Like'} />
                            {post.likes?.length || 0} Likes
                          </Link>
                          <Link
                            to="#"
                            className="d-inline-flex align-items-center me-3"
                            onClick={() => {
                              console.log('Comment count clicked for post:', post._id);
                              togglePostComments(post._id);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className="ti ti-message-dots me-2" />
                            {post.comments?.length || 0} {collapsedPosts[post._id] ? 'Comments' : 'Comments'}
                            {collapsedPosts[post._id] && <i className="ti ti-chevron-down ms-1 fs-12" />}
                          </Link>
                          <Link to="#" className="d-inline-flex align-items-center">
                            <i className="ti ti-share-3 me-2" />
                            {post.shares || 0} Share
                          </Link>
                        </div>
                        <div className="d-flex align-items-center">
                          <Link to="#" className="btn btn-icon btn-sm rounded-circle">
                            <i className="ti ti-share" />
                          </Link>
                          <Link to="#" className="btn btn-icon btn-sm rounded-circle">
                            <i className="ti ti-message-star" />
                          </Link>
                          <Link to="#" className="btn btn-icon btn-sm rounded-circle">
                            <i className="ti ti-bookmark" />
                          </Link>
                        </div>
                      </div>

                      {/* Comments section */}
                      {post.comments && post.comments.length > 0 && !collapsedPosts[post._id] && (
                        <div className="mb-3">
                          {post.comments.slice(0, toggle2 ? post.comments.length : 2).map((comment: PostComment, index: number) => {
                            console.log('Rendering comment:', comment._id, 'for post:', post._id, 'index:', index);
                            return (
                              <div key={comment._id || index} className="mb-3">
                                <div className="d-flex align-items-start">
                                  <Link to="#" className="avatar avatar-rounded me-2 flex-shrink-0">
                                    <ImageWithBasePath
                                      src={comment.user?.imageUrl || userProfile.avatar}
                                      alt="Img"
                                      isLink={isExternalImage(comment.user?.imageUrl || userProfile.avatar)}
                                    />
                                  </Link>
                                  <div
                                    className={`bg-light rounded flex-fill p-2 ${collapsedComments[comment._id] ? 'cursor-pointer' : ''}`}
                                    onClick={() => toggleCommentCollapse(comment._id)}
                                    style={{ cursor: collapsedComments[comment._id] ? 'pointer' : 'default' }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                      <div className="d-flex align-items-center">
                                        <h6 className="mb-0">{comment.user ? `${comment.user.firstName} ${comment.user.lastName || ''}`.trim() || 'User' : 'User'}</h6>
                                        <span className="ms-2 text-muted fs-12">{formatTimeAgo(comment.createdAt)}</span>
                                      </div>
                                      <div className="d-flex align-items-center gap-2">
                                        {/* Like Button */}
                                        <Link
                                          to="#"
                                          className={`fs-12 text-decoration-none d-flex align-items-center ${comment.likes?.includes(user?.id || '') ? 'text-danger' : 'text-muted'}`}
                                          onClick={() => handleToggleCommentLike(post._id, comment._id)}
                                        >
                                          <i className={`ti ti-heart me-1 ${comment.likes?.includes(user?.id || '') ? 'ti-heart-filled' : 'ti-heart'}`}
                                             title={comment.likes?.includes(user?.id || '') ? 'Unlike comment' : 'Like comment'} />
                                          <span>{comment.likes?.length || 0}</span>
                                        </Link>

                                        {/* Reply Button */}
                                        <Link
                                          to="#"
                                          className="text-muted fs-12 text-decoration-none"
                                          onClick={() => toggleReplyInput(comment._id)}
                                        >
                                          <i className="ti ti-message-circle me-1" />
                                          Reply
                                        </Link>

                                        {/* Owner Actions */}
                                        {comment.userId === user?.id && (
                                          <div className="dropdown">
                                            <Link
                                              to="#"
                                              className="text-muted fs-12 text-decoration-none"
                                              data-bs-toggle="dropdown"
                                            >
                                              <i className="ti ti-dots-vertical" />
                                            </Link>
                                            <ul className="dropdown-menu dropdown-menu-end">
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item py-1 px-2"
                                                  onClick={() => handleEditComment(comment._id)}
                                                >
                                                  <i className="ti ti-edit me-2" />
                                                  Edit
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item py-1 px-2 text-danger"
                                                  onClick={() => handleDeleteComment(post._id, comment._id)}
                                                >
                                                  <i className="ti ti-trash me-2" />
                                                  Delete
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {!collapsedComments[comment._id] && (
                                      <>
                                        <p className="mb-2">{comment.content}</p>

                                        {/* Comment Actions Footer */}
                                        <div className="d-flex align-items-center justify-content-between pt-1 border-top border-light">
                                          <div className="d-flex align-items-center gap-3">
                                            {/* Show replies count */}
                                            {comment.replies && comment.replies.length > 0 && (
                                              <Link
                                                to="#"
                                                className="text-muted fs-12 text-decoration-none"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleShowReplies(comment._id);
                                                }}
                                              >
                                                <i className="ti ti-corner-down-right me-1" />
                                                {showReplies[comment._id] ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                              </Link>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {collapsedComments[comment._id] && (
                                      <div className="d-flex align-items-center justify-content-between">
                                        <span className="text-muted fs-12">Click to expand</span>
                                        <i className="ti ti-chevron-down text-muted" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Reply input form */}
                                {showReplyInput[comment._id] && (
                                  <div className="d-flex align-items-start mt-2 ms-4">
                                    <Link to="#" className="avatar avatar-rounded me-2 flex-shrink-0">
                                      <ImageWithBasePath
                                        src={userProfile.avatar}
                                        alt="Img"
                                        isLink={userProfile.avatarIsExternal}
                                      />
                                    </Link>
                                    <div className="flex-fill">
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Write a reply..."
                                        value={replyInputs[comment._id] || ''}
                                        onChange={(e) => {
                                          console.log('Input onChange for comment:', comment._id, 'new value:', e.target.value);
                                          handleReplyInputChange(comment._id, e.target.value);
                                        }}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            const currentReplyContent = replyInputs[comment._id] || '';
                                            if (currentReplyContent.trim()) {
                                              handleAddReply(post._id, comment._id, currentReplyContent.trim());
                                            }
                                          }
                                        }}
                                      />
                                      <div className="d-flex align-items-center justify-content-between mt-2">
                                        <div className="d-flex align-items-center">
                                          <Link
                                            to="#"
                                            className="btn btn-icon btn-sm rounded-circle me-1"
                                          >
                                            <i className="ti ti-photo fs-16" />
                                          </Link>
                                          <Link
                                            to="#"
                                            className="btn btn-icon btn-sm rounded-circle me-1"
                                          >
                                            <i className="ti ti-link fs-16" />
                                          </Link>
                                          <Link
                                            to="#"
                                            className="btn btn-icon btn-sm rounded-circle me-1"
                                          >
                                            <i className="ti ti-paperclip fs-16" />
                                          </Link>
                                          <Link
                                            to="#"
                                            className="btn btn-icon btn-sm rounded-circle"
                                          >
                                            <i className="ti ti-mood-smile fs-16" />
                                          </Link>
                                        </div>
                                        <div className="d-flex align-items-center">
                                          <button
                                            type="button"
                                            className="btn btn-primary btn-sm d-inline-flex align-items-center me-2"
                                            onClick={() => {
                                              console.log('Reply button clicked for comment:', comment._id, 'post:', post._id);
                                              console.log('Reply input value:', replyInputs[comment._id]);
                                              handleAddReply(post._id, comment._id, replyInputs[comment._id] || '');
                                            }}
                                            disabled={!replyInputs[comment._id]?.trim()}
                                          >
                                            <i className="ti ti-send fs-16 me-1" />
                                            Reply
                                          </button>
                                          <Link
                                            to="#"
                                            className="btn btn-icon btn-sm rounded-circle"
                                            onClick={() => setShowReplyInput(prev => ({ ...prev, [comment._id]: false }))}
                                          >
                                            <i className="ti ti-x fs-16" />
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Replies display */}
                                {comment.replies && comment.replies.length > 0 && showReplies[comment._id] && (
                                  <div className="ms-4 mt-2">
                                    {comment.replies.map((reply: PostComment, replyIndex: number) => (
                                      <div key={reply._id || replyIndex} className="d-flex align-items-start mb-2">
                                        <Link to="#" className="avatar avatar-sm avatar-rounded me-2 flex-shrink-0">
                                          <ImageWithBasePath
                                            src={reply.user?.imageUrl || userProfile.avatar}
                                            alt="Img"
                                            isLink={isExternalImage(reply.user?.imageUrl || userProfile.avatar)}
                                          />
                                        </Link>
                                        <div className="bg-light rounded flex-fill p-2">
                                          <div className="d-flex align-items-center justify-content-between mb-1">
                                            <div className="d-flex align-items-center">
                                              <h6 className="mb-0 fs-14">{reply.user ? `${reply.user.firstName} ${reply.user.lastName || ''}`.trim() || 'User' : 'User'}</h6>
                                              <span className="ms-2 text-muted fs-12">{formatTimeAgo(reply.createdAt)}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                              <Link
                                                to="#"
                                                className="text-muted fs-12 text-decoration-none me-2"
                                                onClick={() => toggleReplyInput(`${comment._id}-${reply._id}`)}
                                              >
                                                Reply
                                              </Link>
                                              <Link
                                                to="#"
                                                className={`fs-12 text-decoration-none ${reply.likes?.includes(user?.id || '') ? 'text-danger' : 'text-muted'}`}
                                                onClick={() => handleToggleReplyLike(post._id, comment._id, reply._id)}
                                              >
                                                <i className={`ti ti-heart ${reply.likes?.includes(user?.id || '') ? 'ti-heart-filled' : 'ti-heart'}`}
                                                   title={reply.likes?.includes(user?.id || '') ? 'Unlike reply' : 'Like reply'} />
                                                <span className="ms-1">{reply.likes?.length || 0}</span>
                                              </Link>
                                            </div>
                                          </div>
                                          <p className="mb-0 fs-14">{reply.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            );
                          })}

                          {post.comments.length > 2 && (
                            <div className="view-all text-center mb-3">
                              <Link
                                to="#"
                                className="viewall-button text-primary fw-medium"
                                onClick={() => setToggle2(!toggle2)}
                              >
                                <span>View {toggle2 ? 'Less' : `All ${post.comments.length}`} Comments</span>
                                <i className="fa fa-chevron-down fs-10 ms-2" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comment input */}
                      <div className="d-flex align-items-start">
                        <Link to="#" className="avatar avatar-rounded me-2 flex-shrink-0">
                          <ImageWithBasePath
                            src={userProfile.avatar}
                            alt="Img"
                            isLink={userProfile.avatarIsExternal}
                          />
                        </Link>
                        <div className="flex-fill">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Comments"
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post._id, commentInputs[post._id] || '');
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )) : !loading && !error && (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <p>No posts available yet. Be the first to create a post!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="col-xl-3 theiaStickySidebar">
              <div className="sticky-class">
                <div className="card ">
                  <div className="card-body">
                    <h5 className="mb-3">Peoples</h5>
                    <ul
                      className="nav nav-pills border d-flex p-2 rounded mb-3"
                      id="pills-tab"
                      role="tablist"
                    >
                      <li className="nav-item flex-fill" role="presentation">
                        <button
                          className="nav-link btn active w-100"
                          data-bs-toggle="pill"
                          data-bs-target="#pills-home"
                          type="button"
                          role="tab"
                          aria-selected="true"
                        >
                          General
                        </button>
                      </li>
                      <li className="nav-item flex-fill" role="presentation">
                        <button
                          className="nav-link btn w-100"
                          data-bs-toggle="pill"
                          data-bs-target="#pills-profile"
                          type="button"
                          role="tab"
                          aria-selected="false"
                        >
                          Primary
                        </button>
                      </li>
                    </ul>
                    <div className="tab-content">
                      <div
                        className="tab-pane fade show active"
                        id="pills-home"
                        role="tabpanel"
                      >
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-29.jpg"
                                  alt="Img"
                                />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Anthony Lewis</Link>
                                  <i className="ti ti-circle-check-filled text-success ms-1" />
                                </h6>
                                <span className="fs-12 d-block">United States</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Harvey Smith</Link>
                                </h6>
                                <span className="fs-12 d-block">Ukrain</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-33.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Stephan Peralt</Link>
                                </h6>
                                <span className="fs-12 d-block">Isreal</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-34.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Doglas Martini</Link>
                                </h6>
                                <span className="fs-12 d-block">Belgium</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-09.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Brian Villalobos</Link>
                                  <i className="ti ti-circle-check-filled text-success ms-1" />
                                </h6>
                                <span className="fs-12 d-block">United Kingdom</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-02.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Linda Ray</Link>
                                </h6>
                                <span className="fs-12 d-block">Argentina</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                        </div>
                        <div>
                          <Link
                            to="#"
                            className="btn btn-outline-light w-100 border"
                          >
                            View All <i className="ti ti-arrow-right ms-2" />
                          </Link>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="pills-profile"
                        role="tabpanel"
                      >
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-11.jpg"
                                  alt="Img"
                                />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Anthony Lewis</Link>
                                  <i className="ti ti-circle-check-filled text-success ms-1" />
                                </h6>
                                <span className="fs-12 d-block">United States</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-12.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Harvey Smith</Link>
                                </h6>
                                <span className="fs-12 d-block">Ukrain</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-13.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Stephan Peralt</Link>
                                </h6>
                                <span className="fs-12 d-block">Isreal</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-14.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Doglas Martini</Link>
                                </h6>
                                <span className="fs-12 d-block">Belgium</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-15.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Brian Villalobos</Link>
                                  <i className="ti ti-circle-check-filled text-success ms-1" />
                                </h6>
                                <span className="fs-12 d-block">United Kingdom</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="avatar avatar-rounded flex-shrink-0 me-2"
                              >
                                <ImageWithBasePath src="assets/img/users/user-16.jpg" alt="Img" />
                              </Link>
                              <div>
                                <h6 className="d-inline-flex align-items-center fw-medium mb-1">
                                  <Link to="#">Linda Ray</Link>
                                </h6>
                                <span className="fs-12 d-block">Argentina</span>
                              </div>
                            </div>
                            <Link
                              to="#"
                              className="btn btn-sm btn-icon"
                            >
                              <i className="ti ti-user-x" />
                            </Link>
                          </div>
                        </div>
                        <div>
                          <Link
                            to="#"
                            className="btn btn-outline-light w-100 border"
                          >
                            View All <i className="ti ti-arrow-right ms-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h5 className="mb-3">Saved Feeds</h5>
                    <div className="bg-light-500 rounded p-2 mb-2">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <Link
                          to="#"
                          className="d-flex align-items-center"
                        >
                          <span>
                            <ImageWithBasePath
                              src="assets/img/icons/feeds-01.svg"
                              className="me-2"
                              alt="Img"
                            />
                          </span>
                          <p className="fs-12 fw-medium">World Health</p>
                        </Link>
                        <Link to="#">
                          <i className="ti ti-bookmark-filled text-warning" />
                        </Link>
                      </div>
                      <p className="text-dark fw-medium">
                        <Link to="#">
                          Retail investor party continues even as
                        </Link>
                      </p>
                    </div>
                    <div className="bg-light-500 rounded p-2 mb-2">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <Link
                          to="#"
                          className="d-flex align-items-center"
                        >
                          <span>
                            <ImageWithBasePath
                              src="assets/img/icons/feeds-02.svg"
                              className="me-2"
                              alt="Img"
                            />
                          </span>
                          <p className="fs-12 fw-medium">T3 Tech</p>
                        </Link>
                        <Link to="#">
                          <i className="ti ti-bookmark-filled text-warning" />
                        </Link>
                      </div>
                      <p className="text-dark fw-medium">
                        <Link to="#">
                          Ipad Air (2020) vs Samsung Galaxy Tab
                        </Link>
                      </p>
                    </div>
                    <div className="bg-light-500 rounded p-2 mb-2">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <Link
                          to="#"
                          className="d-flex align-items-center"
                        >
                          <span>
                            <ImageWithBasePath
                              src="assets/img/icons/feeds-03.svg"
                              className="me-2"
                              alt="Img"
                            />
                          </span>
                          <p className="fs-12 fw-medium">Fstoppers</p>
                        </Link>
                        <Link to="#">
                          <i className="ti ti-bookmark-filled text-warning" />
                        </Link>
                      </div>
                      <p className="text-dark fw-medium">
                        <Link to="#">
                          Beyond capital gains tax! Top 50 stock
                        </Link>
                      </p>
                    </div>
                    <div className="bg-light-500 rounded p-2">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <Link
                          to="#"
                          className="d-flex align-items-center"
                        >
                          <span>
                            <ImageWithBasePath
                              src="assets/img/icons/feeds-04.svg"
                              className="me-2"
                              alt="Img"
                            />
                          </span>
                          <p className="fs-12 fw-medium">Evernote</p>
                        </Link>
                        <Link to="#">
                          <i className="ti ti-bookmark-filled text-warning" />
                        </Link>
                      </div>
                      <p className="text-dark fw-medium">
                        <Link to="#">
                          Sony Just Destroyed the Competition
                        </Link>
                      </p>
                    </div>
                    <div className="mt-3">
                      <Link
                        to="#"
                        className="btn btn-outline-light w-100 border"
                      >
                        View All <i className="ti ti-arrow-right ms-2" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h5 className="mb-3">Trending Hastags</h5>
                    <div className="d-flex align-items-center flex-wrap gap-1">
                      <Link
                        to="#"
                        className="text-info d-inline-flex link-hover"
                      >
                        #HealthTips
                      </Link>
                      <Link
                        to="#"
                        className="text-info d-inline-flex link-hover"
                      >
                        #Wellness
                      </Link>
                      <Link
                        to="#"
                        className="text-info d-inline-flex link-hover"
                      >
                        #Motivation
                      </Link>
                      <Link
                        to="#"
                        className="text-info d-inline-flex link-hover"
                      >
                        #Inspiration{" "}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialFeed;
