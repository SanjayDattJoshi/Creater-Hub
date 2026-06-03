import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import { HiTrash, HiUserCircle, HiPhotograph } from 'react-icons/hi';

const Posts = () => {
  const [posts, setPosts]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/posts?page=${p}&limit=20`);
      setPosts(data.posts);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this post?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.map((p) => p._id === id ? { ...p, isActive: false } : p));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Posts</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total posts</p>
      </div>

      {loading ? <Loader text="Loading posts…" /> : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className={`card flex gap-4 ${!post.isActive ? 'opacity-50' : ''}`}>
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-dark-700 flex-shrink-0 overflow-hidden">
                {post.media?.[0] ? (
                  <img src={post.media[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiPhotograph className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 line-clamp-2">{post.caption || '(no text)'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    {post.author?.avatar ? (
                      <img src={post.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <HiUserCircle className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-xs text-gray-500">{post.author?.name}</span>
                  </div>
                  <span className="text-xs text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                  {!post.isActive && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Removed</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {post.isActive && (
                <button
                  onClick={() => handleDelete(post._id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 self-start"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button onClick={() => fetchPosts(page - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
                <button onClick={() => fetchPosts(page + 1)} disabled={page === pages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Posts;