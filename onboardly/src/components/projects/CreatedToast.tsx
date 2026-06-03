"use client";

// Shows a "Project created" toast once when arriving from the create flow.
// Reads ?created=1 from the URL, fires the toast, then cleans the param.

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function CreatedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      toast.success("Project created successfully!");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      const next = params.size > 0 ? `${pathname}?${params}` : pathname;
      router.replace(next, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
