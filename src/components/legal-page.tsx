import type { ReactNode } from "react";
import { Container, PageHero } from "./ui";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHero title={title} text={`Last updated: ${updated}`} />
      <Container className="py-12">
        <div className="prose-content mx-auto max-w-3xl">{children}</div>
      </Container>
    </>
  );
}
