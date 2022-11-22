export const queryString = {
  query: `query ChampionsInfo{
      info: queryChampionsV1Contents(top: 0){
          flatData{
              name
              slug
              antiDive
              burst
              control
              damage
              damageType
              divePotential
              engage
              gankDenial
              gankReliability
              gankTurnAround
              kite
              mobility
              pick
              poke
              preControl
              preDamage
              preMobility
              preToughness
              postControl
              postDamage
              postMobility
              postToughness
              skirmish
              split
              sustained
              tags
              toughness
              utility
              waveclear
              powerSpikes{
                  early
                  mid
                  late
                }
              key: riotId
              riotSlug
              difficultyLevel
              difficulty{
                  flatData{
                      slug
                      name
                      level
                    }
                }
            }
        }
    }`,
  variables: {},
};
