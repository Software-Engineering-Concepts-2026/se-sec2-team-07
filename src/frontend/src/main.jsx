import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { router } from './routes';
import '@fontsource-variable/noto-sans-thai/wght.css';
import '@fontsource-variable/inter/wght.css';
import './style.css';
import './workspace.css';
import './reference-theme.css';

createRoot(document.getElementById('root')).render(
  <>
    <Suspense
      fallback={
        <div className="loading" role="status">
          กำลังเปิดหน้า…
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
    {import.meta.env.PROD && <SpeedInsights />}
  </>,
);
