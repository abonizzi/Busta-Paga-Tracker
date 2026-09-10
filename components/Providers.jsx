"use client";

import { SettingsProvider } from "@/context/SettingsContext";

export default function Providers({ children }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
