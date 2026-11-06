import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'UNAI CRM — Enterprise Dealership CRM & Management Platform',
  description: 'Complete multi-tenant car dealership CRM, vehicle inventory, sales desk, finance, delivery, and after-sales platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Font Origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload primary font file directly to eliminate chained network requests */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iPhg45P66jSgqdTbtPE.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Non-render-blocking font stylesheet loading */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap"
          />
        </noscript>

        {/* Critical CSS fallback with inlined @font-face to guarantee immediate render without blocking */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Urbanist';
                font-style: normal;
                font-weight: 300 900;
                font-display: swap;
                src: url('https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iPhg45P66jSgqdTbtPE.woff2') format('woff2');
                unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
              }
              :root {
                --font: 'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --bg: #FFFFFF;
                --solid: #FFFFFF;
                --float: #FAFBF9;
                --text: #17191A;
                --muted: #5E6360;
                --line: rgba(98, 83, 248, 0.10);
                --pearl-green: #6253F8;
                --dock: #18153B;
                --dock-gradient: linear-gradient(135deg, #7957F6 0%, #6253F8 50%, #4054F5 100%);
                --pill: #6253F8;
                --on-pill: #FFFFFF;
                --primary-gradient: linear-gradient(135deg, #7957F6 0%, #6253F8 50%, #4054F5 100%);
                --tomato: #C8431F;
                --butter: #F2C94C;
                --r-card: 26px;
                --r-tile: 20px;
                --r-ctl: 999px;
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              html, body {
                font-family: var(--font);
                background-color: #FFFFFF;
                background-image: 
                  radial-gradient(at 0% 0%, #F4F7F5 0px, transparent 50%),
                  radial-gradient(at 100% 0%, #F7F5F2 0px, transparent 50%),
                  radial-gradient(at 50% 100%, #F2F5F8 0px, transparent 40%),
                  linear-gradient(180deg, #FFFFFF 0%, #F8FAF9 100%);
                background-attachment: fixed;
                color: #17191A;
                margin: 0;
                padding: 0;
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
                -webkit-font-smoothing: antialiased;
              }
              .app-shell {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
                box-sizing: border-box;
              }
              .app-main {
                width: 100%;
                max-width: 1480px;
                margin: 0 auto;
                padding: 16px 24px 48px;
                box-sizing: border-box;
                overflow-x: hidden;
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
