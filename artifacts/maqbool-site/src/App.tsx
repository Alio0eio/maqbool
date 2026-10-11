import { MotionConfig } from 'framer-motion';

import { Nav } from '@/components/nav';
import { Hero } from '@/components/hero';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Hero />
      </main>
    </MotionConfig>
  );
}
