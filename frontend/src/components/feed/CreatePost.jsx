import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { HiPhotograph, HiX, HiUserCircle, HiVideoCamera } from 'react-icons/hi';

const CreatePost = ({ onCreated }) => {
  const { user } = useAuth();
  const [caption, setCaption]   = useState('');
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100MB.');
      return;
    }
    setError('');
    setFile(selected);
    setPreview({ url: URL.createObjectURL(selected), type: selected.type });
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError('');
    setProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Allow text-only OR media post
    if (!file && !caption.trim()) {
      setError('Write something or attach a photo/video.');
      return;
    }
    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const form = new FormData();
      form.append('caption', caption);
      if (file) form.append('media', file);

      const { data } = await api.post('/posts', form, {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      onCreated?.(data.post);
      setCaption('');
      setFile(null);
      setPreview(null);
      setProgress(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');
  const canPost = !loading && (!!file || caption.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex gap-3">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <HiUserCircle className="w-10 h-10 text-gray-500 flex-shrink-0" />
        )}
        <div className="flex-1">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share something with your network…"
            rows={3}
            className="w-full bg-dark-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm resize-none border border-dark-600 focus:outline-none focus:border-brand-500 transition-colors"
          />

          {/* Preview */}
          {preview && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <div className="relative">
                {preview.type.startsWith('video') ? (
                  <video src={preview.url} className="h-32 rounded-lg" controls muted />
                ) : (
                  <img src={preview.url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                )}
                <button type="button" onClick={removeFile} className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5">
                  <HiX className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {loading && progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{isVideo ? 'Uploading video…' : 'Uploading…'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { fileRef.current.accept = 'image/*'; fileRef.current?.click(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors"
              >
                <HiPhotograph className="w-5 h-5" /> Photo
              </button>
              <button
                type="button"
                onClick={() => { fileRef.current.accept = 'video/*'; fileRef.current?.click(); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors"
              >
                <HiVideoCamera className="w-5 h-5" /> Video
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />

            <button type="submit" disabled={!canPost} className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50">
              {loading ? (progress > 0 ? `${progress}%` : 'Posting…') : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreatePost;
