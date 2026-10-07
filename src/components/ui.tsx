import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = {
  href?: string;
  variant?: "primary" | "gold" | "outline" | "ghost" | "light";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  gold: "bg-gold-500 text-brand-900 hover:bg-gold-400 shadow-sm",
  outline: "border border-brand-600 text-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  light: "bg-white text-brand-800 hover:bg-brand-50 shadow-sm",
};

export function Button({ href, variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
    size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm",
    variants[variant],
    className,
  );
  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return external ? (
      <a href={href} className={classes} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    ) : (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  className,
  children,
  tone = "default",
  id,
}: {
  className?: string;
  children: ReactNode;
  tone?: "default" | "white" | "dark";
  id?: string;
}) {
  const tones = {
    default: "",
    white: "bg-white",
    dark: "bg-brand-800 text-white pattern",
  };
  return (
    <section id={id} className={cn("py-16 sm:py-20", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
  invert,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
  invert?: boolean;
}) {
  return (
    <div className={cn("reveal mb-10 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className={cn("mb-2 text-sm font-semibold uppercase tracking-widest", invert ? "text-gold-300" : "text-gold-600")}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn("text-3xl font-bold sm:text-4xl", invert ? "text-white" : "text-brand-800")}>{title}</h2>
      {text && <p className={cn("mt-3 text-lg", invert ? "text-brand-100" : "text-muted")}>{text}</p>}
    </div>
  );
}

export function PageHero({ title, text, arabic }: { title: string; text?: string; arabic?: string }) {
  return (
    <div className="bg-brand-800 pattern text-white">
      <Container className="py-14 sm:py-20 text-center">
        {arabic && (
          <p lang="ar" dir="rtl" className="font-arabic text-3xl text-gold-300 sm:text-4xl">
            {arabic}
          </p>
        )}
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{title}</h1>
        {text && <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">{text}</p>}
      </Container>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("reveal rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md", className)}>{children}</div>
  );
}

export function CheckList({ items, invert }: { items: readonly string[]; invert?: boolean }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={cn("mt-1 h-5 w-5 flex-none", invert ? "text-gold-300" : "text-brand-500")}
            fill="currentColor"
          >
            <path d="M10 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm4.1 6.6l-4.8 5a.9.9 0 01-1.3 0l-2.1-2.2a.9.9 0 111.3-1.2l1.4 1.5 4.2-4.4a.9.9 0 111.3 1.3z" />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
