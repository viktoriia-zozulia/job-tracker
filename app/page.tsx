import { redirect } from "next/navigation";

// proxy.ts normally handles / first and sends logged-out users to /login.
export default function Home() {
  redirect("/dashboard");
}
