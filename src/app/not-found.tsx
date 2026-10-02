import { Button, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="font-serif text-6xl font-bold text-gold-500">404</p>
      <h1 className="mt-3 text-3xl font-bold text-brand-800">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button href="/">Back to home</Button>
        <Button href="/courses" variant="outline">
          View courses
        </Button>
      </div>
    </Container>
  );
}
