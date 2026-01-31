import type { NextAuthOptions, User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
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
    async signIn({ account, profile }) {
      if (account?.provider === 'discord' && profile) {
        const ipHeader = await headers();
        const ip =
          ipHeader.get('x-real-ip')
          ?? ipHeader.get('cf-connecting-ip')
          ?? '0.0.0.0';
        const ipHash = hashIp(ip);

        try {
          await ensureOAuthUser('discord', {
            id: String(account.providerAccountId),
            email: (profile as { email?: string }).email,
            name: (profile as { global_name?: string; username?: string; name?: string }).global_name
              ?? (profile as { username?: string }).username
              ?? (profile as { name?: string }).name
              ?? undefined,
            lastIpHash: ipHash,
          });
          if (account.providerAccountId) {
            await updateUserIp(`discord:${account.providerAccountId}`, ipHash);
          }
        } catch (error) {
          console.error('Failed to upsert discord user', error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        // Credentials flow provides a full user record
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }

      // OAuth flow (e.g., Discord) may not populate user.id; derive a stable id
      if (!token.id && account?.provider === 'discord' && account.providerAccountId) {
        const discordId = `discord:${account.providerAccountId}`;
        const profileEmail = (profile as { email?: string })?.email?.toLowerCase();

        // Try to reuse existing user (email-linked or discord-linked) to keep IDs consistent
        const dbUser =
          (profileEmail ? await findUserByEmail(profileEmail) : null) ??
          (await findUserById(discordId));

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email ?? token.email ?? profileEmail;
          token.name = dbUser.name ?? token.name;
        } else {
          // Fall back to deterministic discord-based id if nothing exists yet
          token.id = discordId;
          token.email = token.email ?? profileEmail;
          token.name =
            token.name ??
            (profile as { global_name?: string; username?: string; name?: string })?.global_name ??
            (profile as { username?: string })?.username ??
            (profile as { name?: string })?.name;
        }
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
