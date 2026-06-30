import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Usuários hardcoded para MVP — em produção, usar banco de dados
const users = [
  {
    id: "1",
    name: "Mateus Siqueira",
    email: "mateus@bankingstack.com",
    password: "pro2024",
    plan: "pro" as const,
  },
  {
    id: "2",
    name: "Aluno Premium",
    email: "aluno@bankingstack.com",
    password: "premium123",
    plan: "pro" as const,
  },
];

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const user = users.find(
          (u) =>
            u.email === credentials?.email &&
            u.password === credentials?.password
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.plan = (user as any).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/pro/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "banking-stack-pro-secret-key-change-in-production",
});

// Tipos estendidos
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      plan: "pro" | "enterprise";
    };
  }
}
