import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { describe, it, expect } from "@jest/globals";

jest.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-inter",
  }),
}));

jest.mock("lucide-react", () => {
  const MockIcon = (props: Record<string, unknown>) => (
    <span data-testid="mock-icon" {...props} />
  );
  return {
    Zap: MockIcon,
    QrCode: MockIcon,
    Building2: MockIcon,
    UserCheck: MockIcon,
    BarChart3: MockIcon,
    ArrowRight: MockIcon,
    Shield: MockIcon,
    TrendingUp: MockIcon,
    Star: MockIcon,
    CheckCircle2: MockIcon,
    ChevronRight: MockIcon,
    Clock: MockIcon,
    Users: MockIcon,
    Github: MockIcon,
    Twitter: MockIcon,
    Linkedin: MockIcon,
    Youtube: MockIcon,
    Menu: MockIcon,
    X: MockIcon,
    Loader2: MockIcon,
  };
});

describe("HomePage", () => {
  it("renders the hero section heading", () => {
    render(<HomePage />);
    const heading = screen.getByText(/Transforme seus pagamentos com/i);
    expect(heading).toBeInTheDocument();
  });

  it("renders the features section", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Tudo que você precisa para crescer/i)
    ).toBeInTheDocument();
  });

  it("renders the pricing section", () => {
    render(<HomePage />);
    expect(screen.getByText(/Preços Simples/i)).toBeInTheDocument();
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Professional/i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise/i)).toBeInTheDocument();
  });

  it("renders the testimonials section", () => {
    render(<HomePage />);
    expect(screen.getByText(/Quem Usa Recomenda/i)).toBeInTheDocument();
  });

  it("renders the how it works section", () => {
    render(<HomePage />);
    expect(screen.getByText(/Como Funciona/i)).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Pronto para Transformar seus Pagamentos/i)
    ).toBeInTheDocument();
  });
});
