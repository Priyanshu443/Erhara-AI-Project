import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckSquare, Zap, BarChart2, Shield } from "lucide-react";

export default function LandingPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            TF
          </div>
          <span className="font-bold text-xl tracking-tight">TaskFlow</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href={`${basePath}/sign-in`}>
            <Button variant="ghost" className="font-medium">Log in</Button>
          </Link>
          <Link href={`${basePath}/sign-up`}>
            <Button className="font-medium">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="py-24 md:py-32 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6">
            New: Enhanced Dashboard Analytics
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            The operations center for <span className="text-primary">high-velocity</span> teams.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
            TaskFlow brings precision and clarity to your team's work. No more scattered updates or lost assignments. Just pure, actionable alignment.
          </p>
          <div className="flex items-center gap-4">
            <Link href={`${basePath}/sign-up`}>
              <Button size="lg" className="h-12 px-8 text-base font-semibold">Start building now</Button>
            </Link>
            <Link href={`${basePath}/sign-in`}>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">Sign in to workspace</Button>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Absolute Clarity</h3>
              <p className="text-muted-foreground">Every task has an owner, a status, and a priority. Cut through the noise and see exactly what needs to happen.</p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Visibility</h3>
              <p className="text-muted-foreground">Instantly gauge project health with comprehensive dashboards showing progress, bottlenecks, and team velocity.</p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Role-based Precision</h3>
              <p className="text-muted-foreground">Structured permissions ensure the right people have the right access. Project admins control the workspace.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>&copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}