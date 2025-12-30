# Picorules Overview

Picorules is a lightweight domain-specific language used at TKC (The Kidney Centre) to describe clinical decision support logic that ultimately runs as SQL inside the EADV (Entity-Attribute-Date-Value) model. Each Picorules statement compiles to CTE-driven SQL that returns one row per patient (identified by `eid`) while hiding manual `SELECT`, `JOIN`, and windowing boilerplate.

## Key Capabilities

- Compiles to dynamic SQL at runtime so logic authors do not maintain SQL files.
- Abstracts CTE generation, self-joins, and window functions while still producing deterministic SQL pipelines.
- Operates on EADV tables where every clinical fact is stored as `(eid, att, dt, val)`.
- Supports statement-level composition, letting authors chain functional data pulls with conditional logic transformations.

## Repository Layout

The `tkc-picorules-rules` repository keeps everything Picorules-related in one place:

```
tkc-picorules-rules/
├── picodomain_rule_pack/
│   ├── rule_blocks/       # Picorules .prb source files (~100+)
│   └── citations/         # Reference snippets used in documentation directives
├── picodomain_template_pack/
│   └── template_blocks/   # ~218 dashboard templates (.json metadata + .txt markup)
├── deprecated ruleblock scripts/  # Legacy SQL kept for reference
├── Documentation/         # Deep language specification and walkthroughs
└── README.md              # Introductory overview of Picorules
```

Ruleblocks (`.prb`) hold the executable DSL. Template packs define how data is shown in TKC dashboards, and citation files house the text referenced via `#doc()` directives.

## Architecture Concepts

### EADV Model
The EADV schema stores every clinical signal using four columns:
- **Entity (`eid`)** – the patient identifier.
- **Attribute (`att`)** – what was observed (e.g., `lab_bld_hb`).
- **Date (`dt`)** – when it was captured.
- **Value (`val`)** – the recorded measurement or categorical value.

Functional statements pull filtered slices of this model with helper functions such as `.last()` or `.lastdv()` to retrieve the most recent value and date pair.

### Compilation Flow
1. Picorules compiler parses each `.prb` file, including metadata directives.
2. Functional statements (`=>`) become SQL CTEs that select and window EADV data.
3. Conditional statements (`:`) become SQL `CASE` expressions referencing previously defined variables.
4. The compiler joins every generated CTE on `eid` and emits a final `SELECT` that populates an output table named `rout_<ruleblock>`.

### Ruleblock Chaining
Ruleblocks can reuse outputs from other ruleblocks via `.bind()`:

```javascript
ckd => rout_ckd.ckd.val.bind();
```

This pattern enables modular, composable clinical logic. Binding is commonly prefixed with `rout_` to denote cross-ruleblock dependencies.

### Why Use Picorules?

- **Consistency** – Domain authors reason about clinical decisions once and reuse them across dashboards and downstream analytics.
- **Safety** – Compiler enforcement of statement ordering (functional before conditional) avoids referencing undefined variables.
- **Documentation** – Directives like `#doc()` and `#define_attribute()` keep metadata collocated with executable code.
