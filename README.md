# League Custom DDragon

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

### `items.json`

The custom-merged JSON file to serve and to be consumed by other league-related repositories.
