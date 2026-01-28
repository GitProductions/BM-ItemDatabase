## Blackmud Item Database (Next.js 16 + Tailwind CSS)

Item database created for the Blackmud Community.

### Prerequisites

- Node.js 18.20+ (LTS recommended)
- pnpm 10.x (project is configured for pnpm)

### Install

```bash
pnpm install
```


### Develop

```bash
pnpm dev
```

### Lint

```bash
pnpm lint
```

### Build for production

```bash
pnpm build
```


### Public API (for Mudlet or other clients)

# Auth for destructive actions
- Set `ADMIN_TOKEN` in `.env` (e.g., `ADMIN_TOKEN="SECRET_TOKEN"`).
- DELETE `/api/items` requires header `Authorization: Bearer <ADMIN_TOKEN>`.
- Regular GET/POST continue to allow read/add without the token.

# Search
curl "http://localhost:3000/api/items?q=broadsword&type=weapon&limit=20"

# Import identify dump
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"raw":"...identify output...","owner":"mudlet_user"}'

# Submit a single item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"item":{"name":"Shiny Dagger","keywords":"dagger shiny","type":"weapon","flags":["glow"],"stats":{"damage":"2d4","affects":[]}},"owner":"mudlet_user"}'





## Mudlet Alias to Search for Items in Game

pattern: `^search-db\s+(.+)$`
code: 
```lua
-- search-db <term>
local query = matches[2]:trim()
if query == "" then
    cecho("<orange>Usage: search-db <item name / keyword>\n")
    return
end

-- URL-encode query
local encoded = query:gsub("([^%w ])", function(c) return string.format("%%%02X", c:byte()) end):gsub(" ", "+")
local url = "https://bm-itemdb.gitago.dev/api/items?q=" .. encoded
cecho(string.format("<gray>Sending search for '<wheat>%s<gray>' → %s\n", query, url))

-- Success handler (named - automatically replaces previous registration)
registerNamedEventHandler("searchDb", "searchDbSuccess", "sysGetHttpDone", function(event, respUrl, body)
    if respUrl ~= url then return end
    
    cecho("<spring_green>──────────────────── Results for '" .. query .. "' ────────────────────\n\n")
    
    local ok, data = pcall(yajl.to_value, body)
    if not ok or type(data) ~= "table" or type(data.items) ~= "table" then
        cecho("<red>Failed to parse JSON.\n")
        cecho("<dark_orange>Raw snippet: " .. body:sub(1, 600) .. "\n")
        cecho("<spring_green>──────────────────────────────────────\n")
        return
    end
    
    if #data.items == 0 then
        cecho("<khaki>No items match '" .. query .. "'.\n\n")
    else
        for i, item in ipairs(data.items) do
            local name = item.name or "<unknown>"
            local owner = item.owner or "?"
            
            -- Calculate available space for the title
            local available_width = 58
            local submitted_text = " Submitted by: "
            
            -- Calculate space needed for owner section
            local owner_section = ""
            if owner ~= "?" then
                owner_section = submitted_text .. owner
            end
            
            -- Calculate how much space we have for the name
            local owner_section_len = utf8.len(owner_section)
            local name_max_width = available_width - owner_section_len
            
            -- Truncate name if needed
            local display_name = name
            if utf8.len(name) > name_max_width then
                display_name = utf8.sub(name, 1, name_max_width - 3) .. "..."
            end
            
            -- Build title with proper spacing
            local title = string.format("<wheat>%s", display_name)
            if owner ~= "?" then
                -- Add padding between name and owner
                local padding_needed = available_width - utf8.len(display_name) - owner_section_len
                title = title .. string.rep(" ", padding_needed) .. "<gray>" .. owner_section
            else
                -- Just pad the name to fill the width
                local padding_needed = available_width - utf8.len(display_name)
                title = title .. string.rep(" ", padding_needed)
            end
            
            -- Top border + title
            cecho("<light_blue>┌────────────────────────────────────────────────────────────┐\n")
            cecho("<light_blue>│ " .. title .. "\n")
            
            -- Separator under title
            cecho("<light_blue>├────────────────────────────────────────────────────────────┤\n")
            
            -- Raw lines (content)
            if type(item.raw) == "table" and #item.raw > 0 then
                for _, line in ipairs(item.raw) do
                    -- Pad/truncate to fit ~58 chars wide
                    local padded = line
                    local line_len = utf8.len(line)
                    if line_len < 58 then
                        padded = line .. string.rep(" ", 58 - line_len)
                    elseif line_len > 58 then
                        padded = utf8.sub(line, 1, 55) .. "..."
                    end
                    cecho(string.format("<light_blue>│ <white>%s\n", padded))
                end
            else
                cecho("<light_blue>│ <khaki> (No raw identify lines available)\n")
            end
            
            -- Bottom border
            cecho("<light_blue>└────────────────────────────────────────────────────────────┘\n\n")
        end
    end
    cecho("<spring_green>────────────────────────────────────────────────────────────────────────────\n")
end)

-- Error handler (named)
registerNamedEventHandler("searchDb", "searchDbError", "sysGetHttpError", function(event, errMsg, respUrl)
    if respUrl ~= url then return end
    cecho("<red>Request failed: " .. (errMsg or "unknown error") .. "\n")
end)

tempTimer(0.05, function() getHTTP(url) end)
```



## Mudlet Script - Item Submission
