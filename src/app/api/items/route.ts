import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { countItems, countItemsFiltered, deleteItem, searchItems, upsertItems } from '@/lib/d1';
import { ItemInput, normalizeItemInput, parseBooleanParam, withCors } from '@/lib/items-api';
import { Item } from '@/types/items';
import { getAuthSession } from '@/lib/auth';
import { verifyApiToken } from '@/lib/auth-store';
import { hashIp } from '@/lib/ip-hash';
import { buildItemPath } from '@/lib/slug';

const ITEMS_TAG = 'items';

// Helper 
const itemUrlFor = (request: NextRequest, id: string, keywords?: string | null) =>
  new URL(buildItemPath(id, keywords), request.url).toString();

// Extract Bearer token from Authorization header if present
const getBearer = (request: NextRequest) => {
  const header = request.headers.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

// Check if SuperAdmin token is provided in the request (via Authorization header) to allow bypassing normal auth checks for trusted clients like CLI or Postman
const isAdminRequest = (request: NextRequest) => {
  const token = getBearer(request);
  const secret = process.env.ADMIN_TOKEN;
  return Boolean(secret && token && token === secret);
};

// Returns requester info if valid session or API token is provided, otherwise null
const resolveRequester = async (request: NextRequest) => {
  const bearer = getBearer(request);
  if (bearer) {
    if (isAdminRequest(request)) return { isAdmin: true };
    const apiUser = await verifyApiToken(bearer);
    if (apiUser) return { isAdmin: false, userId: apiUser.id, name: apiUser.name, email: apiUser.email };
  }

  const session = await getAuthSession();
  if (session?.user?.id) {
    return {
      isAdmin: false,
      userId: session.user.id,
      name: session.user.name ?? undefined,
      email: session.user.email ?? undefined,
    };
  }

  return null;
};


// GET supports filtering by search query, type, flagged status, and id, as well as pagination via limit/offset
// Example: GET /api/items?q=sword&type=weapon&flagged=true&limit=10&offset=20
// Note: flagged=true returns items that are flagged for review, flagged=false returns items that are not flagged, and omitting flagged returns all items regardless of flag status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || undefined;
  const type = searchParams.get('type')?.trim() || undefined;
  const flagged = parseBooleanParam(searchParams.get('flagged'));
  const id = searchParams.get('id')?.trim() || undefined;

  const limitParam = Number(searchParams.get('limit') ?? undefined);
  const offsetParam = Number(searchParams.get('offset') ?? undefined);

  const items = await searchItems({
    q,
    type,
    flagged,
    id,
    limit: Number.isFinite(limitParam) ? limitParam : undefined,
    offset: Number.isFinite(offsetParam) ? offsetParam : undefined,
  });

  const [totalAll, totalMatching] = await Promise.all([
    countItems(),
    countItemsFiltered({ q, type, flagged, id }),
  ]);

  const payload = { items, count: items.length, total: totalMatching, totalAll };
  return withCors(
    NextResponse.json(payload, {
      status: 200,
      headers: {
        //  --- Really cant decide how to handle caching.. to do or not to do.. and to what extent?
        // Avoid browser-level caching so UI reflects DB changes immediately
        'Cache-Control': 'public, max-age=3600',  // 1 hour
        // 'Cache-Control': 'public, max-age=3600, must-revalidate',  // 1 hour
        'Content-Type': 'application/json',
        // 'Cache-Control': 'no-store',
        // 'X-Cache': 'MISS',
      },
    }),
  );
}

type PostBody = {
  raw?: string;
  submittedBy?: string;
  submittedByUserId?: string;
  item?: ItemInput;
  items?: ItemInput[];
  overrides?: Record<string, Partial<ItemInput>>;
} & ItemInput;

// When user submits an item, we want to attribute it to them if possible
const applyRequester = (item: ItemInput, requester: Awaited<ReturnType<typeof resolveRequester>>): ItemInput => {
  if (!requester?.userId) return item;
  return {
    ...item,
    submittedByUserId: requester.userId,
    submittedBy: requester.name ?? item.submittedBy ?? requester.email ?? undefined,
  };
};

export async function POST(request: NextRequest) {
  const requester = await resolveRequester(request);
  if (!requester) {
    return withCors(
      NextResponse.json(
        {
          message: 'Authentication required: provide a valid API token in Authorization: Bearer <token> or sign in with a session',
        },
        { status: 401 },
      ),
    );
  }

  // Hash the submitter's IP address for internal use (e.g. rate limiting, abuse detection) without storing raw IPs to protect user privacy
  const ipHash = hashIp(request.headers.get('x-real-ip') ?? '0.0.0.0');

  let payload: PostBody;
  const toItemUrl = (id: string, keywords?: string | null) => itemUrlFor(request, id, keywords);

  try {
    payload = (await request.json()) as PostBody;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  
  // 1) Client-supplied parsed items (keeps IDs/overrides intact)
  // This would be when submitting directly from the UI Form, which allows multiple items to be submitted at once
  if (Array.isArray(payload.items) && payload.items.length) {
    const normalizedItems: Item[] = [];
    const submitter = requester?.userId
      ? requester.name ?? payload.submittedBy?.trim() ?? requester.email ?? 'Unnamed'
      : payload.submittedBy?.trim();
    const overrides = payload.overrides ?? {};

    for (const incoming of payload.items) {
      const incomingWithSubmitter = applyRequester({ ...incoming, submittedBy: submitter ?? incoming.submittedBy }, requester);
      
      // Apply overrides and normalize each item, ensuring that the submitter info is preserved and merged with any existing submittedBy/submittedByUserId on the item
      const normalized = normalizeItemInput(incomingWithSubmitter);
      if (!normalized.ok) {
        return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
      }
      const item = normalized.item;
      const override = overrides[item.id] ?? {};

      // Handling merges for worn slots, making sure to combine and deduplicate any slots from the original item and the override, while also normalizing the slot names to lowercase for consistency
      const mergedWorn = (() => {
        const base = Array.isArray(item.worn) ? item.worn : [];
        const over = Array.isArray(override.worn) ? override.worn : typeof override.worn === 'string' ? [override.worn] : [];
        const combined = Array.from(new Set([...base, ...over].map((s) => s.trim().toLowerCase()).filter(Boolean)));
        return combined.length ? combined : undefined;
      })();

      // Push the final merged item to the list of normalized items to be upserted
      normalizedItems.push({
        ...item,
        submittedBy: submitter ?? item.submittedBy,
        submittedByUserId: requester?.userId ?? item.submittedByUserId,
        droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
        worn: mergedWorn,
      });
    }

    // Taking the normalizedItems and upserting them into the database, then revalidating the cache and returning the relevant item URLs for the inserted/updated items in the response
    const storedResults = await upsertItems(normalizedItems, { submissionIpHash: ipHash });
    const storedIds: string[] = storedResults.map((entry) => entry.id);

    revalidateTag(ITEMS_TAG);

    // Generate item URLs for the submitted items to include in the response
    const itemUrls = normalizedItems.map((item) => toItemUrl(item.id, item.keywords));
    return withCors(NextResponse.json({ items: normalizedItems, inserted: normalizedItems.length, itemIds: storedIds, itemUrls }));
  }

  
  // 2) Raw identify dump -> multiple items
  // This would primarily be when submitting directly from MUDLET where user is sending a raw identify dump + the items short description at the top to mimic how we submit items in the UI
  const cleanedInput = payload?.raw?.trim();
  if (cleanedInput) {
    const submitter = requester?.userId
      ? requester.name ?? payload.submittedBy?.trim() ?? requester.email ?? 'Unnamed'
      : payload.submittedBy?.trim();
    
    // Parsing the identify dump..
    const parsedItems = parseIdentifyDump(cleanedInput);
    if (parsedItems.length) {
      const overrides = payload.overrides ?? {};
      

      const merged = parsedItems.map((item) => {
        const override = overrides[item.id] ?? {};
        const mergedWorn = (() => {
          const base = Array.isArray(item.worn) ? item.worn : [];
          const over = Array.isArray(override.worn)
            ? override.worn
            : typeof override.worn === 'string'
              ? [override.worn]
              : [];
          const combined = Array.from(new Set([...base, ...over].map((s) => s.trim().toLowerCase()).filter(Boolean)));
          return combined.length ? combined : undefined;
        })();

        return {
          ...item,
          submittedBy: submitter ?? item.submittedBy,
          submittedByUserId: requester?.userId ?? item.submittedByUserId,
          droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
          worn: mergedWorn,
        };
      });

      const storedResults = await upsertItems(merged, { submissionIpHash: ipHash });
      const storedIds: string[] = storedResults.map((entry) => entry.id);

      revalidateTag(ITEMS_TAG);
      
      // Generate item URLs for the submitted items to include in the response
      const itemUrls = merged.map((item) => toItemUrl(item.id, item.keywords));

      return withCors(NextResponse.json({  inserted: parsedItems.length, itemIds: storedIds, itemUrls }));
    }

    // If we did not parse any items from the raw input, return an empty response with a 200 status to indicate that the request was processed but no items were created
    return withCors(NextResponse.json({  inserted: parsedItems.length, itemIds: [], itemUrls: [] }));
  }

  // If not a raw dump nor multiple items, treat it as a single item submission (e.g. from the UI Form when only one item is being submitted without using the "items" array in the payload)
  // 2) Direct single-item submission
  const candidateItem = applyRequester(payload.item ?? payload, requester);
  const normalized = normalizeItemInput(candidateItem);
  if (!normalized.ok) {
    return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
  }

  const [storedResult] = await upsertItems([normalized.item], { submissionIpHash: ipHash });

  revalidateTag(ITEMS_TAG);

  const stableId = storedResult?.id ?? normalized.item.id;

  // const [saved] = await searchItems({ id: stableId });
  // const itemUrl = stableId ? toItemUrl(stableId, saved?.keywords ?? normalized.item.keywords) : undefined;
  const itemUrl = toItemUrl(stableId, normalized.item.keywords);

  return withCors(
    NextResponse.json({ item: normalized.item, itemId: stableId, itemUrl }, { status: 201 }),
  );
}

export async function PATCH(request: NextRequest) {
  // Only admins can directly overwrite items via the PATCH endpoint
  if (!isAdminRequest(request)) {
    return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
  }

  let payload: { items?: ItemInput[]; item?: ItemInput } & ItemInput;

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  const incomingItems = payload.items ?? (payload.item ? [payload.item] : [payload]);
  const normalizedItems: Item[] = [];

  for (const incoming of incomingItems) {
    const normalized = normalizeItemInput(incoming);
    if (!normalized.ok) {
      return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
    }
    normalizedItems.push(normalized.item);
  }

  const ipHash = hashIp(request.headers.get('x-real-ip') ?? '0.0.0.0');
  const updatedResults = await upsertItems(normalizedItems, {
    submissionIpHash: ipHash,
    preserveIdOnIdentityChange: true,
  });
  const updatedIds: string[] = updatedResults.map((entry) => entry.id);

  revalidateTag(ITEMS_TAG);

  // const savedId = normalizedItems.length === 1 ? updatedIds[0] ?? normalizedItems[0].id : null;
  // const saved = savedId ? await searchItems({ id: savedId }) : null;

  // parse the itemURL from the single updated item if only one item was submitted, otherwise return an array of URLs for the batch update
  const savedId = normalizedItems.length === 1 ? updatedIds[0] ?? normalizedItems[0].id : null;
  const savedURL = savedId ? itemUrlFor(request, savedId, normalizedItems[0].keywords) : null;
  
  const body =
    normalizedItems.length === 1
      ? {
          // item: saved?.[0] ?? normalizedItems[0],
          item: normalizedItems[0],
          itemId: savedId,
          itemURL: savedURL,
          // itemUrl: savedId
          //   ? itemUrlFor(request, savedId, (saved?.[0] ?? normalizedItems[0])?.keywords)
          //   : undefined,
        }
      : {
          updated: normalizedItems.length,
          itemIds: updatedIds,
          itemUrls: updatedIds.map((id, idx) => itemUrlFor(request, id, normalizedItems[idx]?.keywords)),
        };

  return withCors(NextResponse.json(body, { status: 200 }));
}

type DeleteBody = {
  id?: string;
};
export async function DELETE(request: NextRequest) {
  // Require admin token to clear the database
  // Note: returning 401 rather than 403 to avoid leaking existence of the endpoint
  if (!isAdminRequest(request)) {
    return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
  }
  let payload
  try {
    payload = (await request.json()) as DeleteBody;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  const id = payload?.id?.trim();

  if (id) {
    await deleteItem(id);

    revalidateTag(ITEMS_TAG);
    
    return withCors(NextResponse.json({ deleted: true, id }));
  }

  return withCors(NextResponse.json({ message: 'id is required to delete an item (or set all=true to wipe)' }, { status: 400 }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
