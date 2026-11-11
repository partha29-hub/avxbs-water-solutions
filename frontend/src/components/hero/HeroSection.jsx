
import React from 'react';
import AnimatedHeadline from './AnimatedHeadline';
import AutoVideoPlayer from './AutoVideoPlayer';

export default function HeroSection({ selectedType, onSelectType }) {
  return (
    <section className="hero-banner-section">

      {/* Full Width Video */}
      <div className="hero-full-video">
        <AutoVideoPlayer />
      </div>

      {/* Text Below Video */}
      <div className="hero-content-below-video">
        <AnimatedHeadline />
      </div>

    </section>
  );
}
