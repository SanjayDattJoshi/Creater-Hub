import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import Loader from '../components/common/Loader';
import { HiSearch, HiGlobe, HiUsers, HiHashtag, HiUserCircle } from 'react-icons/hi';

const HASHTAG_CATEGORIES = ['fashion','tech','food','travel','fitness','beauty','gaming','education','lifestyle'];
const CREATOR_ROLES = ['All','creator','brand'];
const CREATOR_CATEGORIES = ['fashion','tech','food','travel','fitness','beauty','gaming','education','lifestyle'];

/* ── Creator Card ───────────────────────────────────────────── */
const CreatorCard = ({ user }) => (
  <Link
    to={`/profile/${user._id}`}
    className="card-hover p-4 flex items-center gap-4 animate-fade-in"
  >
    {user.avatar ? (
      <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-brand-500/40 flex-shrink-0" />
    ) : (
      <div className="w-14 h-14 rounded-full bg-dark-700 border-2 border-brand-500/30 flex items-center justify-center flex-shrink-0">
        <HiUserCircle className="w-9 h-9 text-gray-500" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-white truncate">{user.name}</p>
        <span className={`badge text-xs ${user.role === 'brand' ? 'badge-yellow' : 'badge-brand'} capitalize`}>
          {user.role}
        </span>
        {user.category && (
          <span className="badge badge-gray text-xs capitalize">#{user.category}</span>
        )}
      </div>
      {user.bio && (
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{user.bio}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        {user.followersCount ?? 0} followers
      </p>
    </div>
    <span className="text-xs text-brand-400 font-medium flex-shrink-0">View →</span>
  </Link>
);

/* ── Main Component ─────────────────────────────────────────── */
const Explore = () => {
  const [tab, setTab] = useState('posts');

  /* Posts state */
  const [posts, setPosts]               = useState([]);
  const [hashtag, setHashtag]           = useState('');
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsSearched, setPostsSearched] = useState(false);

  /* Creators state */
  const [creators, setCreators]             = useState([]);
  const [creatorQuery, setCreatorQuery]     = useState('');
  const [roleFilter, setRoleFilter]         = useState('All');
  const [catFilter, setCatFilter]           = useState('');
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [creatorsSearched, setCreatorsSearched] = useState(false);

  /* ── Post search ── */
  const fetchPosts = async (tag = '') => {
    setPostsLoading(true);
    setPostsSearched(true);
    try {
      const url = tag ? `/posts?hashtag=${tag}&limit=12` : '/posts?limit=12';
      const { data } = await api.get(url);
      setPosts(data.posts ?? []);
    } catch { /* silent */ }
    finally { setPostsLoading(false); }
  };

  const handlePostSearch = (e) => {
    e.preventDefault();
    fetchPosts(hashtag.replace('#', '').trim());
  };

  /* ── Creator search ── */
  const fetchCreators = async (q = creatorQuery, role = roleFilter, cat = catFilter) => {
    setCreatorsLoading(true);
    setCreatorsSearched(true);
    try {
      const params = new URLSearchParams();
      if (q.trim())       params.set('q', q.trim());
      if (role !== 'All') params.set('role', role);
      if (cat)            params.set('category', cat);
      const { data } = await api.get(`/users/search?${params.toString()}`);
      setCreators(data.users ?? []);
    } catch { /* silent */ }
    finally { setCreatorsLoading(false); }
  };

  const handleCreatorSearch = (e) => {
    e.preventDefault();
    fetchCreators();
  };

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        tab === id
          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
          : 'text-gray-400 hover:text-white hover:bg-dark-700 border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HiGlobe className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Explore</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabBtn id="posts"    icon={HiHashtag} label="Posts" />
        <TabBtn id="creators" icon={HiUsers}   label="Creators" />
      </div>

      {/* ── POSTS TAB ── */}
      {tab === 'posts' && (
        <div className="space-y-5 animate-fade-in">
          <form onSubmit={handlePostSearch} className="flex gap-3">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="Search by hashtag…"
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary px-8">Search</button>
          </form>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fetchPosts('')}
              className="badge badge-brand cursor-pointer hover:opacity-80 transition-opacity px-3 py-1 text-xs"
            >
              All
            </button>
            {HASHTAG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setHashtag(cat); fetchPosts(cat); }}
                className="badge badge-gray cursor-pointer hover:text-brand-300 transition-all px-3 py-1 capitalize text-xs"
              >
                #{cat}
              </button>
            ))}
          </div>

          {postsLoading ? <Loader /> :
           !postsSearched ? (
            <div className="card p-10 text-center">
              <HiSearch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Search by hashtag or browse by category</p>
            </div>
           ) : posts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400">No posts found for this hashtag</p>
            </div>
           ) : (
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => <PostCard key={post._id} post={post} compact />)}
            </div>
           )}
        </div>
      )}

      {/* ── CREATORS TAB ── */}
      {tab === 'creators' && (
        <div className="space-y-5 animate-fade-in">
          <form onSubmit={handleCreatorSearch} className="flex gap-3">
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                value={creatorQuery}
                onChange={(e) => setCreatorQuery(e.target.value)}
                placeholder="Search creators by name…"
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary px-8">Search</button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1.5">
              {CREATOR_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); fetchCreators(creatorQuery, r, catFilter); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    roleFilter === r
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'border-dark-600 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <select
              value={catFilter}
              onChange={(e) => { setCatFilter(e.target.value); fetchCreators(creatorQuery, roleFilter, e.target.value); }}
              className="input py-1.5 text-xs"
              style={{ width: 'auto', paddingLeft: '0.75rem', paddingRight: '2rem' }}
            >
              <option value="">All categories</option>
              {CREATOR_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>

            <button
              onClick={() => { setCreatorQuery(''); setRoleFilter('All'); setCatFilter(''); fetchCreators('', 'All', ''); }}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Browse all →
            </button>
          </div>

          {creatorsLoading ? <Loader /> :
           !creatorsSearched ? (
            <div className="card p-10 text-center">
              <HiUsers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Search by name, or filter by role &amp; category</p>
            </div>
           ) : creators.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400">No creators found</p>
            </div>
           ) : (
            <div className="grid grid-cols-1 gap-3">
              {creators.map((u) => <CreatorCard key={u._id} user={u} />)}
            </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Explore;