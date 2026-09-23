
if Config.Chat and Config.Chat.enabled == false then return end

local maxLength = (Config.Chat and Config.Chat.maxLength) or 120

RegisterServerEvent('codera-hud:chat:send')
AddEventHandler('codera-hud:chat:send', function(message)
    local src = source

    if type(message) ~= 'string' then return end
    message = message:gsub('^%s+', ''):gsub('%s+$', '')
    if message == '' then return end
    if #message > maxLength then message = message:sub(1, maxLength) end

    local author = GetPlayerName(src) or ('Player ' .. tostring(src))

    TriggerEvent('chatMessage', src, author, message)
    if WasEventCanceled() then return end

    TriggerClientEvent('codera-hud:chat:addMessage', -1, { author = author, message = message })
end)


RegisterServerEvent('codera-hud:chat:getCommands')
AddEventHandler('codera-hud:chat:getCommands', function()
    local src = source
    local names = {}
    for _, cmd in ipairs(GetRegisteredCommands()) do
        names[string.lower(cmd.name)] = true
    end
    TriggerClientEvent('codera-hud:chat:commandsList', src, names)
end)


local function trimmedArgs(args)
    return (table.concat(args, ' '):gsub('^%s+', ''):gsub('%s+$', ''))
end

RegisterCommand('me', function(source, args)
    local src = source
    if src == 0 then return end -- no console equivalent for an in-game action

    local message = trimmedArgs(args)
    if message == '' then return end
    if #message > maxLength then message = message:sub(1, maxLength) end

    local author = GetPlayerName(src) or ('Player ' .. tostring(src))
    local text = ('%s %s'):format(author, message)

    TriggerClientEvent('codera-hud:chat:addMessage', -1, { message = text, type = 'me' })
end, false)

RegisterCommand('ooc', function(source, args)
    local src = source
    if src == 0 then return end

    local message = trimmedArgs(args)
    if message == '' then return end
    if #message > maxLength then message = message:sub(1, maxLength) end

    local author = GetPlayerName(src) or ('Player ' .. tostring(src))

    TriggerClientEvent('codera-hud:chat:addMessage', -1, {
        author = '(( OOC ))',
        message = ('%s: %s'):format(author, message),
        type = 'ooc'
    })
end, false)
