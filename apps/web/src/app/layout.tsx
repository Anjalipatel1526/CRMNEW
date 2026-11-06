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

        {/* Critical CSS fallback to guarantee immediate render without blocking */}
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
              /* Top Bar Skeleton: Locks height and layout before external CSS loads to guarantee 0.000 CLS */
              .top-bar {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                height: 52px !important;
                min-height: 52px !important;
                margin-bottom: 22px !important;
                gap: 16px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                flex-wrap: nowrap !important;
              }
              .brand-link {
                display: inline-flex !important;
                align-items: center !important;
                gap: 10px !important;
                text-decoration: none !important;
                flex-shrink: 0 !important;
              }
              .brand-logo-img {
                width: 34px !important;
                height: 34px !important;
                border-radius: 9px !important;
                object-fit: contain !important;
                display: block !important;
              }
              .brand-title {
                font-size: 1.15rem !important;
                font-weight: 800 !important;
                color: #17191A !important;
                letter-spacing: -0.02em !important;
                white-space: nowrap !important;
              }
              .nav-pills {
                display: flex !important;
                align-items: center !important;
                gap: 2px !important;
                flex: 1 1 auto !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                list-style: none !important;
                margin: 0 !important;
                padding: 0 !important;
                height: 42px !important;
              }
              .nav-pill {
                display: inline-flex !important;
                align-items: center !important;
                white-space: nowrap !important;
                text-decoration: none !important;
                font-size: 0.82rem !important;
                padding: 6px 11px !important;
              }
              .top-bar__right {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                flex-shrink: 0 !important;
              }
              /* Eliminate Cumulative Layout Shift (CLS) on desktop & mobile before external stylesheet loads */
              .mobile-quick-access-wrap,
              .mobile-subpage-back-wrap {
                display: none !important;
              }
              .page-transition-wrap {
                width: 100% !important;
                box-sizing: border-box !important;
              }
              @media (max-width: 768px) {
                .app-main {
                  padding: 12px 14px 40px 14px !important;
                }
                .top-bar {
                  height: auto !important;
                  min-height: auto !important;
                  padding: 4px 0 10px 0 !important;
                  gap: 12px !important;
                  margin-bottom: 8px !important;
                }
                /* Mobile CLS Prevention: Hide desktop nav-pills completely so top bar never collapses */
                .top-bar .nav-pills {
                  display: none !important;
                }
                .brand-logo-img {
                  width: 42px !important;
                  height: 42px !important;
                  border-radius: 12px !important;
                }
                .mobile-quick-access-wrap {
                  display: block !important;
                  padding: 0 0 14px 0 !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                }
                .mobile-quick-access-card {
                  border-radius: 20px !important;
                  padding: 14px 10px !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFF 100%) !important;
                  border: 1.2px solid rgba(98, 83, 248, 0.12) !important;
                }
                .mobile-quick-access-grid {
                  display: grid !important;
                  grid-template-columns: repeat(4, 1fr) !important;
                  gap: 12px 4px !important;
                  width: 100% !important;
                  box-sizing: border-box !important;
                }
                .mobile-qa-item {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: center !important;
                  text-decoration: none !important;
                }
                .mobile-qa-icon-badge {
                  width: 48px !important;
                  height: 48px !important;
                  border-radius: 16px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                .mobile-subpage-back-wrap {
                  display: block !important;
                }
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
