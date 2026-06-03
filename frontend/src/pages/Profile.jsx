import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVideo } from '../context/VideoContext';
import Loader from '../components/common/Loader';
import FollowListModal from '../components/common/FollowListModal';
import toast from 'react-hot-toast';
import {
  HiPhotograph, HiPencil, HiCheck, HiX,
  HiMail, HiHeart, HiOutlineHeart, HiChat,
  HiCamera, HiGlobe, HiUserAdd, HiUserRemove,
  HiBadgeCheck, HiUserCircle, HiPaperAirplane,
  HiTrash, HiDotsVertical, HiPlay, HiVolumeUp, HiVolumeOff,
} from 'react-icons/hi';

/* ─────────────────────────────────────────────────────────
   VideoPlayer — auto-pauses other videos via VideoContext
───────────────────────────────────────────────────────── */
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
        style={{ maxHeight: '60vh' }}
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

/* ─────────────────────────────────────────────────────────
   ProfilePostCard — fully self-contained
───────────────────────────────────────────────────────── */
const ProfilePostCard = ({ post: initialPost, isMe, onDeleted }) => {
  const { user } = useAuth();

  // ── Local post data (so edits update display immediately) ──
  const [postData, setPostData] = useState(initialPost);

  // ── Like — NO optimistic, only server truth ──
  const [liked, setLiked] = useState(() => {
    if (initialPost.isLiked !== undefined) return Boolean(initialPost.isLiked);
    return initialPost.likes?.map(String).includes(String(user?._id)) ?? false;
  });
  const [likeCount, setLikeCount] = useState(
    initialPost.likesCount !== undefined ? initialPost.likesCount : (initialPost.likes?.length ?? 0)
  );
  const [liking, setLiking] = useState(false);

  // ── Delete ──
  const [showMenu, setShowMenu]           = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Edit ──
  const [editing, setEditing]               = useState(false);
  const [editCaption, setEditCaption]       = useState(initialPost.caption || '');
  const [editHashtags, setEditHashtags]     = useState(initialPost.hashtags?.join(' ') || '');
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState('');

  // ── Comments ──
  const [showComments, setShowComments]       = useState(false);
  const [comments, setComments]               = useState([]);
  const [commentsLoaded, setCommentsLoaded]   = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount]       = useState(initialPost.commentsCount || 0);
  const [commentText, setCommentText]         = useState('');
  const [submitting, setSubmitting]           = useState(false);

  /* ── Like — server only, no optimistic ── */
  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/posts/${postData._id}/like`);
      setLiked(data.isLiked);
      setLikeCount(data.likesCount);
    } catch {
      toast.error('Like failed');
    } finally {
      setLiking(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setShowMenu(false);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/posts/${postData._id}`);
      toast.success('Post deleted');
      onDeleted?.(postData._id);
    } catch {
      toast.error('Failed to delete post');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  /* ── Open edit ── */
  const openEdit = () => {
    setEditCaption(postData.caption || '');
    setEditHashtags(postData.hashtags?.join(' ') || '');
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
      const { data } = await api.put(`/posts/${postData._id}`, {
        caption: editCaption.trim(),
        hashtags: parsedTags,
      });
      setPostData(data.post);
      setEditing(false);
      toast.success('Post updated!');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError('');
  };

  /* ── Comments ── */
  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const { data } = await api.get(`/posts/${postData._id}/comments`);
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
      const { data } = await api.post(`/posts/${postData._id}/comments`, { content: commentText.trim() });
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

  return (
    <div className="card p-4 space-y-3 animate-fade-in">

      {/* ── Top row: date + owner menu ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600">{new Date(postData.createdAt).toLocaleDateString()}</span>

        {isMe && (
          <div className="flex items-center gap-1.5">
            {confirmDelete && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30">
                <span className="text-xs text-red-400 font-medium">Delete?</span>
                <button onClick={handleDelete} disabled={deleting}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Yes'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-300">
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
        postData.caption && (
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{postData.caption}</p>
        )
      )}

      {/* ── Media — object-contain, no cropping ── */}
      {postData.mediaUrl && !editing && (
        <div className="rounded-xl overflow-hidden bg-black/30 border border-white/05">
          {postData.mediaType === 'video' ? (
            <VideoPlayer src={postData.mediaUrl} />
          ) : (
            <img src={postData.mediaUrl} alt=""
              className="w-full block object-contain" style={{ maxHeight: '60vh' }} />
          )}
        </div>
      )}

      {/* ── Hashtags ── */}
      {!editing && postData.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {postData.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/08">
        <button onClick={handleLike} disabled={liking}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
            liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          } ${liking ? 'opacity-60 cursor-wait' : ''}`}>
          {liking
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : liked
              ? <HiHeart className="w-4 h-4" />
              : <HiOutlineHeart className="w-4 h-4" />}
          <span>{likeCount}</span>
        </button>

        <button onClick={handleToggleComments}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            showComments ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
          }`}>
          <HiChat className="w-4 h-4" />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* ── Comments ── */}
      {showComments && (
        <div className="pt-3 border-t border-white/08 space-y-3">
          {user && (
            <div className="flex items-center gap-2">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                : <HiUserCircle className="w-7 h-7 text-gray-500 flex-shrink-0" />}
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Write a comment…"
                className="input flex-1 py-1.5 text-sm" maxLength={1000} />
              <button onClick={handleSubmitComment} disabled={!commentText.trim() || submitting}
                className="btn-primary p-2 rounded-xl disabled:opacity-40">
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  : <HiPaperAirplane className="w-4 h-4 rotate-90" />}
              </button>
            </div>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-3">
              <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-xs text-gray-600 py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2">
                  {c.author?.avatar
                    ? <img src={c.author.avatar} alt={c.author.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    : <HiUserCircle className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Link to={`/profile/${c.author?._id}`}
                        className="text-xs font-semibold text-white hover:text-brand-400 transition-colors">
                        {c.author?.name}
                      </Link>
                      <span className="text-[10px] text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</span>
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

/* ─────────────────────────────────────────────────────────
   Main Profile Component
───────────────────────────────────────────────────────── */
const Profile = () => {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [profile, setProfile]             = useState(null);
  const [posts, setPosts]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [following, setFollowing]         = useState(false);
  const [editing, setEditing]             = useState(false);
  const [editForm, setEditForm]           = useState({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [followModal, setFollowModal]     = useState({ open: false, type: 'followers' });

  const isMe = !id || me?._id === id;
  const profileId = id || me?._id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profRes, postRes] = await Promise.all([
          api.get(`/users/${profileId}`),
          api.get(`/users/${profileId}/posts`),
        ]);
        setProfile(profRes.data.user);
        setFollowing(profRes.data.user.isFollowing);
        setPosts(postRes.data.posts);
        setEditForm({
          name:    profRes.data.user.name    || '',
          bio:     profRes.data.user.bio     || '',
          website: profRes.data.user.website || '',
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [profileId]);

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${profileId}/follow`);
      setFollowing(data.isFollowing);
      setProfile(prev => ({
        ...prev,
        followersCount: prev.followersCount + (data.isFollowing ? 1 : -1),
      }));
    } catch { toast.error('Failed to follow'); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/profile', editForm);
      setProfile(data.user);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSavingProfile(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      form.append('name',    profile.name    || '');
      form.append('bio',     profile.bio     || '');
      form.append('website', profile.website || '');
      const { data } = await api.put('/users/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(data.user);
      updateUser(data.user);
      toast.success('Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setAvatarUploading(false); }
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    setProfile(prev => prev
      ? { ...prev, postsCount: Math.max(0, (prev.postsCount ?? 1) - 1) }
      : prev
    );
  };

  if (loading) return <Loader text="Loading profile…" />;
  if (!profile) return <div className="card p-8 text-center text-gray-400">User not found</div>;

  const avatarSrc = profile.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=7c5ff5&color=fff&size=128`;

  const roleColor = profile.role === 'brand'
    ? 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-300'
    : 'from-brand-500/20 to-cyan-500/10 border-brand-500/30 text-brand-300';

  const coverGradient = profile.role === 'brand'
    ? 'from-yellow-900/40 via-dark-900 to-dark-900'
    : 'from-brand-900/40 via-dark-900 to-dark-900';

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Profile Card ── */}
      <div className="card overflow-hidden">
        <div className={`h-32 bg-gradient-to-br ${coverGradient} relative`}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #7c5ff5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #22d3ee 0%, transparent 40%)' }} />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-dark-900 overflow-hidden bg-dark-800 flex-shrink-0">
                {avatarUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-dark-800">
                    <span className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img src={avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
                )}
              </div>
              {isMe && (
                <>
                  <button onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiCamera className="w-6 h-6 text-white" />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              {isMe ? (
                editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="btn-ghost py-1.5 px-3 flex items-center gap-1 text-sm">
                      <HiX className="w-4 h-4" /> Cancel
                    </button>
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary py-1.5 px-4 flex items-center gap-1.5 text-sm">
                      <HiCheck className="w-4 h-4" />
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn-secondary py-1.5 px-4 flex items-center gap-1.5 text-sm">
                    <HiPencil className="w-4 h-4" /> Edit Profile
                  </button>
                )
              ) : (
                <>
                  <button onClick={() => navigate(`/messages/${profileId}`)} className="btn-secondary py-1.5 px-4 flex items-center gap-1.5 text-sm">
                    <HiMail className="w-4 h-4" /> Message
                  </button>
                  <button onClick={handleFollow}
                    className={`py-1.5 px-5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all ${following ? 'btn-secondary' : 'btn-primary'}`}>
                    {following
                      ? <><HiUserRemove className="w-4 h-4" /> Following</>
                      : <><HiUserAdd className="w-4 h-4" /> Follow</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="label text-xs">Display Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input font-semibold" placeholder="Your name" />
              </div>
              <div>
                <label className="label text-xs">Bio</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="input resize-none h-20 text-sm" placeholder="Tell people about yourself…" />
              </div>
              <div>
                <label className="label text-xs">Website</label>
                <input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} className="input text-sm" placeholder="https://yoursite.com" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                {profile.followersCount > 1000 && (
                  <HiBadgeCheck className="w-5 h-5 text-brand-400" title="Popular creator" />
                )}
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r ${roleColor} capitalize`}>
                {profile.role} · {profile.category}
              </span>
              {profile.bio && <p className="text-gray-300 text-sm leading-relaxed mt-2">{profile.bio}</p>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-400 text-sm hover:text-brand-300 transition-colors">
                  <HiGlobe className="w-4 h-4" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-white/08">
            {[
              { label: 'Posts',     value: profile.postsCount ?? posts.length, clickable: false },
              { label: 'Followers', value: profile.followersCount ?? 0,        clickable: true, type: 'followers' },
              { label: 'Following', value: profile.followingCount ?? 0,        clickable: true, type: 'following' },
            ].map(({ label, value, clickable, type }) => (
              <div key={label}
                onClick={clickable ? () => setFollowModal({ open: true, type }) : undefined}
                className={`text-center py-3 rounded-xl bg-white/[0.03] transition-colors ${
                  clickable ? 'hover:bg-white/[0.07] cursor-pointer hover:ring-1 hover:ring-brand-500/30' : ''
                }`}>
                <p className="text-xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>
                <p className={`text-xs mt-0.5 ${clickable ? 'text-brand-400' : 'text-gray-500'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Posts Section ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <HiPhotograph className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-semibold text-white">Posts</h2>
          <span className="px-2 py-0.5 rounded-full bg-white/08 text-gray-400 text-xs font-medium">{posts.length}</span>
        </div>

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <HiPhotograph className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No posts yet</p>
            {isMe && <p className="text-gray-600 text-xs mt-1">Share your first post from the Feed!</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <ProfilePostCard key={post._id} post={post} isMe={isMe} onDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>

      <FollowListModal
        isOpen={followModal.open}
        onClose={() => setFollowModal(prev => ({ ...prev, open: false }))}
        userId={profileId}
        type={followModal.type}
        userName={profile?.name}
      />
    </div>
  );
};

export default Profile;
