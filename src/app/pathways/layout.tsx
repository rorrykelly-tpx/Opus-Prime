import { DemoBar } from "@/components/features/pathways/DemoBar";
import { PathwaysProvider } from "@/components/features/pathways/PathwaysProvider";
import { SiteFooter } from "@/components/features/pathways/SiteFooter";
import { SiteHeader } from "@/components/features/pathways/SiteHeader";
import { getCurrentUser } from "@/server/auth";
import { frameworkSource } from "@/server/services/framework";

export default async function PathwaysLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Identity comes only from the auth seam (ADR 0002). Progress is stored per user.
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main id="main">
        <section className="plain">
          <div className="wrap">
            <h1>Sign in to continue</h1>
            <p>You need to be signed in to see your learning pathway.</p>
          </div>
        </section>
      </main>
    );
  }

  const { framework, resources, knowledge } = frameworkSource;
  return (
    <PathwaysProvider user={user} framework={framework} resources={resources} knowledge={knowledge}>
      <a className="vh skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <DemoBar />
      <main id="main">{children}</main>
      <SiteFooter />
    </PathwaysProvider>
  );
}
