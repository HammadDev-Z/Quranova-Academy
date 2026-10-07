"use client";

import { ErrorView } from "@/components/error-view";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} home="/admin" />;
}
