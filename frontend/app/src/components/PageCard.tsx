import type { ReactNode } from "react";

type PageCardProps = {
  children: ReactNode;
};

export function PageCard({ children }: PageCardProps) {
  return <div className="page-card">{children}</div>;
}
