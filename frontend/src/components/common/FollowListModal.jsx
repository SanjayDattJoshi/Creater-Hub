import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import { HiUserAdd, HiUserRemove } from 'react-icons/hi';

const UserRow = ({ user, onClose }) => {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const isMe = me?._id === user._id;

  const [following, setFollowing] = useState(user.isFollowing || false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!me) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/users/${user._id}/follow`);
      setFollowing(data.isFollowing);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleVisit = () => {
    navigate(`/profile/${user._id}`);
    onClose();
  };

  const avatarSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c6fef&color=fff&size=64`;

  const roleColor =
    user.role === 'brand'
      ? 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-300'
      : 'from-brand-500/20 to-pink-500/10 border-brand-500/30 text-brand-300';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
      onClick={handleVisit}
    >
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-dark-700 ring-1 ring-white/10">
        <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
          {user.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-gradient-to-r ${roleColor} capitalize`}>
            {user.role}
          </span>
          {user.bio && (
            <span className="text-xs text-gray-500 truncate max-w-[140px]">{user.bio}</span>
          )}
        </div>
      </div>

      {me && !isMe && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`flex-shrink-0 flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            following ? 'btn-secondary' : 'btn-primary'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {following
            ? <><HiUserRemove className="w-3.5 h-3.5" /> Following</>
            : <><HiUserAdd className="w-3.5 h-3.5" /> Follow</>}
        </button>
      )}
    </div>
  );
};

const FollowListModal = ({ isOpen, onClose, userId, type, userName }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = type === 'followers'
          ? `/users/${userId}/followers`
          : `/users/${userId}/following`;
        const { data } = await api.get(endpoint);
        setList(type === 'followers' ? data.followers : data.following || []);
      } catch {
        setError('Failed to load list. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [isOpen, userId, type]);

  const title = type === 'followers'
    ? `${userName ? userName + "'s " : ''}Followers`
    : `${userName ? userName + ' is ' : ''}Following`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-400 py-8">{error}</p>
      ) : list.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400 text-sm font-medium">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {type === 'followers' ? 'Share the profile to gain followers!' : 'Explore creators to follow.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1 -mx-2">
          {list.map((user) => (
            <UserRow key={user._id} user={user} onClose={onClose} />
          ))}
        </div>
      )}
    </Modal>
  );
};

export default FollowListModal;