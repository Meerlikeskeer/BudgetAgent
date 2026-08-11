import { NavLink, Outlet } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { LayoutDashboard, Upload, Receipt, Landmark, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMonth, formatMonthLabel } from "@/context/MonthContext";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/bills", label: "Bills", icon: Receipt },
  { to: "/loans", label: "Loans", icon: Landmark },
];

export default function Layout() {
  const { signOut } = useAuthActions();
  const { month, setMonth } = useMonth();

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 p-4 sm:flex">
        <div className="mb-6 px-2 text-lg font-semibold">BudgetAgent</div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="justify-start gap-2" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
              ‹
            </Button>
            <div className="w-40 text-center text-sm font-medium">
              {formatMonthLabel(month)}
            </div>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
              ›
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
