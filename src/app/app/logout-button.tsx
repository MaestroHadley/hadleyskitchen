"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      style={{ padding: 10, marginTop: 16 }}
    >
      Log out
    </button>
  );
}
