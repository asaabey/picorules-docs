# Working with Ruleblocks

Ruleblocks are the atomic Picorules units. Each file named `<blockid>.prb` declares metadata with `#define_ruleblock()` and lists the functional statements followed by conditional logic. The compiled SQL writes to a table named `rout_<blockid>`.

## File and Output Naming

- **Ruleblock files** – `ckd.prb`, `rrt.prb`, etc.
- **Output tables** – `rout_ckd`, `rout_rrt`, matching the ruleblock ID.
- Cross-ruleblock dependencies are referenced using the `rout_` prefix (for example, `rout_ckd.ckd`).

## Common Ruleblock Types

| Type | Description | Example Contents |
|------|-------------|------------------|
| Global/interface | Aggregates signals from multiple ruleblocks, sets demographic context, exposes high-level filters. | `global.prb` |
| Diagnostic | Focus on a specific condition (e.g., CKD diagnostics) and collect labs/imaging using `lastdv` helpers. | `ckd_diagnostics.prb` |
| Risk assessment | Combine multiple boolean inputs into risk scores or cohort flags. | `at_risk.prb`, `cvra_predict1_aus.prb` |

## Variable Naming Conventions

- `*_ld` – last date (e.g., `aki_ld`, `opt_out_ld`).
- `*_last` – last value (e.g., `hb_last`).
- `is_*` – boolean flags (`is_active`, `is_anaemic`).
- `cd_*` – cardiovascular domain prefixes; `tkc_*` – TKC-specific outputs.

These conventions make dependency graphs easier to reason about and align with the CSV catalog exported by `extract_variables.py`.

## Citations and Documentation

- Citation snippets live in `picodomain_rule_pack/citations/` and use filenames like `<context>_ref<n>.citation.txt`.
- A ruleblock references citations inside `#doc()` directives, keeping clinical justification close to the logic.

## Workflow for Updates

1. Edit/create the `.prb` file inside `picodomain_rule_pack/rule_blocks/`.
2. Ensure the `#define_ruleblock()` directive is present and accurate.
3. Define all functional statements before declaring dependent conditional logic.
4. Add `#define_attribute()` entries for outputs along with `#doc()` text and citations.
5. Reference any new citations in `picodomain_rule_pack/citations/`.

Following this order keeps ruleblocks compiler-friendly and mirrors the expectations documented in `CLAUDE.md`.
