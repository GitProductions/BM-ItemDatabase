import type { NextAuthOptions, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { getServerSession } from 'next-auth';
import { ensureOAuthUser, findUserByEmail, verifyPassword } from './auth-store';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await findUserByEmail(credentials.email.trim().toLowerCase());
        if (!user) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name } satisfies User;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'discord' && profile) {
        try {
          await ensureOAuthUser('discord', {
            id: String(profile.id ?? account.providerAccountId),
            email: (profile as { email?: string }).email,
            name: (profile as { global_name?: string; username?: string; name?: string }).global_name
              ?? (profile as { username?: string }).username
              ?? (profile as { name?: string }).name
              ?? undefined,
          });
        } catch (error) {
          console.error('Failed to upsert discord user', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = String(token.id);
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);
