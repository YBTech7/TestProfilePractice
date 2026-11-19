import React from 'react';
import { BRAND_EMBLEM_URL, resolveAssetUrl } from '../data/profileData';

interface BrandMarkProps {
  customLogoUrl?: string | null;
  size?: number;
  className?: string;
  decorative?: boolean;
  alt?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  customLogoUrl,
  size = 36,
  className = '',
  decorative = true,
  alt = 'Pio Languisan monogram',
}) => {
  const isCustom = Boolean(customLogoUrl);
  const src = customLogoUrl || resolveAssetUrl(BRAND_EMBLEM_URL);

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      width={size}
      height={size}
      decoding="async"
      referrerPolicy={isCustom ? 'no-referrer' : undefined}
      className={`block shrink-0 object-contain ${isCustom ? 'rounded-md' : ''} ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
};
