import { createHash } from 'crypto';

export const hashIp = (ip: string, salt = process.env.IP_HASH_SALT ?? '') =>
  createHash('sha256').update(`${ip}|${salt}`).digest('hex');
