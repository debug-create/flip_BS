import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { EvidenceProvider } from "@/lib/evidenceStore";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-primary">ERR_404 · ROUTE_NOT_FOUND</div>
        <h1 className="mt-2 text-5xl font-semibold text-foreground">Signal lost</h1>
        <p className="mt-2 text-sm text-muted-foreground">The module you requested is not in the registry.</p>
        <a href="/" className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Return to Command Center</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-destructive">SYSTEM FAULT</div>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Module failed to load</h1>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">Retry</button>
          <a href="/" className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground hover:bg-accent">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DRISHTI — Traffic Intelligence Command Center" },
      { name: "description", content: "AI-powered traffic violation intelligence platform for Bengaluru Traffic Police and Flipkart operations." },
      { name: "theme-color", content: "#0a0f1a" },
      { property: "og:title", content: "DRISHTI — Traffic Intelligence Command Center" },
      { property: "og:description", content: "AI-powered traffic violation intelligence platform." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <EvidenceProvider>
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
          <TopBar />
          <div className="flex min-h-0 flex-1">
            <AppSidebar />
            <main className="relative flex-1 overflow-auto">
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="relative animate-fade-in px-6 py-5">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
        <Toaster theme="dark" richColors position="top-right" />
      </EvidenceProvider>
    </QueryClientProvider>
  );
}
