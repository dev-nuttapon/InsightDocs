import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './features/auth/context/AuthProvider';
import { router } from './app/router';
import './app/styles.css';
import { initializeTheme, ThemeProvider } from './theme/ThemeProvider';
import { LanguageProvider } from './i18n/LanguageProvider';

initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>,
);
