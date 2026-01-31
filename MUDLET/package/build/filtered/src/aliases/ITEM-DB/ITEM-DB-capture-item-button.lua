-- alias: ITEM-DB-capture-item-button
cecho("Item-DB:<light_blue>Submit Item: ")
cechoLink("<green><b>[ Open Inventory ]</b>", function()
    cecho("Preparing to submit item...\n")
    cecho("<yellow>Select the item from your inventory:\n\n")

    itemdb.startItemSelection(15)
    send("i")
end, "Item-DB: Click to submit item", true)

cecho("  ") -- spacing

cechoLink("<red><b>[ CANCEL ]</b>", function()
    cecho("<yellow>Item submission cancelled.\n")
    itemdb.cancelItemSelection(true)
end, "Item-DB: Cancel and discard this item", true)
cecho("\n\n")
