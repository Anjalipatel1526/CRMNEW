'use client';

import React from 'react';

export function numberToWordsINR(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  num = Math.floor(num);
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n > 19) {
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    }
    return a[n];
  };

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;
  const rem = num;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (hundred > 0) res += inWords(hundred) + 'Hundred ';
  if (rem > 0) {
    if (res !== '') res += 'and ';
    res += inWords(rem);
  }
  return res.trim() + ' Rupees Only';
}

export function ExecutiveSignatureSvg({
  color = '#0F172A',
  width = 145,
  height = 50,
}: {
  color?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <path
        d="M 12 42 C 22 18, 32 8, 44 14 C 54 20, 52 44, 38 46 C 24 48, 16 28, 30 18 C 45 6, 68 8, 86 22 C 98 32, 114 36, 134 18"
        stroke={color}
        strokeWidth="3.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 32 26 C 52 24, 76 22, 98 25" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 62 44 C 84 41, 112 39, 138 42" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 124 22 C 132 16, 142 22, 138 32 C 134 40, 120 44, 110 40" stroke={color} strokeWidth="2.0" strokeLinecap="round" />
    </svg>
  );
}

export function extractBrandColorFromLogo(logoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !logoUrl) {
      resolve('#6253F8');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#6253F8');
          return;
        }

        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets: Record<string, { count: number; r: number; g: number; b: number }> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a < 100) continue;

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          if (r > 220 && g > 220 && b > 220) continue;
          if (r < 35 && g < 35 && b < 35) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 25) continue;

          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { count: 1, r: qr, g: qg, b: qb };
          } else {
            colorBuckets[key].count++;
          }
        }

        const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);
        if (sorted.length > 0) {
          const best = sorted[0];
          const hex = `#${((1 << 24) + (best.r << 16) + (best.g << 8) + best.b).toString(16).slice(1)}`;
          resolve(hex);
        } else {
          resolve('#6253F8');
        }
      } catch {
        resolve('#6253F8');
      }
    };
    img.onerror = () => resolve('#6253F8');
    img.src = logoUrl;
  });
}

export function getInvoiceColorSystem(brandColor: string = '#6253F8') {
  const hex = (brandColor || '#6253F8').trim();
  const lower = hex.toLowerCase();

  const isPurple =
    lower.includes('6253') ||
    lower.includes('7c3a') ||
    lower.includes('6366') ||
    lower.includes('4f46') ||
    lower.includes('8b5cf6') ||
    lower === '#6253f8';

  const isOrange =
    lower.includes('ea58') ||
    lower.includes('f27a') ||
    lower.includes('f973') ||
    lower.includes('c241') ||
    lower.includes('d977') ||
    lower === '#f27a1a' ||
    lower === '#ea580c';

  const isBlue =
    lower.includes('0284') ||
    lower.includes('2563') ||
    lower.includes('1d4e') ||
    lower.includes('3b82') ||
    lower.includes('0ea5');

  const isGreen =
    lower.includes('0596') ||
    lower.includes('10b9') ||
    lower.includes('16a3') ||
    lower.includes('1580');

  if (isPurple) {
    return { graphicAccent: '#6253F8', textAccent: '#4338CA', lightTint: '#EEF2FF', borderTint: '#C7D2FE' };
  }
  if (isOrange) {
    return { graphicAccent: '#EA580C', textAccent: '#C2410C', lightTint: '#FFF7ED', borderTint: '#FED7AA' };
  }
  if (isBlue) {
    return { graphicAccent: '#0284C7', textAccent: '#0369A1', lightTint: '#F0F9FF', borderTint: '#BAE6FD' };
  }
  if (isGreen) {
    return { graphicAccent: '#059669', textAccent: '#047857', lightTint: '#ECFDF5', borderTint: '#A7F3D0' };
  }
  return { graphicAccent: hex, textAccent: hex, lightTint: '#F8FAFC', borderTint: '#CBD5E1' };
}

