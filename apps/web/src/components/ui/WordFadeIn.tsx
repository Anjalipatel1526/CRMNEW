'use client';

import React from 'react';

interface WordFadeInProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
  baseDelay?: number;
  staggerDelay?: number;
  as?: React.ElementType;
}

/**
 * WordFadeIn Component
 * Renders words one by one through a smooth, staggered fade-in entrance animation.
 */
export function WordFadeIn({
  children,
  text,
  className = '',
  style = {},
  baseDelay = 0.08,
  staggerDelay = 0.045,
  as: Component = 'span',
}: WordFadeInProps) {
  const content = text || (typeof children === 'string' ? children : '');

  if (!content) {
    return <Component className={className} style={style}>{children}</Component>;
  }

  const words = content.split(' ');

  return (
    <Component className={`fade-words-container ${className}`} style={{ display: 'inline', ...style }}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="fade-word"
          style={{
            display: 'inline-block',
            animation: 'wordFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: `${(baseDelay + idx * staggerDelay).toFixed(3)}s`,
            marginRight: idx < words.length - 1 ? '0.28em' : 0,
          }}
        >
          {word}
        </span>
      ))}
    </Component>
  );
}
