import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SiteDetail from "@/pages/SiteDetail";
import CheckinCreate from "@/pages/CheckinCreate";
import Profile from "@/pages/Profile";
import AdminSites from "@/pages/admin/AdminSites";
import AdminSiteEdit from "@/pages/admin/AdminSiteEdit";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminNews from "@/pages/admin/AdminNews";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useState, useEffect, createContext, useContext } from "react";
import { Menu, X, Mountain, User as UserIcon, Settings } from "lucide-react";

// Simple "current user" context (MVP fake login)
interface CurrentUser { id: number; name: string }
export const UserContext = createContext<CurrentUser>({ id: 1, name: "访客" });
export const useCurrentUser = () => useContext(UserContext);

// Dark mode
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark] as const;
}

function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [dark, setDark] = useDarkMode();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "首页", icon: Mountain },
    { href: "/profile/1", label: "我的", icon: UserIcon },
    { href: "/admin/sites", label: "管理", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="石窟打卡">
            <path d="M16 2L4 14v14a2 2 0 002 2h20a2 2 0 002-2V14L16 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 30V20a4 4 0 018 0v10" stroke="currentColor" strokeWidth="2"/>
            <circle cx="16" cy="12" r="3" stroke="hsl(var(--gold))" strokeWidth="2" fill="none"/>
          </svg>
          <span className="font-semibold text-sm tracking-wide">石窟寺院志</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`px-3 py-1.5 rounded text-sm no-underline transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {item.label}
              </Link>
            );
          })}
          <button onClick={() => setDark(!dark)} className="ml-2 p-2 rounded hover:bg-muted transition-colors" aria-label="切换主题">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </nav>

        {/* Mobile nav toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setDark(!dark)} className="p-2 rounded hover:bg-muted transition-colors" aria-label="切换主题">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2" aria-label="菜单">
            {mobileMenu ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenu && (
        <div className="md:hidden border-t bg-background px-4 py-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2 rounded text-sm no-underline hover:bg-muted transition-colors">
                <Icon size={16} className="text-muted-foreground"/>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/sites/:id" component={SiteDetail}/>
      <Route path="/sites/:id/checkin" component={CheckinCreate}/>
      <Route path="/profile/:id" component={Profile}/>
      <Route path="/admin/sites" component={AdminSites}/>
      <Route path="/admin/sites/new" component={AdminSiteEdit}/>
      <Route path="/admin/sites/:id/edit" component={AdminSiteEdit}/>
      <Route path="/admin/sites/:id/events" component={AdminEvents}/>
      <Route path="/admin/sites/:id/media" component={AdminMedia}/>
      <Route path="/admin/sites/:id/news" component={AdminNews}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser] = useState<CurrentUser>({ id: 1, name: "访客" });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserContext.Provider value={currentUser}>
          <Toaster />
          <Router hook={useHashLocation}>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <AppRouter />
              </main>
              <footer className="border-t py-6 text-center text-xs text-muted-foreground">
                <p className="mb-1">石窟寺院志 — 记录我们在石壁与香火之间的足迹</p>
                <PerplexityAttribution />
              </footer>
            </div>
          </Router>
        </UserContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
