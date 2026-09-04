import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset PTE Password | Nirav Pandey",
};

export default function PteResetPasswordPage() {
  return <ResetPasswordClient />;
}
