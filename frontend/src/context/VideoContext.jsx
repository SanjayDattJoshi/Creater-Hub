import { createContext, useContext, useRef } from 'react';

/**
 * VideoContext
 * -----------
 * Keeps a ref to whichever <video> element is currently playing.
 * Any VideoPlayer that starts playback calls `setActiveVideo(videoEl)`;
 * the context pauses the previous player before updating the ref.
 *
 * Using a plain ref (not state) means zero re-renders on video switches —
 * only the two affected VideoPlayer components update themselves via their
 * own onPlay / onPause handlers.
 */
const VideoContext = createContext(null);

export const VideoProvider = ({ children }) => {
  const activeVideoRef = useRef(null);

  /**
   * Call this when a video begins playing.
   * Pauses whichever video was playing before (if different).
   */
  const setActiveVideo = (videoEl) => {
    const previous = activeVideoRef.current;
    if (previous && previous !== videoEl && !previous.paused) {
      previous.pause();
    }
    activeVideoRef.current = videoEl;
  };

  return (
    <VideoContext.Provider value={{ setActiveVideo }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideo must be used inside VideoProvider');
  return ctx;
};

export default VideoContext;
