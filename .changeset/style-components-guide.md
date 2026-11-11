---
"@owlky/mcp": minor
---

Foundations › Settings: a "Style components" guide (also served by `get_guide`): override component styles from unlayered CSS that reads the `--ok-*` tokens (no `!important`: Owlky's rules sit in `@layer components` with zero specificity), follow states with `[data-ok-open]`, `[aria-expanded]`, `:focus-visible` and `:disabled`, time `@keyframes` with the motion tokens, and use Tailwind CSS utilities and variants. A new **Styled** story shows each technique.
