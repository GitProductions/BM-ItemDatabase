import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from './common';
import { registerBodySchema } from './auth';
import {
  itemsAuthHeaderSchema,
  itemsDeleteBodySchema,
  itemsGetQuerySchema,
  itemsPatchBodySchema,
  itemsPostBodySchema,
} from './items';
import { leaderboardQuerySchema } from './leaderboard';
import { submissionsQuerySchema } from './submissions';
import { suggestionBodySchema } from './suggestions';

const registry = new OpenAPIRegistry();

const messageResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi('MessageResponse');

const itemsSearchResponseSchema = z
  .object({
    items: z.array(z.unknown()),
    count: z.number(),
    total: z.number(),
    totalAll: z.number(),
  })
  .openapi('ItemsSearchResponse');

const itemsBatchResponseSchema = z
  .object({
    inserted: z.number(),
    itemIds: z.array(z.string()),
    itemUrls: z.array(z.string()),
    submissionIds: z.array(z.string().nullable()),
    submissionUrls: z.array(z.string().nullable()),
  })
  .openapi('ItemsBatchResponse');

const itemCreatedResponseSchema = z
  .object({
    item: z.unknown(),
    itemId: z.string(),
    itemUrl: z.string(),
    submissionId: z.string().nullable(),
    submissionUrl: z.string().nullable(),
  })
  .openapi('ItemCreatedResponse');

const itemsPatchResponseSchema = z
  .object({
    updated: z.number().optional(),
    item: z.unknown().optional(),
    itemId: z.string().nullable().optional(),
    itemURL: z.string().nullable().optional(),
    itemIds: z.array(z.string()).optional(),
    itemUrls: z.array(z.string()).optional(),
  })
  .openapi('ItemsPatchResponse');

const itemDeleteResponseSchema = z
  .object({
    deleted: z.boolean(),
    id: z.string(),
  })
  .openapi('ItemDeleteResponse');

const leaderboardResponseSchema = z
  .object({
    submitters: z.array(z.unknown()),
    totals: z.unknown(),
  })
  .openapi('LeaderboardResponse');

const submissionsResponseSchema = z
  .object({
    submissions: z.array(z.unknown()),
  })
  .openapi('SubmissionsResponse');

const okResponseSchema = z
  .object({
    ok: z.boolean(),
  })
  .openapi('OkResponse');

const registerResponseSchema = z
  .object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  })
  .openapi('RegisterResponse');

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'API token',
});

registry.registerPath({
  method: 'get',
  path: '/api/items',
  tags: ['Items'],
  summary: 'Search items',
  operationId: 'getItems',
  description: 'Search items with optional filters and pagination.',
  request: {
    query: itemsGetQuerySchema,
  },
  responses: {
    200: {
      description: 'Item search results',
      content: {
        'application/json': {
          schema: itemsSearchResponseSchema,
          example: { items: [], count: 0, total: 0, totalAll: 0 },
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Invalid query parameters' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/items',
  tags: ['Items'],
  summary: 'Create or import items',
  operationId: 'postItems',
  description: 'Create one item, create many items, or import items from raw identify text.',
  security: [{ bearerAuth: [] }],
  request: {
    headers: itemsAuthHeaderSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: itemsPostBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Batch import/create completed',
      content: {
        'application/json': {
          schema: itemsBatchResponseSchema,
          example: {
            inserted: 2,
            itemIds: ['abc123', 'def456'],
            itemUrls: ['/items/abc123', '/items/def456'],
            submissionIds: ['sub1', 'sub2'],
            submissionUrls: ['/items/abc123/drops/sub1', '/items/def456/drops/sub2'],
          },
        },
      },
    },
    201: {
      description: 'Single item created',
      content: {
        'application/json': {
          schema: itemCreatedResponseSchema,
          example: {
            item: { name: 'Shiny Dagger', type: 'weapon' },
            itemId: 'abc123',
            itemUrl: '/items/abc123',
            submissionId: 'sub1',
            submissionUrl: '/items/abc123/drops/sub1',
          },
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Invalid request payload' },
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Authentication required' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/items',
  tags: ['Items'],
  summary: 'Update items (admin)',
  operationId: 'patchItems',
  description: 'Update one or more items. Requires admin authorization.',
  security: [{ bearerAuth: [] }],
  request: {
    headers: itemsAuthHeaderSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: itemsPatchBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Items updated',
      content: {
        'application/json': {
          schema: itemsPatchResponseSchema,
          example: { updated: 1, itemIds: ['abc123'], itemUrls: ['/items/abc123'] },
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Invalid request payload' },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Unauthorized' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/items',
  tags: ['Items'],
  summary: 'Delete item (admin)',
  operationId: 'deleteItems',
  description: 'Delete an item by id. Requires admin authorization.',
  security: [{ bearerAuth: [] }],
  request: {
    headers: itemsAuthHeaderSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: itemsDeleteBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Item deleted',
      content: {
        'application/json': {
          schema: itemDeleteResponseSchema,
          example: { deleted: true, id: 'abc123' },
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'id is required to delete an item' },
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Unauthorized' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/leaderboard',
  tags: ['Leaderboard'],
  summary: 'Submitter leaderboard',
  operationId: 'getLeaderboard',
  description: 'Return leaderboard totals and top submitters.',
  request: {
    query: leaderboardQuerySchema,
  },
  responses: {
    200: {
      description: 'Leaderboard results',
      content: {
        'application/json': {
          schema: leaderboardResponseSchema,
          example: { submitters: [], totals: {} },
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Invalid query parameters' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/submissions',
  tags: ['Submissions'],
  summary: 'Fetch recent submissions',
  operationId: 'getRecentSubmissions',
  description: 'Fetch the most recent item submissions for external clients.',
  request: {
    query: submissionsQuerySchema,
  },
  responses: {
    200: {
      description: 'Recent submissions',
      content: {
        'application/json': {
          schema: submissionsResponseSchema,
          example: { submissions: [] },
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Invalid query parameters' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/suggestions',
  tags: ['Suggestions'],
  summary: 'Submit item suggestion',
  operationId: 'postSuggestion',
  description: 'Submit a suggestion note for an existing item.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: suggestionBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Suggestion accepted',
      content: {
        'application/json': {
          schema: okResponseSchema,
          example: { ok: true },
        },
      },
    },
    400: {
      description: 'Invalid suggestion payload',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'itemId and note are required' },
        },
      },
    },
    500: {
      description: 'Failed to save suggestion',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Failed to save suggestion' },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register account',
  operationId: 'postAuthRegister',
  description: 'Create a new local account with email, display name, and password.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: registerBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Account created',
      content: {
        'application/json': {
          schema: registerResponseSchema,
          example: { user: { id: 'user_123', email: 'test@example.com', name: 'Test User' } },
        },
      },
    },
    400: {
      description: 'Invalid registration payload',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Name, email, and a password of at least 8 characters are required.' },
        },
      },
    },
    409: {
      description: 'Email already registered',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'That email is already registered.' },
        },
      },
    },
    500: {
      description: 'Unable to create account',
      content: {
        'application/json': {
          schema: messageResponseSchema,
          example: { message: 'Unable to create account right now.' },
        },
      },
    },
  },
});

export const buildOpenApiSpec = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const doc = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Blackmud Item Database API',
      version: '1.0.0',
      description: 'Request-focused API schema for Cloudflare API Shield monitoring.',
      contact: {
        name: 'BM ItemDB Maintainers',
        url: 'https://bm-itemdb.gitago.dev',
      },
    },
    tags: [
      { name: 'Items', description: 'Item search and mutation endpoints' },
      { name: 'Leaderboard', description: 'Submitter leaderboard endpoints' },
      { name: 'Suggestions', description: 'Item suggestion endpoints' },
      { name: 'Auth', description: 'Authentication and account endpoints' },
    ],
    servers: [{ url: 'https://bm-itemdb.gitago.dev' }],
  });

  // Cloudflare schema parser expects schema.type to be a string.
  // zod-to-openapi may emit JSON Schema unions like ["number", "null"] for optional/coerced params.
  const normalizeTypeArrays = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) normalizeTypeArrays(entry);
      return;
    }

    const record = value as Record<string, unknown>;
    const schema = record.schema;
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      const schemaRecord = schema as Record<string, unknown>;
      const type = schemaRecord.type;
      if (Array.isArray(type)) {
        const preferred = type.find((entry) => typeof entry === 'string' && entry !== 'null');
        if (typeof preferred === 'string') {
          schemaRecord.type = preferred;
        }
      }
    }

    for (const child of Object.values(record)) {
      normalizeTypeArrays(child);
    }
  };

  // OpenAPI 3.0 validators reject `nullable` when `type` is not defined.
  // zod-to-openapi may emit this on composed schemas (anyOf/allOf) or catch-all objects.
  const normalizeNullableWithoutType = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) normalizeNullableWithoutType(entry);
      return;
    }

    const record = value as Record<string, unknown>;
    const hasType = typeof record.type === 'string';
    if (record.nullable === true && !hasType) {
      delete record.nullable;
    }

    if (record.additionalProperties && typeof record.additionalProperties === 'object' && !Array.isArray(record.additionalProperties)) {
      const additionalProps = record.additionalProperties as Record<string, unknown>;
      if (Object.keys(additionalProps).length === 0) {
        record.additionalProperties = true;
      }
    }

    for (const child of Object.values(record)) {
      normalizeNullableWithoutType(child);
    }
  };

  // Some viewers prefer `examples` over singular `example` for response media types.
  const normalizeExamples = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) normalizeExamples(entry);
      return;
    }

    const record = value as Record<string, unknown>;
    const example = record.example;
    const examples = record.examples;
    if (example !== undefined && examples === undefined) {
      record.examples = {
        default: {
          value: example,
        },
      };
      delete record.example;
    }

    for (const child of Object.values(record)) {
      normalizeExamples(child);
    }
  };

  normalizeTypeArrays(doc.paths);
  normalizeTypeArrays(doc.components);
  normalizeNullableWithoutType(doc.paths);
  normalizeNullableWithoutType(doc.components);
  normalizeExamples(doc.paths);
  normalizeExamples(doc.components);
  return doc;
};

export const writeOpenApiSpec = () => {
  const outputDir = path.join(process.cwd(), 'openapi');
  const outputFile = path.join(outputDir, 'openapi.v1.json');
  const spec = buildOpenApiSpec();

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(spec, null, 2)}\n`, 'utf-8');

  return outputFile;
};

const outFile = writeOpenApiSpec();
console.log(`Wrote OpenAPI schema: ${outFile}`);
