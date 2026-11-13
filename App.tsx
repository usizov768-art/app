import { useEffect } from "react";
import { AppProvider, useApp, type Page } from "@/store";
import { initTelegram } from "@/lib/tg";
import { BottomNav, Header, MenuPanel } from "@/components/Shell";
import { Toaster } from "@/components/ui";
import Home from "@/pages/Home";
import Subscription from "@/pages/Subscription";
import Tariffs from "@/pages/Tariffs";
import Balance from "@/pages/Balance";
import Topup from "@/pages/Topup";
import Referrals from "@/pages/Referrals";
import Support from "@/pages/Support";
import Wheel from "@/pages/Wheel";
import Gift from "@/pages/Gift";
import Info from "@/pages/Info";
import Profile from "@/pages/Profile";

const PAGES: Record<Page, () => React.JSX.Element> = {
  home: Home,
  subscription: Subscription,
  tariffs: Tariffs,
  balance: Balance,
  topup: Topup,
  referrals: Referrals,
  support: Support,
  wheel: Wheel,
  gift: Gift,
  info: Info,
  profile: Profile,
};

function Shell() {
  const { page, demo } = useApp();
  const Current = PAGES[page];
  return (
    <div className="min-h-screen">
      <Header />
      <MenuPanel />
      {demo && (
        <div className="bg-amber-400/10 py-1 text-center text-[0.68rem] font-medium tracking-wide text-amber-300">ДЕМО-РЕЖИМ · тестовые данные</div>
      )}
      <main className="mx-auto max-w-xl px-4 pb-32 pt-5">
        <Current key={page} />
      </main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initTelegram();
  }, []);
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
