import { useState, useEffect } from 'react';

interface CRTImageProps {
  src: string;
  alt: string;
  className?: string;
  seed?: number;
}

export function CRTImage({ src, alt, className = '' }: CRTImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-pip-bgdark ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="scan-sweep" />
          <div className="text-pip-green text-glow text-xs animate-pulse-slow no-select">
            ДЕКОДИРОВАНИЕ ВИДЕОСИГНАЛА...
          </div>
          <div className="mt-2 text-pip-greendark text-[10px] no-select">
            ◆ ◆ ◆ СКАНИРОВАНИЕ ◆ ◆ ◆
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-pip-red text-glow-red text-xs no-select">
            ОШИБКА СИГНАЛА
          </div>
        </div>
      )}
      {loaded && (
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
