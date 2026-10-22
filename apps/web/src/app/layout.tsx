import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Apex Motors — Enterprise Dealership CRM & Management Platform',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        {/* Critical CSS fallback to guarantee immediate styling on any browser or reload */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font: 'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --bg: #FFFFFF;
                --solid: #FFFFFF;
                --float: #FAFBF9;
                --text: #17191A;
                --muted: #5E6360;
                --line: rgba(30, 68, 59, 0.08);
                --pearl-green: #234E43;
                --dock: #1E443B;
                --dock-gradient: linear-gradient(180deg, #26554A 0%, #173830 100%);
                --pill: #1E443B;
                --on-pill: #FFFFFF;
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
