---
"@owlky/core": minor
---

Add the illustration parts to `@owlky/core/illustrations`: `backdrop()`, `groundShadow()`, `sparkle()`, `dot()`, `cloud()`, `plant()`, `lines()`, `paper()`, `screen()` and `person()` return illustration nodes in the style of the set, so your own art can match it (`illustrationParts` lists the part names, and `IllustrationNode` gains an optional `part` field that renderers ignore). The built-in illustrations are now composed from these parts; their markup is unchanged.
