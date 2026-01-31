-- Item DB - Core helpers and shared state
itemdb = itemdb or {}

itemdb.state = itemdb.state or {
    captureActive = false,
    captureLines = {},
    captureName = nil,
    selectingInventoryItem = false,
    submitTimer = nil,
    searchCurrentUrl = nil,
    searchCurrentQuery = nil,
    searchHandlersRegistered = false
}

local function resetCaptureLines()
    itemdb.state.captureLines = {}
    itemdb.state.captureName = nil
end

function itemdb.startIdentifyCapture()
    if itemdb.state.selectingInventoryItem then
        cecho("<orange>[New identify detected - cancelling previous submission]\n")
        itemdb.cancelItemSelection(true)
    end

    itemdb.state.captureActive = true
    resetCaptureLines()
    cecho("<gray>[Identify capture started...]\n")
    setTriggerStayOpen("IdentifyStart", 99)
end

function itemdb.captureIdentifyLine(line)
    if not (itemdb.state.captureActive and line) then
        return
    end

    local trimmed = line:gsub("^%s+", ""):gsub("%s+$", "")
    if string.find(line, "You recite a scroll of identify", 1, true) or trimmed:match("^You feel informed:") or trimmed ==
        "" or (trimmed:match("^<") and trimmed:match("%d") and trimmed:match(">$")) or
        (#itemdb.state.captureLines > 0 and trimmed ==
            itemdb.state.captureLines[#itemdb.state.captureLines]:gsub("^%s+", ""):gsub("%s+$", "")) then
        setTriggerStayOpen("IdentifyStart", 1)
        return
    end

    table.insert(itemdb.state.captureLines, line)

    if not itemdb.state.captureName then
        local n = line:match("Object '([^']+)'")
        if n then
            itemdb.state.captureName = n
        end
    end

    setTriggerStayOpen("IdentifyStart", 1)
end

function itemdb.finishIdentifyCapture()
    if not itemdb.state.captureActive then
        return
    end

    setTriggerStayOpen("IdentifyStart", 0)
    itemdb.state.captureActive = false

    local count = #itemdb.state.captureLines
    if count > 0 then
        cecho("<cyan>+----------------- Item Identified -----------------+\n")
        for _, l in ipairs(itemdb.state.captureLines) do
            cecho("<cyan>| <white>" .. l .. "\n")
        end
        cecho("<cyan>+---------------------------------------------------+\n\n")
    else
        cecho("<orange>No useful lines captured?\n")
    end

    expandAlias("capture-item-button")
    resetCaptureLines()
end

function itemdb.startItemSelection(timeoutSeconds)
    itemdb.state.selectingInventoryItem = true

    if itemdb.state.submitTimer then
        killTimer(itemdb.state.submitTimer)
    end

    itemdb.state.submitTimer = tempTimer(timeoutSeconds or 15, function()
        if itemdb.state.selectingInventoryItem then
            cecho("\n<red>[TIMEOUT] Item submission cancelled automatically.\n")
            itemdb.cancelItemSelection(true)
        end
    end)
end

function itemdb.cancelItemSelection(clearCapture)
    itemdb.state.selectingInventoryItem = false

    if itemdb.state.submitTimer then
        killTimer(itemdb.state.submitTimer)
        itemdb.state.submitTimer = nil
    end

    if clearCapture then
        resetCaptureLines()
    end
end

function itemdb.submitCapturedItem(itemLine)
    if not itemdb.state.selectingInventoryItem then
        cecho("<red>No item selection in progress.\n")
        return
    end

    if not itemdb.state.captureLines or #itemdb.state.captureLines == 0 then
        cecho("<red>ERROR: No identify data captured! Please identify an item first.\n")
        return
    end

    if not itemdb.checkToken or not itemdb.checkToken() then
        return
    end

    local identifyOutput = table.concat(itemdb.state.captureLines, "\n")
    local completeData = itemLine .. "\n" .. identifyOutput

    local url = "https://bm-itemdb.gitago.dev/api/items"
    local headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. itemdb.token
    }

    local body = yajl.to_string({
        raw = completeData
    })

    postHTTP(body, url, headers)
    cecho("<cyan>[ITEM DB] Submitted successfully!\n")

    itemdb.cancelItemSelection(true)
end

-- Search helpers
local function handleSearchSuccess(event, respUrl, body)
    if respUrl ~= itemdb.state.searchCurrentUrl then
        return
    end

    local query = itemdb.state.searchCurrentQuery or "unknown"
    cecho(string.format("<spring_green>-------------------- Results for '%s' --------------------\n\n", query))

    local ok, data = pcall(yajl.to_value, body)
    if not ok or type(data) ~= "table" or type(data.items) ~= "table" then
        cecho("<red>Failed to parse results.\n")
        return
    end

    if #data.items == 0 then
        cecho("<khaki>No items found.\n\n")
        return
    end

    for i, item in ipairs(data.items) do
        local name = item.name or "<unknown>"
        local owner = item.owner or "?"
        cecho(string.format("<light_blue>[%d] <wheat>%s <gray>(submitted by %s)\n", i, name, owner))

        if type(item.raw) == "table" and #item.raw > 0 then
            for _, line in ipairs(item.raw) do
                cecho(string.format("<light_blue>  > <white>%s\n", line))
            end
        else
            cecho("<light_blue>  > <khaki>(No data available)\n")
        end

        cecho("<light_blue>------------------------------------------------------------\n")
    end
end

local function handleSearchError(event, errMsg, respUrl)
    if respUrl ~= itemdb.state.searchCurrentUrl then
        return
    end
    cecho("<red>Search failed: " .. (errMsg or "unknown") .. "\n")
end

local function registerSearchHandlers()
    if itemdb.state.searchHandlersRegistered then
        return
    end

    registerNamedEventHandler("itemdb.search", "itemdbSearchSuccess", "sysGetHttpDone", handleSearchSuccess)
    registerNamedEventHandler("itemdb.search", "itemdbSearchError", "sysGetHttpError", handleSearchError)

    itemdb.state.searchHandlersRegistered = true
end

function itemdb.searchItems(query)
    query = (query or ""):trim()
    if query == "" then
        cecho("<orange>Usage: search-db <item name / keyword>\n")
        return
    end

    local encoded = query:gsub("([^%w ])", function(c)
        return string.format("%%%02X", c:byte())
    end):gsub(" ", "+")

    local url = "https://bm-itemdb.gitago.dev/api/items?q=" .. encoded
    itemdb.state.searchCurrentUrl = url
    itemdb.state.searchCurrentQuery = query

    registerSearchHandlers()

    cecho(string.format("<gray>Searching for '<wheat>%s<gray>'...\n", query))
    tempTimer(0.05, function()
        getHTTP(url)
    end)
end
