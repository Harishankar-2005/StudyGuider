import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "./ui/Toast";
import "./Layout.css";

// Scrolls to top on every route change (standard SPA behaviour).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Shared app shell: ambient background + sidebar + topbar + page content.
// Note: sidebar links call onClose themselves, so no route-change effect
// is needed to manage the mobile drawer.
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <ToastProvider>
      <ScrollToTop />
      <div className="layout">
        {/* Ambient floating orbs behind everything */}
        <div className="ambient" aria-hidden="true">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
        </div>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="page">
            <div key={pathname} className="page-transition">
              <Outlet />
            </div>
          </main>
          <footer className="footer">
            <span className="footer-dot" />
            StudyGuider · Premium demo — sample data only, AI + backend arrive later
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}

export default Layout;
