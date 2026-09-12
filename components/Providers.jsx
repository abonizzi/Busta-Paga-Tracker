"use client";

import { SettingsProvider } from "@/context/SettingsContext";
import { PayslipsProvider } from "@/context/PayslipsContext";

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <PayslipsProvider>{children}</PayslipsProvider>
    </SettingsProvider>
  );
}
