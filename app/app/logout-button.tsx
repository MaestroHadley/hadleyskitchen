"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        background: "var(--hk-button)",
        color: "#ffffff",
        fontWeight: 700,
        cursor: "pointer",
        marginTop: 4,
      }}
    >
      Log out
    </button>
  );
}
