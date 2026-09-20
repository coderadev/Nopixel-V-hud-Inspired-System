<img width="1919" height="1079" alt="Screenshot 2026-09-20 072331" src="https://github.com/user-attachments/assets/3fb5c70e-8c9f-4214-91e8-0824823ae20b" />
<img width="1919" height="1079" alt="Screenshot 2026-09-20 064125" src="https://github.com/user-attachments/assets/c2b1bdf2-e358-46b1-95f2-1968f38df5eb" />


# Codera HUD

**Codera HUD** (`codera-hud`) is a QBCore / ESX / Qbox compatible HUD resource for FiveM.
It replaces the native GTA HUD with a single, fully client-side package that includes:

- Player status HUD (health, armor, hunger, thirst, stamina, oxygen, voice, weapon/ammo, crosshair)
- Vehicle HUD (speed, gear, fuel, engine, lights, seatbelt, lock status)
- Circular minimap with compass, heading, street/zone name and waypoint distance
- A personal `/hudsettings` menu where every player can move, resize, hide and configure
  the HUD to their own taste — saved locally, no database required

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Voice integration (pma-voice / qb-voice)](#voice-integration-pma-voice--qb-voice)
- [Framework integration](#framework-integration)
- [Seatbelt integration (qb-smallresources)](#seatbelt-integration-qb-smallresources)
- [Vehicle lock integration (qb-vehiclekeys)](#vehicle-lock-integration-qb-vehiclekeys)
- [Minimap calibration](#minimap-calibration)
- [Minimap zoom](#minimap-zoom)
- [HUD settings menu (/hudsettings)](#hud-settings-menu-hudsettings)
- [Troubleshooting](#troubleshooting)
- [Resource layout](#resource-layout)

## Features

- Health and armor bars
- Hunger and thirst indicators (QBCore/Qbox metadata or `esx_status`)
- Stamina indicator while running/sprinting, and an underwater oxygen indicator
- Voice indicator: proximity range, talking state and radio state
  (supports **pma-voice** and **qb-voice**)
- Weapon and ammo display, with an optional custom aiming crosshair
- Vehicle speed, gear, fuel, engine condition and light status
- Seatbelt / racing harness status (via `qb-smallresources`)
- Vehicle lock status (compatible with `qb-vehiclekeys` and any resource that uses
  GTA's native door-lock state)
- Circular minimap with a smooth compass, heading, zone/street name and a custom
  waypoint direction + distance indicator
- Safezone calibration warning
- Cinematic mode command
- `/hudsettings` personal menu: drag and resize every element, hide the parts you
  don't want, pick MPH/KM/H and adjust the overall HUD opacity — saved per player

## Requirements

- A supported framework: **QBCore**, **ESX**, or **Qbox**
- `oxmysql`/database is **not** required — this resource has no database of its own
- Optional: `qb-smallresources` (seatbelt), `qb-vehiclekeys` (vehicle locks),
  `pma-voice` or `qb-voice` (voice indicator)

### Framework

Pick one framework in `config.lua`:

```lua
Config.Framework = 'qbcore' -- 'qbcore', 'esx' or 'qbox'
```

- `qbcore` reads `qb-core` player metadata and `qb-smallresources` for seatbelt state.
- `esx` reads `es_extended` and listens to `esx_status` for hunger/thirst.
- `qbox` reads `qbx_core` player metadata.

Resource names can be remapped through `Config.FrameworkResources` and
`Config.SeatbeltResources` if your server uses different resource names.

## Installation

1. Copy the folder into your server's `resources` directory and keep it named
   `codera-hud`.
2. Set `Config.Framework` in `config.lua` to match your server (`qbcore`, `esx`
   or `qbox`).
3. Add it to `server.cfg`, starting dependencies first:

   ```cfg
   ensure qb-core
   ensure qb-smallresources
   ensure qb-vehiclekeys
   ensure pma-voice        -- or: ensure qb-voice
   ensure codera-hud
   ```

   `qb-smallresources`, `qb-vehiclekeys` and the voice resource are all optional —
   omit any of them your server doesn't use.
4. Disable any other HUD or minimap resource so the two don't draw over each other.
5. Restart the server, or restart resources in dependency order:

   ```text
   restart qb-smallresources
   restart codera-hud
   ```
6. In the GTA display settings, set **Safezone Size** all the way to the right.
   The HUD shows an on-screen calibration warning if the value is too low.

## Configuration

Every setting lives in `config.lua` and is read directly by the client scripts.

### Commands

```lua
Config.Commands = {
    cinematic   = 'cinematic',
    hudsettings = 'hudsettings'
}
```

- `/hudsettings` — opens the personal HUD settings menu.
- `/cinematic` — toggles cinematic mode (hides the HUD, shows letterbox bars).
  Can also be triggered with the `hud:client:ToggleCinematic` client event.

Both command names can be changed here.

### Update intervals

```lua
Config.Intervals = {
    player          = 200,  -- health, armor, needs, voice, stamina and weapon data
    vehicle         = 50,   -- vehicle data while driving
    vehicleIdle     = 250,  -- vehicle presence check while on foot
    compassHeading  = 25,   -- camera heading target (NUI smooths it between updates)
    compassDetails  = 250,  -- street, zone and waypoint distance/direction
    minimap         = 1000  -- resolution and safezone checks
}
```

All values are in milliseconds. The defaults are tuned for a good balance between
responsiveness and client performance. NUI messages are only sent when a value
actually changes, regardless of interval.

### Speed display

```lua
Config.SpeedMultiplier = 2.236936  -- m/s -> MPH
Config.SpeedUnit       = 'MPH'
Config.MaxSpeed        = 160       -- speed at which the outer arc is 100% full
```

For metric units:

```lua
Config.SpeedMultiplier = 3.6       -- m/s -> KM/H
Config.SpeedUnit       = 'KM/H'
Config.MaxSpeed        = 260
```

`Config.MaxSpeed` only affects the outer speed arc's fill percentage — it does not
cap the vehicle's actual speed.

### Safezone warning

```lua
Config.ShowSafezoneWarning = true
Config.RequiredSafezone    = 0.99
```

Set `ShowSafezoneWarning` to `false` to disable the calibration screen entirely.
`RequiredSafezone` is the minimum GTA safezone value the HUD will accept.

### Custom crosshair

```lua
Config.UseCustomCrosshair = true
```

Set to `false` to keep GTA's default aiming reticle instead.

### Minimap zoom defaults

```lua
Config.MapZoom     = 0     -- 0 = game default
Config.MapZoomStep = 100
Config.MapZoomMin  = 300
Config.MapZoomMax  = 1400
```

A player's own zoom choice (set with `/vhudzoom`) is saved and overrides this default.

### Settings menu branding

```lua
Config.SettingsBrand = 'CODERA HUD'
```

Text shown in the footer of the `/hudsettings` menu ("`<name>` / Personal settings").

## Voice integration (pma-voice / qb-voice)

Both **pma-voice** and **qb-voice** are supported automatically — `qb-voice` uses
the same state bags and client events as `pma-voice`, just under a different
resource name.

```lua
Config.VoiceResource = 'auto' -- 'auto', 'pma-voice' or 'qb-voice'
```

- `'auto'` (default) detects whichever resource is actually started. If both are
  somehow running, `pma-voice` takes priority.
- Set it explicitly only if you renamed your voice resource or want to force one.

How it works under the hood:

- **Proximity mode** is read from the `LocalPlayer.state.proximity` state bag,
  which both resources set in the same format (`{ index, distance, name }`).
- **Talking state** is read from the native `NetworkIsPlayerTalking`, which works
  regardless of which voice resource is running.
- **Radio state** is received from either `pma-voice:radioActive` or
  `qb-voice:radioActive` — both are always listened for, and only the one your
  server actually runs will ever fire.

While a player is transmitting on the radio, only the microphone icon and its
outer ring switch to the active/red state.

If neither voice resource is detected as started, the server console prints a
warning on startup and the voice indicator falls back to a default proximity mode.

## Framework integration

### Needs (hunger/thirst)

QBCore/Qbox: read automatically from player metadata, and refreshed on the
standard event:

```lua
TriggerEvent('hud:client:UpdateNeeds', hunger, thirst)
```

Both values must be numbers between `0` and `100`. This is the same event used by
default QBCore metadata updates and `qb-smallresources` consumables, so no extra
setup is needed on a stock QBCore/Qbox server.

ESX: read from `esx_status` automatically.

## Seatbelt integration (qb-smallresources)

`qb-smallresources` remains the sole owner of the seatbelt system: the default
`B` keybind, the `/toggleseatbelt` command, buckle/unbuckle sounds, exit-control
blocking, crash/ejection behavior, and racing harness durability all still live
there.

Codera HUD does **not** register its own seatbelt command. It listens for the
`seatbelt:client:ToggleSeatbelt` event, then reads `HasSeatbeltOn()` and
`HasHarness()` from `qb-smallresources` and reflects that state on the vehicle HUD.

If the seatbelt icon stops responding after an update, restart
`qb-smallresources` first, then `codera-hud`, and double-check the
`toggleseatbelt` keybind in the FiveM key binding menu (bindings are stored
locally per player).

## Vehicle lock integration (qb-vehiclekeys)

No changes or exports are needed inside `qb-vehiclekeys`. It applies lock changes
to the vehicle using GTA's native door-lock state, and Codera HUD simply reads
that state with `GetVehicleDoorLockStatus()` / `GetVehicleDoorsLockedForPlayer()`
while the player is inside the vehicle. This means any resource that uses the
native lock state — not just `qb-vehiclekeys` — will work.

## Minimap calibration

If the map isn't centered inside the compass ring, run `/vhudmap` in-game:

- Arrow keys — move the map (hold `Shift` for large steps, `Ctrl` for tiny steps)
- `Page Up` / `Page Down` — resize the map
- `Enter` — save, `Backspace` — cancel
- `Q` / `E` — narrow/widen the map if it looks oval
- `/vhudmap reset` — restore default calibration
- `/vhudmap debug` — print resolution, safezone and alignment values (F8 console
  and on-screen for 20 seconds)

## Minimap zoom

```text
/vhudzoom in
/vhudzoom out
/vhudzoom <300-1400>
/vhudzoom reset
```

Default keys are `=` (zoom in) and `-` (zoom out) — rebind them under FiveM key
bindings if needed. A higher number shows more of the map. Each player's choice is
saved locally; the server-wide default is `Config.MapZoom`.

## HUD settings menu (/hudsettings)

Opens once the character is loaded. Everything is saved per player using FiveM's
resource KVP storage, so it survives relogs and server restarts without touching
any database.

| Tab | What it does |
| --- | --- |
| HUD layout | Live layout editor — click an element, drag it anywhere, resize with the slider. Arrow keys nudge by 1px (`Shift` = 10px). |
| Map & compass | Show/hide the minimap, heading degrees, street/zone name and waypoint distance. Minimap zoom and calibration shortcuts. |
| Player status | Voice indicator, armor bar, hunger/thirst, stamina bar, ammo counter, custom crosshair. |
| Vehicle | Speed unit (Auto / MPH / KM/H), gear, fuel gauge, status icons. |
| General | HUD opacity, snap-to-grid for the layout editor, cinematic mode button. |

- **Reset HUD** — restores every element's default position and size.
- **Reset all settings** — restores every option plus minimap zoom and calibration.
  Both buttons require a confirmation click.
- Speed unit `Auto` follows `Config.SpeedMultiplier` / `Config.SpeedUnit`; the other
  two options convert `Config.MaxSpeed` for you.
- The footer brand text comes from `Config.SettingsBrand`.
- Other resources can open the menu programmatically:
  `TriggerEvent('hud:client:OpenSettings')`.

The native GTA minimap always follows the compass ring; while dragging the compass
in the layout editor, the map catches up as soon as you release it.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Native GTA health/armor bars show under the minimap | Restart `codera-hud` — it suppresses those scaleform elements every frame. |
| Seatbelt icon doesn't change | Restart `qb-smallresources` **before** `codera-hud`, then check the `toggleseatbelt` keybind. |
| Vehicle lock icon doesn't change | Confirm your vehicle-key resource updates the native door-lock state (stock `qb-vehiclekeys` does). |
| Voice icon stuck / radio state never activates | Make sure `pma-voice` or `qb-voice` is started **before** `codera-hud`, and that `Config.VoiceResource` matches what you run (or leave it on `'auto'`). |
| HUD elements are misaligned | Set GTA's Safezone Size to maximum in display settings. |
| Duplicate HUD elements appear | Stop any other HUD/minimap resource running alongside this one. |

## Resource layout

```text
codera-hud/
|-- client/
|   |-- main.lua       -- framework bridge, shared state, cinematic mode, voice detection
|   |-- settings.lua   -- /hudsettings menu, persisted KVP settings
|   |-- player.lua     -- health/armor/needs/voice/stamina/weapon data
|   |-- vehicle.lua    -- vehicle HUD data
|   |-- minimap.lua    -- circular minimap, compass, calibration
|   `-- zoom.lua       -- minimap zoom (/vhudzoom)
|-- server/
|   `-- main.lua       -- startup checks and console warnings
|-- stream/
|   `-- circlemap_codera.ytd
|-- audiodirectory/
|   `-- seatbelt_sounds.awc
|-- data/
|   `-- seatbelt_sounds.dat54.rel
|-- web/
|   |-- css/
|   |-- fonts/
|   |-- js/
|   `-- index.html
|-- config.lua
|-- fxmanifest.lua
`-- README.md
```
