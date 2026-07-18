# YARA repository recovery report

Recovery date: 2026-07-18

## Canonical repository

`/Users/usmanfahim08/Documents/GitHub/yaraproduction`

Selected because it is outside `.Trash`, is the normal GitHub Desktop location, contains the real YARA history, and points to `https://github.com/fahimusman5-prog/yaraproduction.git`. It was clean on `main` at `6dac366` before recovery.

## Repository comparison

| Repository | Branch / commit | Remote | `5e1094c` | Working tree | Assessment |
|---|---|---|---|---|---|
| `/Users/usmanfahim08/Documents/GitHub/yaraproduction` | `main` / `6dac366` | `fahimusman5-prog/yaraproduction` | No before recovery | Clean | Canonical and safe to use |
| `/Users/usmanfahim08/Library/Mobile Documents/.Trash/yaraproduction` | `agent/launch-readiness` / `5e1094c` | `fahimusman5-prog/yaraproduction` | Yes | Clean | Recovery source only; do not develop here |
| `/Users/usmanfahim08/Library/Mobile Documents/com~apple~CloudDocs/Documents/yara` | `main` / `9ef66cc` | `fahimusman5-prog/yara` | No | Dirty; generated `.next` deletions and audit artifact | Older mirror; not canonical and not safe for recovery |

No production environment values were inspected or copied. The iCloud mirror contains no relevant current launch commit and has a different GitHub repository remote, so its generated-file deletions and uncommitted audit file were intentionally excluded.

## Recovery protection

- Recovery patch created at `/tmp/yara-launch-readiness-5e1094c.patch` with mode `600`.
- Trash repository had no uncommitted changes after `5e1094c`.
- Canonical repository had no uncommitted user changes before recovery.
- No `.env`, `.next`, `node_modules`, caches, logs, or deployment artifacts were included in the recovery patch.

## Recovery action

The compatible parent history was confirmed: `5e1094c` is based directly on canonical commit `6dac366`. The commit is safe to cherry-pick into the canonical repository. No blind folder copy, reset, force-push, deletion, or production-data operation is permitted.

## Completed recovery

Commit `5e1094c` was cherry-picked without conflicts into the canonical repository as `e2529f7`. A follow-up recovery commit `d81bae1` added this report and `.nvmrc`. All further work is being performed only in `/Users/usmanfahim08/Documents/GitHub/yaraproduction`.
