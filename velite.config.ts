import { defineCollection, defineConfig, s } from "velite";

const projects = defineCollection({
  name: "Project",
  pattern: "projects/*.md",
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug("projects"),
      summary: s.string().max(260),
      year: s.number().int().min(2015).max(new Date().getFullYear()),
      category: s.enum(["website", "esports", "app", "design"]),
      tags: s.array(s.string().max(28)).max(6),
      link: s.string().url().optional(),
      featured: s.boolean().default(false),
      body: s.markdown().optional(),
    })
    .transform((data) => ({
      ...data,
      label: `${data.category.toUpperCase()} · ${data.year}`,
    })),
});

export default defineConfig({
  root: "content",
  collections: { projects },
  output: {
    data: ".velite",
    assets: "public/static",
    // base: "data",
  },
});
