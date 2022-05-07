# League Custom DDragon

[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/OchreFox/league-custom-ddragon/badge)](https://www.jsdelivr.com/package/gh/OchreFox/league-custom-ddragon) [![Build items.json](https://github.com/OchreFox/league-custom-ddragon/actions/workflows/items.yml/badge.svg)](https://github.com/OchreFox/league-custom-ddragon/actions/workflows/items.yml) ![latest](https://img.shields.io/badge/dynamic/json?style=flat-square&logo=riotgames&color=informational&label=DDragon%20latest%20version&query=%24%5B0%5D&url=https%3A%2F%2Fddragon.leagueoflegends.com%2Fapi%2Fversions.json)

This GitHub action creates custom versions of DDragon JSON files for other league-related projects

## Inputs

Currently, this action only creates a custom `items.json` file from a combination of different endpoints:

```json
{
    "Blitz": "https://blitz-cdn-plain.blitz.gg/blitz/ddragon/:latest/data/en_US/items.json",
    "Meraki Analytics": "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/items.json",
    "CommunityDragon": "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json"
}
```

## Outputs

Releases the items.json file to be served.
You can check the CDN version of the latest file here: <https://cdn.jsdelivr.net/gh/OchreFox/league-custom-ddragon@main/data/latest/items.json>

### `items.json`

The custom-merged JSON file to serve and to be consumed by other league-related repositories.
