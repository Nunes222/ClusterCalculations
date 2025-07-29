"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  label?: string;
}

export function BackButton({ to = "/", label = "Back" }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push(to)}
      className="flex items-center gap-2"
    >
      <ArrowLeft size={16} />
      {label}
    </Button>
  );
}
