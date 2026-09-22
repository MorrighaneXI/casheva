import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { FAVICON_BASE64 } from "../lib/favicon-data";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { TopHeader } from "@/components/top-header";
import { SessionProvider } from "@/components/session-context";
import { RoleGate } from "@/components/role-gate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
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
      { title: "SISKOPAD — Sistem Koperasi TNI AD" },
      {
        name: "description",
        content:
          "SISKOPAD: platform pengelolaan simpanan, pinjaman, verifikasi berjenjang, dan SHU koperasi TNI AD.",
      },
      { property: "og:title", content: "SISKOPAD — Sistem Koperasi TNI AD" },
      {
        property: "og:description",
        content:
          "Kelola anggota, simpanan, pinjaman, dan laporan SHU koperasi TNI AD dalam satu dasbor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      {
        httpEquiv: "Content-Security-Policy",
        content: "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval';",
      },
      {
        httpEquiv: "X-Content-Type-Options",
        content: "nosniff",
      },
    ],
    links: [
      { rel: "icon", href: FAVICON_BASE64, type: "image/png" },
      { rel: "icon", href: "/favicon.png?v=siskopad", type: "image/png", sizes: "256x256" },
      { rel: "icon", href: "/favicon-64x64.png?v=siskopad", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/favicon-32x32.png?v=siskopad", type: "image/png", sizes: "32x32" },
      { rel: "shortcut icon", href: "/favicon.ico?v=siskopad" },
      { rel: "apple-touch-icon", href: "/favicon.png?v=siskopad" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" type="image/png" href={FAVICON_BASE64} />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png?v=siskopad" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=siskopad" />
        <link rel="shortcut icon" href="/favicon.ico?v=siskopad" />
        <link rel="apple-touch-icon" href="/favicon.png?v=siskopad" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname === "/login";

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = FAVICON_BASE64;
  }, []);

  if (bare) {
    return (
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RoleGate>
            <Outlet />
          </RoleGate>
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RoleGate>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <TopHeader />
                <main className="flex-1 p-3 sm:p-6 max-w-full overflow-x-hidden">
                  {/* Required: nested routes render here. */}
                  <Outlet />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </RoleGate>
        <Toaster position="top-right" richColors />
      </SessionProvider>
    </QueryClientProvider>
  );
}
