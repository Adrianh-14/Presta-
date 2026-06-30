import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

export default function MediaViewer({ src, type = 'image', className = '' }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div className={`relative group cursor-pointer ${className}`} onClick={() => setFullscreen(true)}>
        {type === 'video' ? (
          <video src={src} className="w-full h-full object-contain rounded-lg border border-gray-200" />
        ) : (
          <img src={src} alt="" className="w-full h-full object-contain rounded-lg border border-gray-200" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
          <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={28} className="text-white" />
          </button>
          {type === 'video' ? (
            <video
              src={src}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={src}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}
