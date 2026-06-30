import { BrowserRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import { AuthProvider } from "./hooks/useAuth";
import { trackPageview } from "./lib/analytics";
import i18n from "./i18n";

function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview();
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <PageviewTracker />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;