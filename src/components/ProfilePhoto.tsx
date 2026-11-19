import React, { useState } from "react";
import "../styles/profile-photo.css";

interface ProfilePhotoProps {
  className?: string;
  priority?: boolean;
  alt?: string;
}

export default function ProfilePhoto({
  className = "",
  priority = false,
  alt = "Portrait of Pio Languisan",
}: ProfilePhotoProps) {
  const [hasError, setHasError] = useState(false);

  const imagePath = `${import.meta.env.BASE_URL}assets/images/portrait-pio-languisan.png`;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label="Missing portrait photograph of Pio Languisan"
        className="profile-photo-container"
      >
        <div className="profile-photo-frame px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#F5F2EB]">
            Portrait photograph unavailable
          </p>
          <p className="mt-2 font-mono text-xs text-[#DFC585]">
            public/assets/images/portrait-pio-languisan.png
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-photo-container">
      <div className="profile-photo-frame">
        <img
          src={imagePath}
          alt={alt}
          width={1199}
          height={1312}
          className={`profile-photo ${className}`.trim()}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          onError={() => setHasError(true)}
        />
        <div className="profile-photo-vignette" aria-hidden="true" />
      </div>
    </div>
  );
}
