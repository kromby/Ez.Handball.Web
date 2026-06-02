import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "../auth/useAuth";
import { createQueryClient } from "../query/queryClient";

/** A complete, no-op auth context value for tests; override per case. */
export function buildAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: "anonymous",
    user: null,
    login: async () => undefined,
    register: async () => undefined,
    logout: async () => undefined,
    updateProfile: async () => undefined,
    resendVerification: async () => undefined,
    ...overrides,
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: { initialEntries?: string[]; auth?: Partial<AuthContextValue> } = {},
) {
  const { initialEntries = ["/"], auth } = options;
  const client = createQueryClient();
  const value = buildAuth(auth);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

export function queryWrapper() {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
