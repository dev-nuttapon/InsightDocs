import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './features/auth/context/AuthProvider';
import { router } from './app/router';
import './app/styles.css';
import { initializeTheme, ThemeProvider } from './theme/ThemeProvider';

initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ThemeProvider>,
);
