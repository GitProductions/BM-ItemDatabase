/* eslint-disable import/no-anonymous-default-export, @typescript-eslint/no-unused-vars */
// import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
// import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// export default defineCloudflareConfig({
//   incrementalCache: r2IncrementalCache,
//   queue: doQueue,
// });

// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

// export default defineCloudflareConfig({
//   incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
//   queue: doQueue,
// });

export default {
default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy"
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy" 
    },
  },
};
