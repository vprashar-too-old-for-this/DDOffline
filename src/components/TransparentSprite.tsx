import React, { useEffect, useState, useRef } from 'react';

interface TransparentSpriteProps {
  src: string;
  className?: string;
  alt?: string;
}

export function TransparentSprite({ src, className, alt = "Sprite" }: TransparentSpriteProps) {
  const [processedSrc, setProcessedSrc] = useState<string>(src);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal logic
        // Targeting white/grey checkerboard patterns usually found in some asset previews
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If the pixel is close to white (255) or the light grey (usually around 204 or 239)
          const isWhite = r > 240 && g > 240 && b > 240;
          const isGrey = r > 190 && r < 225 && g > 190 && g < 225 && b > 190 && b < 225 && Math.abs(r-g) < 10 && Math.abs(g-b) < 10;
          
          if (isWhite || isGrey) {
            data[i + 3] = 0; // Set alpha to 0
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL());
      } catch (e) {
        console.warn("Could not process image for transparency (likely CORS):", src);
      }
    };
  }, [src]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <img src={processedSrc} className={className} alt={alt} referrerPolicy="no-referrer" />
    </>
  );
}
