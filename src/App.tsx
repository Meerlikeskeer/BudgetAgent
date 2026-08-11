import { Routes, Route } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import SignIn from "@/pages/SignIn";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import UploadPage from "@/pages/Upload";
import BillsPage from "@/pages/Bills";
import LoansPage from "@/pages/Loans";
import { MonthProvider } from "@/context/MonthContext";

export default function App() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <MonthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="bills" element={<BillsPage />} />
              <Route path="loans" element={<LoansPage />} />
            </Route>
          </Routes>
        </MonthProvider>
      </Authenticated>
    </>
  );
}
