import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { UserProvider } from "../../context/UserContext";
import { AuthProvider } from "../../features/auth/context/AuthProvider";
import { BranchProvider } from "../../features/branches/context/BranchContext";
import { CompanyProvider } from "../../features/companies/context/CompanyContext";
import { I18nProvider } from "../../i18n/I18nContext";
import { QueryProvider } from "./QueryProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CompanyProvider>
          <BranchProvider>
            <I18nProvider>
              <UserProvider>
                {children}
                <Toaster
                  position="top-center"
                  richColors
                  toastOptions={{
                    style: {
                      background: "rgba(8,11,20,.96)",
                      border: "1px solid rgba(255,255,255,.10)",
                      color: "#fff",
                      boxShadow: "0 15px 45px rgba(0,0,0,.5), 0 0 35px rgba(43,140,255,.18)",
                    },
                  }}
                />
              </UserProvider>
            </I18nProvider>
          </BranchProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
