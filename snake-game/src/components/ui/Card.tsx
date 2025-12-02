// ==========================================
// Card Component - Game Boy styled container
// ==========================================

'use client';

import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <div className="card-header">{title}</div>}
      {children}
    </div>
  );
}

