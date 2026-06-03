import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import PostCard   from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import Loader     from '../components/common/Loader';
import { HiSparkles } from 'react-icons/hi';

const Feed = () => {
  const [posts, setPosts]     = useState([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/posts/feed?page=${pageNum}&limit=10`);
      setPosts((prev) => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(pageNum < data.pages);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(1, true); }, [fetchFeed]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFeed(next);
  };

  const handlePostCreated = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handlePostUpdated = (updated) => setPosts((prev) => prev.map((p) => p._id === updated._id ? updated : p));
  const handlePostDeleted = (id)      => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <HiSparkles className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Your Feed</h1>
      </div>

      {/* Create post */}
      <CreatePost onCreated={handlePostCreated} />

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <Loader text="Loading your feed…" />
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🌟</p>
          <p className="text-gray-300 font-semibold">Your feed is empty</p>
          <p className="text-gray-500 text-sm mt-1">Follow creators and brands to see their posts here.</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
          ))}
          {hasMore && (
            <button onClick={loadMore} disabled={loading} className="btn-secondary w-full">
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;
