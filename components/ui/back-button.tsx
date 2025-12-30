"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  className?: string;
  children: React.ReactNode;
}

export function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/bingo");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
    >
      {children}
    </button>
  );
}

