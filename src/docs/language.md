# Picorules Language

Picorules exposes a compact syntax with two primary statement types plus compiler directives for metadata. Every line ends with a semicolon.

## Statement Types

### Functional Statements (`=>`)
- Retrieve data from the underlying EADV schema.
- Always return one row per `eid`.
- Compile into SQL CTEs with filters, aggregations, or window functions.
- Common helpers: `.last()`, `.lastdv()`, `.dt.max()`, `.where()`.

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
ld => eadv.[icd_%,lab_%].dt.max();
```

### Conditional Statements (`:`)
- Transform previously defined variables using boolean logic.
- Compile into SQL `CASE` expressions.
- Multiple branches separated with commas; each branch uses `{ condition => value }`.

```javascript
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
at_risk : { ckd = 0 and rrt = 0 and risk_sum > 0 => 1 }, { => 0 };
tkc_cat : { ckd > 0 or rrt > 0 => 1 }, { at_risk = 1 => 2 }, { => 3 };
```

## Compiler Directives

Directives are prefixed with `#` and supply metadata the runtime needs.

### `#define_ruleblock()`
Declares mandatory properties for each ruleblock (ID, description, target table, environment, version, and active state):

```javascript
#define_ruleblock(block_id, {
    description: "...",
    is_active: 2,
    version: "...",
    target_table: "rout_...",
    environment: "DEV_2"
});
```

### `#define_attribute()`
Defines exposed attributes, usually the final outputs. Use `type` codes (`1001` boolean, etc.) and flags for reportability/BI inclusion.

```javascript
#define_attribute(attr_name, {
    label: "Human-readable label",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});
```

### `#doc()`
Captures documentation text and citation references.

```javascript
#doc(, {
    txt: "Description text",
    cite: "ref1, ref2, ref3"
});
```

## Common Patterns

### Binding from Other Ruleblocks

```javascript
ckd => rout_ckd.ckd.val.bind(); // Pull variable from another output table
```

### Attribute Lists and Wildcards

Use `[ ... ]` to express OR logic or wildcard lookups.

```javascript
acr => eadv.lab_ua_acr._.lastdv();
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
ld => eadv.[icd_%,lab_%].dt.max();
```

### Date Utilities

```javascript
is_active : { ld > sysdate - 730 => 1 }, { => 0 };
aki_ld : { coalesce(aki_icd_ld, cr_max_ld)!? => least_date(aki_icd_ld, cr_max_ld) };
```

## Operators and Helpers

- `!?` checks for **not null**; `?` checks for null.
- `.where()` scopes attribute pulls with extra predicates.
- `.bind()` fetches data from `rout_<block>` tables.
- `[[rb_id]]` is a placeholder token in templates.

These conventions, combined with strict ordering (functional statements must precede the conditional logic that uses them), keep ruleblocks deterministic and easy to audit.
