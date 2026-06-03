import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { format } from 'timeago.js';
import { HiChatAlt2, HiPaperAirplane, HiPencilAlt, HiX, HiSearch } from 'react-icons/hi';

const Messages = () => {
  const { userId: activeId } = useParams();
  const { user: me } = useAuth();

  const [inbox, setInbox]               = useState([]);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [activePartner, setActivePartner] = useState(null);

  // New conversation panel
  const [showNewChat, setShowNewChat]   = useState(false);
  const [following, setFollowing]       = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followSearch, setFollowSearch] = useState('');

  const bottomRef = useRef(null);

  // Load inbox
  useEffect(() => {
    api.get('/messages/inbox').then(({ data }) => {
      setInbox(data.conversations);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load conversation from URL param
  useEffect(() => {
    if (activeId) loadConversation(activeId);
  }, [activeId]);

  const loadConversation = async (partnerId) => {
    try {
      const [msgRes, userRes] = await Promise.all([
        api.get(`/messages/conversation/${partnerId}`),
        api.get(`/users/${partnerId}`),
      ]);
      setMessages(msgRes.data.messages);
      setActivePartner(userRes.data.user);
      setShowNewChat(false);
    } catch { /* silent */ }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load following list when compose panel opens
  useEffect(() => {
    if (!showNewChat || !me?._id) return;
    setFollowLoading(true);
    api.get(`/users/${me._id}/following`)
      .then(({ data }) => setFollowing(data.following || []))
      .catch(() => setFollowing([]))
      .finally(() => setFollowLoading(false));
  }, [showNewChat, me?._id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/send/${activePartner._id}`, { content: text });
      setMessages((prev) => [...prev, data.message]);
      setText('');
      // Refresh inbox so new conversation appears
      api.get('/messages/inbox').then(({ data }) => setInbox(data.conversations));
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const startChat = (person) => {
    setActivePartner(person);
    loadConversation(person._id);
    setShowNewChat(false);
    setFollowSearch('');
  };

  const filteredFollowing = following.filter((f) =>
    f.name?.toLowerCase().includes(followSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">

      {/* ── Inbox sidebar ── */}
      <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiChatAlt2 className="w-5 h-5 text-brand-400" />
            <h2 className="font-semibold text-white">Messages</h2>
          </div>
          {/* Compose button */}
          <button
            onClick={() => { setShowNewChat(true); setActivePartner(null); }}
            title="New message"
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-300 hover:bg-white/5 transition-colors"
          >
            <HiPencilAlt className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? <Loader size="sm" /> : inbox.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8 px-4">
              <HiChatAlt2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-brand-400 hover:text-brand-300 text-xs underline underline-offset-2"
              >
                Start a new chat
              </button>
            </div>
          ) : inbox.map(({ partner, lastMessage, unread }) => (
            <button
              key={partner?._id}
              onClick={() => { setActivePartner(partner); loadConversation(partner._id); setShowNewChat(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left ${activePartner?._id === partner?._id && !showNewChat ? 'bg-white/5' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={partner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name || 'U')}&background=7c6fef&color=fff`}
                  className="w-10 h-10 rounded-full" alt={partner?.name}
                />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center font-bold">{unread}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{partner?.name}</p>
                <p className="text-xs text-gray-400 truncate">{lastMessage?.content}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">{format(lastMessage?.createdAt)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 card overflow-hidden flex flex-col">

        {/* NEW CHAT panel — shows following list */}
        {showNewChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-white">
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search inside following */}
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <input
                  value={followSearch}
                  onChange={(e) => setFollowSearch(e.target.value)}
                  placeholder="Search people you follow…"
                  className="input py-2 w-full"
                  style={{ paddingLeft: '2.25rem' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {followLoading ? (
                <Loader size="sm" />
              ) : filteredFollowing.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-12">
                  <p>{following.length === 0 ? "You're not following anyone yet." : 'No results found.'}</p>
                  {following.length === 0 && (
                    <p className="mt-1 text-xs">Follow creators or brands to message them.</p>
                  )}
                </div>
              ) : filteredFollowing.map((person) => (
                <button
                  key={person._id}
                  onClick={() => startChat(person)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                >
                  <img
                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'U')}&background=7c6fef&color=fff`}
                    className="w-11 h-11 rounded-full flex-shrink-0 object-cover"
                    alt={person.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{person.role}{person.category ? ` · ${person.category}` : ''}</p>
                  </div>
                  <span className="text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Message →
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : !activePartner ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <HiChatAlt2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="mb-3">Select a conversation or start a new one</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary px-5 py-2 text-sm flex items-center gap-2 mx-auto"
              >
                <HiPencilAlt className="w-4 h-4" /> New Message
              </button>
            </div>
          </div>
        ) : (
          /* Active conversation */
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Link to={`/profile/${activePartner._id}`}>
                <img
                  src={activePartner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=7c6fef&color=fff`}
                  className="w-9 h-9 rounded-full" alt={activePartner.name}
                />
              </Link>
              <div>
                <p className="font-semibold text-white text-sm">{activePartner.name}</p>
                <p className="text-xs text-brand-400 capitalize">{activePartner.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.map((msg) => {
                const isMe = msg.sender?._id === me?._id || msg.sender === me?._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-gradient-brand text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-gray-500'}`}>{format(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message ${activePartner.name}…`}
                className="input flex-1 py-2.5"
              />
              <button type="submit" disabled={sending || !text.trim()}
                className="btn-primary px-4 py-2.5 flex items-center gap-2 disabled:opacity-50">
                <HiPaperAirplane className="w-5 h-5 rotate-90" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;