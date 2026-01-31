import type { NextAuthOptions, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { getServerSession } from 'next-auth';
import { ensureOAuthUser, findUserByEmail, findUserById, updateUserIp, verifyPassword } from './auth-store';
import { hashIp } from './ip-hash';

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
    async signIn({ account, profile, req }) {
      if (account?.provider === 'discord' && profile) {
        try {
          await ensureOAuthUser('discord', {
            id: String(account.providerAccountId),
            email: (profile as { email?: string }).email,
            name: (profile as { global_name?: string; username?: string; name?: string }).global_name
              ?? (profile as { username?: string }).username
              ?? (profile as { name?: string }).name
              ?? undefined,
            lastIpHash: hashIp(req?.headers?.get('x-real-ip') ?? '0.0.0.0'),
          });
          if (account.providerAccountId) {
            const ipHash = hashIp(req?.headers?.get('x-real-ip') ?? '0.0.0.0');
            await updateUserIp(`discord:${account.providerAccountId}`, ipHash);
          }
        } catch (error) {
          console.error('Failed to upsert discord user', error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      if (trigger === 'update' && session?.name) {
        token.name = session.name as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = String(token.id);
        session.user.email = token.email ?? session.user.email;

        // Refresh latest name from DB to reflect profile edits
        const dbUser = token.id ? await findUserById(String(token.id)) : null;
        session.user.name = dbUser?.name ?? (token.name ?? session.user.name);
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);
