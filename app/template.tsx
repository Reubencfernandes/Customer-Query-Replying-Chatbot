'use client';

import * as React from 'react';
import { motion } from 'motion/react';

/**
 * App-level template re-mounts on every route change, so animating its mount
 * gives a smooth cross-route transition (e.g. / → /chat) without needing the
 * experimental React <ViewTransition> component.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
