// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextModeTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "short-lived" }),
  tagCache: d1NextModeTagCache,
  queue: doQueue,
});


// export default defineCloudflareConfig({

// });


// export default {
// default: {
//     override: {
//       wrapper: "cloudflare-node",
//       converter: "edge",
//       proxyExternalRequest: "fetch",
//       incrementalCache: "dummy",
//       tagCache: "dummy",
//       queue: "dummy"
//     },
//   },
//   edgeExternals: ["node:crypto"],
//   middleware: {
//     external: true,
//     override: {
//       wrapper: "cloudflare-edge",
//       converter: "edge",
//       proxyExternalRequest: "fetch",
//       incrementalCache: "dummy",
//       tagCache: "dummy",
//       queue: "dummy" 
//     },
//   },
// };
