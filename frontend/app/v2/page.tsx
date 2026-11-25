'use client';

import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import HorizontalLanding from '@/components/landing/HorizontalLanding';
import { warmUpApi } from '@/lib/api';
import { track } from '@/lib/analytics';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nestora',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description: 'Concept house designs for Indian families: four options that follow the building rules, a 3D walk-through and a cost estimate.',
};

export default function LandingV2() {
  useEffect(() => {
    warmUpApi();
    track('landing_view');
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HorizontalLanding variant="v2" />
    </MotionConfig>
  );
}
