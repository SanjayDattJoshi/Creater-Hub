import { useState, useRef } from 'react';
import { useVideo } from '../../context/VideoContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  HiHeart, HiOutlineHeart, HiChat, HiDotsVertical,
  HiTrash, HiUserCircle, HiPlay, HiVolumeUp, HiVolumeOff,
  HiPaperAirplane, HiPencil, HiCheck, HiX,
} from 'react-icons/hi';

/* ─── Video Player ─── */
const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error,    setError]    = useState(false);

  const { setActiveVideo } = useVideo();

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.paused) {
        // Pause any other playing video before starting this one
        setActiveVideo(v);
        await v.play();
      } else {
        v.pause();
      }
    } catch { setError(true); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (error) {
    return (
      <div className="w-full h-48 rounded-xl bg-dark-850 flex flex-col items-center justify-center gap-2 text-gray-500">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm">Video unavailable</p>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-brand-400 underline">Open directly</a>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden group cursor-pointer select-none" onClick={togglePlay}>
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v && v.duration) setProgress((v.currentTime / v.duration) * 100);
        }}
        onError={() => setError(true)}
        className="w-full object-contain block"
        style={{ maxHeight: '70vh' }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/quicktime" />
      </video>

      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:scale-110 transition-all duration-200">
            <HiPlay className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200 ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full h-1.5 bg-white/20 rounded-full mb-2 cursor-pointer" onClick={handleSeek}>
          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70 tabular-nums">
            {fmt(videoRef.current?.currentTime || 0)} / {fmt(duration)}
          </span>
          <button onClick={toggleMute} className="text-white/70 hover:text-white p-1">
            {muted ? <HiVolumeOff className="w-4 h-4" /> : <HiVolumeUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── PostCard ─── */
const PostCard = ({ post, onUpdated, onDeleted }) => {
  const { user } = useAuth();

  // ── Like — NO optimistic update, only trust server response ──
  const [liked, setLiked] = useState(() => {
    if (post.isLiked !== undefined) return Boolean(post.isLiked);
    return post.likes?.map(String).includes(String(user?._id)) ?? false;
  });
  const [likeCount, setLikeCount] = useState(
    post.likesCount !== undefined ? post.likesCount : (post.likes?.length ?? 0)
  );
  const [liking, setLiking] = useState(false);

  // ── Delete ──
  const [showMenu, setShowMenu]           = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Edit — single source of truth: displayCaption / displayHashtags ──
  const [editing, setEditing]               = useState(false);
  const [displayCaption, setDisplayCaption] = useState(post.caption || '');
  const [displayHashtags, setDisplayHashtags] = useState(post.hashtags || []);
  const [editCaption, setEditCaption]       = useState(post.caption || '');
  const [editHashtags, setEditHashtags]     = useState(post.hashtags?.join(' ') || '');
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState('');

  // ── Comments ──
  const [showComments, setShowComments]       = useState(false);
  const [comments, setComments]               = useState([]);
  const [commentsLoaded, setCommentsLoaded]   = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount]       = useState(post.commentsCount ?? 0);
  const [commentText, setCommentText]         = useState('');
  const [submitting, setSubmitting]           = useState(false);

  const isOwner = user?._id && (post.author?._id || post.author) &&
    String(user._id) === String(post.author?._id ?? post.author);

  /* ── Like — NO optimistic, wait for server ── */
  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      // Only update from server — never guess
      setLiked(data.isLiked);
      setLikeCount(data.likesCount);
      onUpdated?.({ ...post, likesCount: data.likesCount, isLiked: data.isLiked });
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLiking(false);
    }
  };

  /* ── Delete — two-step confirm ── */
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setShowMenu(false);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      onDeleted?.(post._id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  /* ── Open edit — reset edit fields from current display values ── */
  const openEdit = () => {
    setEditCaption(displayCaption);
    setEditHashtags(displayHashtags.join(' '));
    setSaveError('');
    setEditing(true);
    setShowMenu(false);
  };

  /* ── Save edit ── */
  const handleSave = async () => {
    if (!editCaption.trim()) { setSaveError('Caption cannot be empty'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const parsedTags = editHashtags
        .split(/[\s,]+/)
        .map(t => t.replace(/^#/, '').trim())
        .filter(Boolean);
      const { data } = await api.put(`/posts/${post._id}`, {
        caption: editCaption.trim(),
        hashtags: parsedTags,
      });
      // Update display state from server response
      setDisplayCaption(data.post.caption);
      setDisplayHashtags(data.post.hashtags);
      setEditing(false);
      onUpdated?.(data.post);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError('');
    setEditCaption(displayCaption);
    setEditHashtags(displayHashtags.join(' '));
  };

  /* ── Comments ── */
  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const { data } = await api.get(`/posts/${post._id}/comments`);
        setComments(data.comments || []);
        setCommentsLoaded(true);
      } catch { /* silent */ }
      finally { setCommentsLoading(false); }
    }
    setShowComments(prev => !prev);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { content: commentText.trim() });
      setComments(prev => [data.comment, ...prev]);
      setCommentCount(c => c + 1);
      setCommentText('');
      setCommentsLoaded(true);
      if (!showComments) setShowComments(true);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); }
  };

  /* ── Render ── */
  return (
    <div className="card p-5 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3 group">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/30 flex-shrink-0" />
          ) : (
            <HiUserCircle className="w-10 h-10 text-gray-500 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
              {post.author?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{post.author?.role}</p>
          </div>
        </Link>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-1.5">
            {/* Confirm-delete strip */}
            {confirmDelete && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30">
                <span className="text-xs text-red-400 font-medium">Delete?</span>
                <button onClick={handleDelete} disabled={deleting}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Yes'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-500 hover:text-gray-300">
                  No
                </button>
              </div>
            )}

            {!confirmDelete && (
              <div className="relative">
                <button onClick={() => setShowMenu(m => !m)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/05 transition-colors">
                  <HiDotsVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-9 bg-dark-800 border border-white/10 rounded-xl shadow-2xl z-20 py-1.5 min-w-[150px]">
                      <button onClick={openEdit}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/05 hover:text-white transition-colors">
                        <HiPencil className="w-4 h-4" /> Edit post
                      </button>
                      <div className="my-1 border-t border-white/08" />
                      <button onClick={() => { setShowMenu(false); handleDelete(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <HiTrash className="w-4 h-4" /> Delete post
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit mode ── */}
      {editing ? (
        <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/08">
          <textarea
            value={editCaption}
            onChange={e => setEditCaption(e.target.value)}
            rows={3}
            maxLength={2200}
            placeholder="What's on your mind?"
            className="input resize-none text-sm leading-relaxed w-full"
          />
          <input
            value={editHashtags}
            onChange={e => setEditHashtags(e.target.value)}
            placeholder="hashtags — space separated e.g.  fashion tech"
            className="input text-sm"
          />
          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{saveError}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button onClick={cancelEdit} className="btn-ghost py-1.5 px-3 text-sm flex items-center gap-1">
              <HiX className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !editCaption.trim()}
              className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1.5 disabled:opacity-50">
              {saving
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <HiCheck className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Caption display ── */
        displayCaption && (
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{displayCaption}</p>
        )
      )}

      {/* ── Media ── */}
      {post.mediaUrl && !editing && (
        <div className="rounded-xl overflow-hidden bg-black/30">
          {post.mediaType === 'video' ? (
            <VideoPlayer src={post.mediaUrl} />
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full block object-contain" style={{ maxHeight: '70vh' }} />
          )}
        </div>
      )}

      {/* ── Hashtags ── */}
      {!editing && displayHashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayHashtags.map((tag) => (
            <span key={tag} className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/08">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
            liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          } ${liking ? 'opacity-60 cursor-wait' : ''}`}
        >
          {liking
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : liked
              ? <HiHeart className="w-5 h-5" />
              : <HiOutlineHeart className="w-5 h-5" />
          }
          <span>{likeCount}</span>
        </button>

        <button onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            showComments ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
          }`}>
          <HiChat className="w-5 h-5" />
          <span>{commentCount}</span>
        </button>

        <span className="ml-auto text-xs text-gray-600">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* ── Comments ── */}
      {showComments && (
        <div className="space-y-3 pt-1">
          {user && (
            <div className="flex items-center gap-2">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                : <HiUserCircle className="w-8 h-8 text-gray-500 flex-shrink-0" />}
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment… (Enter to post)"
                className="input flex-1 py-2 text-sm"
                maxLength={1000}
              />
              <button onClick={handleSubmitComment} disabled={!commentText.trim() || submitting}
                className="btn-primary p-2 rounded-xl disabled:opacity-40 flex-shrink-0">
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  : <HiPaperAirplane className="w-4 h-4 rotate-90" />}
              </button>
            </div>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-xs text-gray-600 py-3">No comments yet — be the first!</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2.5">
                  {c.author?.avatar
                    ? <img src={c.author.avatar} alt={c.author.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    : <HiUserCircle className="w-7 h-7 text-gray-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 bg-white/[0.04] rounded-xl px-3 py-2 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Link to={`/profile/${c.author?._id}`}
                        className="text-xs font-semibold text-white hover:text-brand-400 transition-colors">
                        {c.author?.name}
                      </Link>
                      <span className="text-[10px] text-gray-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed break-words">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
