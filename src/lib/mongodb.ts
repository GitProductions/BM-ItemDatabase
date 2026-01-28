import { Collection, MongoClient } from 'mongodb';
import { Item } from '@/types/items';

const uri = process.env.MONGODB_URI;

const databaseName = process.env.MONGODB_DB ?? 'bm-item-database';
const collectionName = process.env.MONGODB_COLLECTION ?? 'items';

let cachedClientPromise: Promise<MongoClient> | null = null;

const connectClient = async () => {
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (!cachedClientPromise) {
    cachedClientPromise = (async () => {
      const client = new MongoClient(uri);
      await client.connect();
      return client;
    })();
  }

  return cachedClientPromise;
};

export async function getItemsCollection(): Promise<Collection<Item>> {
  const client = await connectClient();
  return client.db(databaseName).collection<Item>(collectionName);
}