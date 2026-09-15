import { cn } from '@/lib/utils';

interface CurvedImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  curveDepth?: number;
  borderRadius?: number;
}

export function CurvedImage({
  src,
  alt,
  className,
  curveDepth = 40,
  borderRadius = 10,
  imageClassName,
}: CurvedImageProps) {
  const cornerPercent = borderRadius / 1000;

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="curved-clip" clipPathUnits="objectBoundingBox">
            <path
              d={`
              M ${cornerPercent},0
              C 0.15,${curveDepth / 1000} 0.35,${curveDepth / 1000} 0.5,${curveDepth / 1000}
              C 0.65,${curveDepth / 1000} 0.85,${curveDepth / 1000} ${1 - cornerPercent},0
              L ${1 - cornerPercent},0
              Q 1,0 1,${cornerPercent}
              L 1,${1 - cornerPercent}
              Q 1,1 ${1 - cornerPercent},1
              C 0.85,${1 - curveDepth / 1000} 0.65,${1 - curveDepth / 1000} 0.5,${1 - curveDepth / 1000}
              C 0.35,${1 - curveDepth / 1000} 0.15,${1 - curveDepth / 1000} ${cornerPercent},1
              L ${cornerPercent},1
              Q 0,1 0,${1 - cornerPercent}
              L 0,${cornerPercent}
              Q 0,0 ${cornerPercent},0
              Z
            `}
              vectorEffect="non-scaling-stroke"
            />
          </clipPath>
        </defs>
      </svg>
      <img
        src={src || '/placeholder.svg'}
        alt={alt}
        className={cn('w-full h-[500px] object-cover object-center', imageClassName)}
        style={{
          clipPath: 'url(#curved-clip)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      />
    </div>
  );
}
