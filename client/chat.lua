
if Config.Chat and Config.Chat.enabled == false then return end

local isOpen = false

local function chatSettings()
    return Config.Chat or {}
end

local knownCommands = {}

local function refreshClientCommands()
    for _, cmd in ipairs(GetRegisteredCommands()) do
        knownCommands[string.lower(cmd.name)] = true
    end
end

RegisterNetEvent('codera-hud:chat:commandsList', function(names)
    if type(names) ~= 'table' then return end
    for name in pairs(names) do
        knownCommands[name] = true
    end
end)

CreateThread(function()
    Wait(1500) -- let other resources finish registering their commands first
    refreshClientCommands()
    TriggerServerEvent('codera-hud:chat:getCommands')

    while true do
        Wait(30000)
        refreshClientCommands()
        TriggerServerEvent('codera-hud:chat:getCommands')
    end
end)

local function openChat()
    if isOpen then return end
    if IsPauseMenuActive() then return end

    isOpen = true
  
    SetNuiFocus(true, false)
    SendNUIMessage({ action = 'chatOpen', maxLength = chatSettings().maxLength or 120 })
end

local function closeChatUI()
    if not isOpen then return end
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'chatClose' })
end



local commandName = 'codera_chat_open'
RegisterCommand(commandName, function()
    if not CoderaHud.loaded then return end
    openChat()
end, false)
RegisterKeyMapping(commandName, 'Open chat', 'keyboard', chatSettings().key or 'T')


RegisterNUICallback('codera_chat_close', function(_, cb)
    closeChatUI()
    cb('ok')
end)

RegisterNUICallback('codera_chat_send', function(data, cb)
    closeChatUI()
    cb('ok')

    local message = data and data.message
    if type(message) ~= 'string' then return end
    message = message:gsub('^%s+', ''):gsub('%s+$', '')
    if message == '' then return end

    if message:sub(1, 1) == '/' then

        ExecuteCommand(message:sub(2))
        return
    end

    local firstWord = message:match('^(%S+)')
    if firstWord and knownCommands[string.lower(firstWord)] then
   
        ExecuteCommand(message)
        return
    end

 
    TriggerEvent('chatMessage', GetPlayerName(PlayerId()), { 255, 255, 255 }, message)
    if WasEventCanceled() then return end

    TriggerServerEvent('codera-hud:chat:send', message)
end)


RegisterNetEvent('codera-hud:chat:addMessage', function(data)
    if type(data) ~= 'table' or type(data.message) ~= 'string' then return end
    SendNUIMessage({
        action = 'chatMessage',
        author = data.author or '',
        message = data.message,
        msgType = data.type or 'default',
        settings = chatSettings()
    })
end)

RegisterNetEvent('chat:addMessage', function(msg)
    if type(msg) ~= 'table' then return end
    local args = msg.args
    local author, message

    if type(args) == 'table' and #args >= 2 then
        author, message = tostring(args[1]), tostring(args[2])
    elseif type(args) == 'table' and #args == 1 then
        author, message = '', tostring(args[1])
    else
        return
    end

    SendNUIMessage({ action = 'chatMessage', author = author, message = message, settings = chatSettings() })
end)

RegisterNetEvent('chat:clear', function()
    SendNUIMessage({ action = 'chatClear' })
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    if isOpen then SetNuiFocus(false, false) end
end)
