# Language Reference

This section provides complete syntax specifications for Picorules. Use this as a reference when writing ruleblocks.

## Statement Types

Picorules has two fundamental statement types, distinguished by their operators:

| Statement Type | Operator | Purpose | Example |
|---------------|----------|---------|---------|
| **Functional** | `=>` | Retrieve data from EADV tables | `hb => eadv.lab_bld_haemoglobin.val.last();` |
| **Conditional** | `:` | Transform variables using logic | `is_low : { hb < 120 => 1 }, { => 0 };` |

### Statement Ordering Rule

**Critical:** All functional statements MUST come before conditional statements in a ruleblock.

✅ **Valid:**
```javascript
// Functional statements first
hb => eadv.lab_bld_haemoglobin.val.last();
cr => eadv.lab_bld_creatinine.val.last();

// Conditional statements second
is_anaemic : { hb < 120 => 1 }, { => 0 };
has_aki : { cr > 200 => 1 }, { => 0 };
```

❌ **Invalid:**
```javascript
hb => eadv.lab_bld_haemoglobin.val.last();
is_anaemic : { hb < 120 => 1 }, { => 0 };  // Conditional
cr => eadv.lab_bld_creatinine.val.last();  // ERROR: Functional after conditional
```

**Why?** Functional statements compile to SQL intermediate result sets (temp tables in T-SQL) that must be defined before being referenced in CASE expressions (conditional statements).

## Functional Statements

Functional statements retrieve and aggregate data from the EADV model. They compile to SQL SELECT statements with window functions.

### Basic Syntax

```javascript
variable_name => eadv.attribute_name.column.aggregation_function();
```

### Components

#### 1. Variable Name
The identifier you create:
- **Rules:** Alphanumeric plus underscore, must start with letter/underscore
- **Convention:** Use descriptive names (`hb_last` not `h`)
- **Case:** Lowercase with underscores (snake_case)

```javascript
hb_last => ...           // ✅ Good
haemoglobin_most_recent => ...  // ✅ Good
h => ...                 // ❌ Too cryptic
hbLast => ...           // ❌ Use snake_case not camelCase
```

#### 2. Functional Operator: `=>`

The double arrow indicates data retrieval. Think of it as "gets the value of".

#### 3. Table Reference: `eadv`

References the Entity-Attribute-Date-Value clinical data table.

**Alternative:** `rout_<blockid>` for cross-ruleblock binding:
```javascript
ckd_stage => rout_ckd.ckd_stage.val.bind();
```

#### 4. Attribute Name

The clinical concept or measurement:

**Single attribute:**
```javascript
eadv.lab_bld_haemoglobin...
```

**Multiple attributes (OR logic):**
```javascript
eadv.[lab_ua_rbc,lab_ua_poc_rbc]...  // Either attribute
```

**Wildcard patterns:**
```javascript
eadv.[icd_%,lab_%]...  // Any ICD code OR any lab
eadv.icd_N18%...       // Any CKD ICD-10 code (N18.1, N18.2, etc.)
```

#### 5. Column Specifier

Which EADV column to aggregate:

| Column | Meaning | Example |
|--------|---------|---------|
| `.val` | Value column | `eadv.lab_bld_haemoglobin.val.last()` |
| `.dt` | Date column | `eadv.lab_bld_haemoglobin.dt.max()` |
| `._` | Both date and value | `eadv.lab_bld_haemoglobin._.lastdv()` |

**Note:** Using `._` with `.lastdv()` creates TWO variables:
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
// Creates: hb_val and hb_dt
```

#### 6. Aggregation Function

How to aggregate multiple rows per patient:

| Function | Returns | Use Case |
|----------|---------|----------|
| `.last()` | Most recent value | Latest lab result |
| `.first()` | Earliest value | Baseline measurement |
| `.count()` | Number of occurrences | Visit frequency |
| `.sum()` | Sum of values | Total doses |
| `.avg()` | Average value | Mean blood pressure |
| `.min()` | Minimum value | Lowest eGFR |
| `.max()` | Maximum value | Highest creatinine |
| `.median()` | Median value | Baseline creatinine |
| `.distinct_count()` | Unique value count | Distinct visit dates |
| `.lastdv()` | Last date-value pair | When you need both |
| `.firstdv()` | First date-value pair | Baseline with date |
| `.maxldv()` | Max value with date | Peak value timing |
| `.minldv()` | Min value with date | Nadir timing |
| `.exists()` | 1 if exists, 0 if not | Comorbidity check |
| `.bind()` | Value from another ruleblock | Cross-ruleblock reference |

> **Note:** See the [Functions Reference](#functions-reference) for complete documentation of all functions including statistical functions (`.regr_slope()`, `.stats_mode()`) and advanced analysis functions (`.temporal_regularity()`).

### Functional Statement Examples

#### Retrieve Most Recent Lab Value

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

**Compiles to SQL (conceptual):**
```sql
SELECT eid,
       LAST_VALUE(val) OVER (PARTITION BY eid ORDER BY dt) as hb_last
FROM eadv
WHERE att = 'lab_bld_haemoglobin'
```

#### Get Date and Value

```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
```

**Creates two variables:**
- `hb_val` — The hemoglobin value
- `hb_dt` — The date of that measurement

#### Get Maximum Value

```javascript
cr_max => eadv.lab_bld_creatinine.val.max();
```

**Use case:** Peak creatinine for AKI detection

#### Get Latest Date

```javascript
last_visit => eadv.enc_outpatient.dt.max();
```

**Use case:** Determine patient activity

#### Multi-Attribute Retrieval

```javascript
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

**Logic:** Get the most recent value from EITHER `lab_ua_rbc` OR `lab_ua_poc_rbc`, whichever is newer.

#### Wildcard Patterns

```javascript
// Latest interaction with health system
last_encounter => eadv.[icd_%,lab_%,enc_%].dt.max();

// Any CKD diagnosis
ckd_dx_date => eadv.icd_N18%.dt.max();
```

### Filtering with `.where()`

Add conditions to filter data before aggregation:

```javascript
variable => eadv.attribute.column.where(condition).function();
```

**Examples:**

```javascript
// Only recent labs (last 2 years)
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();

// Only abnormal results
hb_abnormal_min => eadv.lab_bld_haemoglobin.val.where(val < 120).min();

// Specific source
hb_lab_only => eadv.lab_bld_haemoglobin.val.where(source='main_lab').last();
```

**Available in `.where()` conditions:**
- `dt` — Date column
- `val` — Value column
- `sysdate` — Current system date
- Comparison operators: `>`, `<`, `>=`, `<=`, `=`, `!=`
- Arithmetic: `+`, `-`, `*`, `/`

### Cross-Ruleblock Binding

Reference variables calculated in other ruleblocks:

```javascript
variable_name => rout_<source_ruleblock>.<variable_name>.val.bind();
```

**Example:**

```javascript
// In ckd.prb
egfr_last => eadv.lab_bld_egfr.val.last();

// In another ruleblock
egfr => rout_ckd.egfr_last.val.bind();
```

**Pattern breakdown:**
- `rout_ckd` — Output table from `ckd.prb` ruleblock
- `egfr_last` — Variable defined in that ruleblock
- `.val.bind()` — Bind the value

**Use cases:**
- Reuse complex calculations (CKD staging, risk scores)
- Modular ruleblock design
- Separation of concerns (diagnostics vs. treatment logic)

## Conditional Statements

Conditional statements transform variables using boolean logic and conditional expressions. They compile to SQL CASE statements.

### Basic Syntax

```javascript
variable_name : { condition => value }, { condition => value }, ... { => default_value };
```

### Components

#### 1. Variable Name
Same rules as functional statements.

#### 2. Conditional Operator: `:`

The colon indicates conditional logic. Think "is defined as".

#### 3. Condition-Value Pairs

One or more `{ condition => value }` blocks:

```javascript
{ hb < 80 => 3 },     // If hb < 80, value is 3
{ hb < 100 => 2 },    // Else if hb < 100, value is 2
{ => 1 }              // Else (default), value is 1
```

**Important:**
- Conditions evaluated **left to right**
- **First matching** condition wins
- Curly braces `{}` are required
- Comma separates condition blocks
- **Always include a default** `{ => value }` to avoid NULLs

#### 4. Conditions

Conditions use boolean expressions:

**Comparison operators:**
- `=` — Equal
- `!=` or `<>` — Not equal
- `<` — Less than
- `>` — Greater than
- `<=` — Less than or equal
- `>=` — Greater than or equal

**Logical operators:**
- `and` — Both conditions true
- `or` — Either condition true
- `not` — Negate condition
- `( )` — Grouping

**NULL operators:**
- `!?` — Is NOT NULL (value exists)
- `?` — Is NULL (value missing)

### Conditional Statement Examples

#### Binary Classification

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();

is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

**Meaning:** If hemoglobin < 120, return 1; otherwise return 0.

#### Multi-Level Classification

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();

anemia_severity :
    { hb_last < 80 => 3 },    // Severe
    { hb_last < 100 => 2 },   // Moderate
    { hb_last < 120 => 1 },   // Mild
    { => 0 };                 // Normal
```

**Evaluation order:** First condition that matches wins.
- If `hb_last = 75`: returns 3 (matches first condition)
- If `hb_last = 95`: returns 2 (first false, second matches)
- If `hb_last = 115`: returns 1
- If `hb_last = 130`: returns 0 (default)

#### Compound Conditions

```javascript
ckd => rout_ckd.ckd_stage.val.bind();
hb_last => eadv.lab_bld_haemoglobin.val.last();

needs_epo : { ckd >= 3 and hb_last < 100 => 1 }, { => 0 };
```

#### Multiple Conditions with OR

```javascript
dm_dx => eadv.icd_E11%.dt.max();
dm_med => eadv.rx_metformin.dt.max();

is_diabetic : { dm_dx!? or dm_med!? => 1 }, { => 0 };
```

**Meaning:** Patient is diabetic if they have EITHER a diabetes diagnosis OR diabetes medication.

#### Complex Multi-Criteria Logic

```javascript
ckd => rout_ckd.ckd_stage.val.bind();
dm => rout_dm.is_diabetic.val.bind();
htn => rout_htn.is_hypertensive.val.bind();
age => rout_global.age.val.bind();

cvd_risk :
    { ckd >= 4 => 4 },                              // Very high risk
    { ckd >= 3 and dm = 1 => 3 },                  // High risk
    { (ckd >= 3 or dm = 1) and htn = 1 => 3 },     // High risk
    { age >= 65 and (dm = 1 or htn = 1) => 2 },    // Moderate risk
    { age >= 65 or dm = 1 or htn = 1 => 1 },       // Low-moderate risk
    { => 0 };                                       // Low risk
```

#### NULL Handling

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();

has_hb_result : { hb_last!? => 1 }, { => 0 };
```

**NULL operators in depth:**

```javascript
value!?    // TRUE if value is NOT NULL
value?     // TRUE if value is NULL
```

**Example with NULL safety:**

```javascript
ferritin => eadv.lab_bld_ferritin.val.last();
tsat => eadv.lab_bld_tsat.val.last();

iron_deficient :
    { ferritin!? and ferritin < 100 => 1 },
    { ferritin!? and tsat!? and ferritin < 300 and tsat < 20 => 1 },
    { => 0 };
```

**Why check `!?`:** Avoids comparing NULL values which always evaluate to NULL (not TRUE/FALSE).

#### Using `coalesce()`

Provide fallback values:

```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
aki_cr_dt => eadv.lab_bld_creatinine.dt.max();  // Simplified

aki_first_date : { coalesce(aki_icd_dt, aki_cr_dt)!? => least_date(aki_icd_dt, aki_cr_dt) };
```

**Meaning:** If either date exists, return the earliest one.

#### Conditional with Functions

```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
cr_spike_dt => eadv.lab_bld_creatinine.dt.max();

aki_earliest :
    { aki_icd_dt!? and cr_spike_dt!? => least_date(aki_icd_dt, cr_spike_dt) },
    { aki_icd_dt!? => aki_icd_dt },
    { cr_spike_dt!? => cr_spike_dt };
```

**Available functions in conditionals:**
- `least_date(d1, d2, ...)` — Earliest date
- `greatest_date(d1, d2, ...)` — Latest date
- `coalesce(v1, v2, ...)` — First non-null value
- `abs(x)` — Absolute value
- `round(x, decimals)` — Round number

### Referencing Earlier Variables

Conditional statements can reference:
1. Variables from functional statements
2. Variables from earlier conditional statements
3. Variables bound from other ruleblocks

```javascript
// Functional statements
egfr => eadv.lab_bld_egfr.val.last();

// First conditional
ckd_stage :
    { egfr < 15 => 5 },
    { egfr < 30 => 4 },
    { egfr < 45 => 3 },
    { => 0 };

// Second conditional references first conditional
is_advanced_ckd : { ckd_stage >= 4 => 1 }, { => 0 };
```

**Rule:** You can only reference variables defined ABOVE the current line.

## Compiler Directives

Compiler directives configure metadata and documentation. They start with `#` and are not part of the executable logic.

### `#define_ruleblock()`

**Required.** Defines ruleblock metadata. Must appear at the top of the file.

```javascript
#define_ruleblock(block_id, {
    description: "Human-readable description",
    is_active: 2,
    version: "1.0",
    target_table: "rout_block_id",
    environment: "DEV_2"
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `block_id` | string | Yes | Unique identifier (must match filename without `.prb`) |
| `description` | string | Yes | What this ruleblock does |
| `is_active` | integer | Yes | 2 = active, 0 = inactive |
| `version` | string | Yes | Version for change tracking |
| `target_table` | string | Yes | Output table name (convention: `rout_<block_id>`) |
| `environment` | string | Yes | Deployment target (e.g., "DEV_2", "PROD") |

**Example:**

```javascript
#define_ruleblock(ckd_diagnostics, {
    description: "CKD diagnostic workup per KDIGO 2024 guidelines",
    is_active: 2,
    version: "2.1",
    target_table: "rout_ckd_diagnostics",
    environment: "PROD"
});
```

### `#define_attribute()`

Defines metadata for output variables that should appear in reports and dashboards.

```javascript
#define_attribute(variable_name, {
    label: "Display label",
    type: type_code,
    is_reportable: 0_or_1,
    is_bi_obj: 0_or_1
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `variable_name` | string | Yes | Variable defined in the ruleblock |
| `label` | string | Yes | Human-readable display name |
| `type` | integer | Yes | Data type code (see table below) |
| `is_reportable` | integer | Yes | 1 = show in reports, 0 = internal only |
| `is_bi_obj` | integer | Yes | 1 = business intelligence object, 0 = no |

**Type codes:**

| Code | Type | Example |
|------|------|---------|
| 1001 | Numeric | 118.5, 42 |
| 1002 | String/Text | "Stage 3", "Normal" |
| 1003 | Date | 2024-03-15 |
| 1004 | Boolean | 0, 1 |

**Example:**

```javascript
#define_attribute(ckd_stage, {
    label: "CKD Stage (1-5)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(is_anaemic, {
    label: "Has anemia",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});
```

**Best practice:** Define attributes for all variables you want to:
- Display in dashboards
- Include in reports
- Use in business intelligence tools
- Document for other users

### `#doc()`

Adds documentation and clinical evidence to variables.

```javascript
#doc(variable_name, {
    txt: "Description of what this variable represents",
    cite: "citation_ref1, citation_ref2"
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `variable_name` | string | Yes | Variable to document (or empty for ruleblock-level) |
| `txt` | string | Yes | Documentation text |
| `cite` | string | No | Comma-separated citation references |

**Empty variable name for ruleblock-level documentation:**

```javascript
#doc(, {
    txt: "This ruleblock implements KDIGO 2024 CKD guidelines for staging and management recommendations.",
    cite: "kdigo_ckd_2024"
});
```

**Variable-specific documentation:**

```javascript
#doc(ckd_stage, {
    txt: "CKD stage (1-5) based on eGFR. Stages 1-2 require albuminuria or structural kidney damage for diagnosis.",
    cite: "kdigo_ckd_2024, nkf_staging_guide"
});
```

**Citation files:**

Citations reference `.citation.txt` files in `picodomain_rule_pack/citations/`:

```
# File: kdigo_ckd_2024.citation.txt
KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
Kidney International (2024) 105, S117–S314.
```

## Data Types and Literals

### Numeric Literals

```javascript
age >= 65
egfr < 30
hb < 120
score = 0
```

**Supported:**
- Integers: `0`, `42`, `365`
- Decimals: `1.5`, `30.5`, `0.001`
- Negative: `-1`, `-273.15`

### String Literals

```javascript
source = 'main_lab'
status = "active"
```

**Quoting:** Single `'` or double `"` quotes supported.

### Date Literals and Arithmetic

```javascript
sysdate           // Current system date
sysdate-365       // One year ago
sysdate-730       // Two years ago
sysdate+30        // 30 days from now
```

**Date arithmetic:** Add/subtract days from dates.

### Boolean Values

```javascript
1    // True
0    // False
```

**Convention:** Use 1/0 for boolean flags.

### NULL

```javascript
NULL
null
```

**NULL checking:**
```javascript
value!?   // Is NOT NULL
value?    // Is NULL
```

## Operators

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `ckd_stage = 3` |
| `!=` or `<>` | Not equal | `status != 'inactive'` |
| `<` | Less than | `age < 65` |
| `>` | Greater than | `egfr > 60` |
| `<=` | Less than or equal | `hb <= 120` |
| `>=` | Greater than or equal | `ckd_stage >= 4` |

### Logical Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `and` | Both conditions true | `ckd >= 3 and dm = 1` |
| `or` | Either condition true | `ckd >= 4 or rrt = 1` |
| `not` | Negate condition | `not (ckd = 0)` |

**Precedence:** `not` > `and` > `or`

**Use parentheses for clarity:**
```javascript
(ckd >= 3 and dm = 1) or (ckd >= 4)   // Clear
ckd >= 3 and dm = 1 or ckd >= 4      // Ambiguous
```

### Arithmetic Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `+` | Addition | `sysdate+30` |
| `-` | Subtraction | `sysdate-365` |
| `*` | Multiplication | `cr_min * 2` |
| `/` | Division | `total / count` |

### NULL Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `!?` | Is NOT NULL | `hb!?` |
| `?` | Is NULL | `ferritin?` |

### Statement Operators

| Operator | Statement Type | Meaning |
|----------|----------------|---------|
| `=>` | Functional | "Gets value from" |
| `:` | Conditional | "Is defined as" |

## Comments

Single-line comments use `//`:

```javascript
// This is a comment
hb_last => eadv.lab_bld_haemoglobin.val.last();  // Get latest Hb

// Multi-line comments require // on each line
// Like this
// And this
```

**No multi-line comment syntax:** Use `//` on each line.

**Best practice:** Comment blocks of related logic:

```javascript
// ===================
// Lab Results
// ===================
hb_last => eadv.lab_bld_haemoglobin.val.last();
cr_last => eadv.lab_bld_creatinine.val.last();

// ===================
// Clinical Flags
// ===================
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
has_aki : { cr_last > 200 => 1 }, { => 0 };
```

## Reserved Keywords

These words have special meaning in Picorules:

**Operators:**
- `and`, `or`, `not`

**Fetch Functions:**
- Basic: `last`, `first`, `count`
- Aggregation: `sum`, `avg`, `min`, `max`, `median`, `distinct_count`
- Date-Value: `lastdv`, `firstdv`, `maxldv`, `minldv`, `minfdv`
- Statistical: `regr_slope`, `regr_intercept`, `regr_r2`, `stats_mode`
- Advanced: `max_neg_delta_dv`, `temporal_regularity`, `exists`, `nth`
- Serialization: `serialize`, `serializedv`, `serializedv2`
- Cross-ruleblock: `bind`
- Filter: `where`

**Standard SQL Functions:**
- `coalesce`, `least_date`, `greatest_date`, `least`, `greatest`
- `abs`, `round`

**Date/time:**
- `sysdate`

**Special:**
- `eadv` — EADV table reference
- `rout_` — Ruleblock output table prefix

**Avoid using these as variable names.**

## Syntax Summary

### Functional Statement

```javascript
variable_name => source.attribute.column.function();
```

**Example:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

### Conditional Statement

```javascript
variable_name : { condition => value }, ... { => default };
```

**Example:**
```javascript
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

### Compiler Directives

```javascript
#define_ruleblock(id, { ... });
#define_attribute(var, { ... });
#doc(var, { ... });
```

## Syntax Rules

1. **All statements end with semicolon** (`;`)
2. **Functional statements before conditional statements**
3. **Variables must be defined before use**
4. **Conditional statements must have default case** (`{ => value }`)
5. **Attribute names use dot notation** (`eadv.lab_bld_haemoglobin`)
6. **Multi-attribute references use brackets** (`[att1,att2]`)
7. **Comments use** `//`
8. **Compiler directives start with** `#`

## Common Syntax Errors

### Missing Semicolon

❌ **Error:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last()
```

✅ **Fix:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

### Wrong Operator

❌ **Error:**
```javascript
hb_last : eadv.lab_bld_haemoglobin.val.last();  // Should be =>
is_anaemic => { hb_last < 120 => 1 };           // Should be :
```

✅ **Fix:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

### Missing Default Case

❌ **Error:**
```javascript
severity : { hb < 80 => 3 }, { hb < 100 => 2 };  // Missing default
```

✅ **Fix:**
```javascript
severity : { hb < 80 => 3 }, { hb < 100 => 2 }, { => 0 };
```

### Undefined Variable Reference

❌ **Error:**
```javascript
is_anaemic : { hb_last < 120 => 1 }, { => 0 };  // hb_last not defined yet
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

✅ **Fix:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

### Missing Column Specifier

❌ **Error:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.last();  // Missing .val
```

✅ **Fix:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

## Next Topics

- [EADV Model](#eadv-model) — Understanding the data structure
- [Functions Reference](#functions-reference) — Complete function documentation
- [Examples](#examples) — Real-world patterns
