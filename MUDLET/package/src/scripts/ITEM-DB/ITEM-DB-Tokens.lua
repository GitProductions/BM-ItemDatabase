-- Item DB - Core / Init (put this in a script that loads first)
itemdb = itemdb or {} -- safe creation: if already exists, keep it; else make new empty table
itemdb.token = itemdb.token or "" -- default to empty string (prevents nil errors later)

-- Helper function to check if token has been set at all yet..
function itemdb.checkToken()
    -- No need to re-init here if you did it globally at startup
    if not itemdb.token or itemdb.token == "" then
        cecho("<red>[ITEM DB] ERROR: Authentication token is not set!\n")
        cecho("<yellow>     Please set it using:  item-db-token YOUR_TOKEN_HERE\n")
        return false
    end

    -- Optional: basic sanity check (Bearer tokens are usually long hex)
    if #itemdb.token < 30 then
        cecho("<orange>[ITEM DB] Warning: Token looks suspiciously short — might be invalid.\n")
    end

    return true
end

-- Give user their token if needed for debug / etc
function itemdb.getToken()
    if not itemdb.token or itemdb.token == "" then
        cecho("<red>[ITEM DB] Token missing — set it with item-db-token <token>\n")
        return nil
    end
    return itemdb.token
end

-- Set User Token
function itemdb.setToken(token)
    if not token then
        cecho("<gray>ITEM-DB:<red> NO TOKEN FOUND, Check and try again")
    end

    cecho("<gray>ITEM-DB:<green> User Auth Token Set Successfully!")
    itemdb.token = token
end
