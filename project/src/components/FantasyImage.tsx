import { useState, useEffect } from 'react';

interface FantasyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FantasyImage({ src, alt, className = '' }: FantasyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#161922] ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 img-loading flex items-center justify-center">
          <div className="text-[#6a6050] text-xs no-select font-fantasy">Загрузка...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#161922]">
          <div className="text-[#6a6050] text-xs no-select">Изображение недоступно</div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
