---
"@owlky/html": patch
---

Fix the HTML Data grid filter panel: choosing another column with a set filter while a set filter's checklist shows now builds that column's checklist, instead of throwing a `TypeError` and keeping the previous column's list.
