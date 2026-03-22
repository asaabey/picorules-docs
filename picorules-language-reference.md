# Picorules Language Reference

> **Single-file reference for AI agents and tools.** This file combines all Picorules documentation into one document. For the interactive version, see the documentation site.

---

# 1. Introduction

## What is Picorules?

Picorules is a domain-specific language (DSL) designed for clinical decision support systems. It enables clinicians and clinical informaticians to author complex medical logic without writing SQL, while maintaining the power and performance of database-native computation.

Think of Picorules as a bridge between clinical reasoning and database queries—you describe *what* clinical insights you want to derive, and Picorules generates the *how* in optimized SQL.

**Note:** This documentation references Territory Kidney Care (TKC) as an example implementation, but Picorules is designed to work with any clinical system using an EADV data model.

## The Problem We're Solving

### Clinical Decision Support Complexity

Modern healthcare systems face several challenges when implementing clinical decision support (CDS):

1. **Data Complexity**: Clinical data is inherently temporal, multi-dimensional, and scattered across hundreds of attributes (labs, medications, diagnoses, procedures)

2. **Logic Complexity**: Clinical guidelines involve intricate decision trees, risk calculations, and cohort definitions that combine multiple data points

3. **Technical Barrier**: Clinicians understand the medical logic but often lack SQL expertise; engineers understand SQL but lack clinical domain knowledge

4. **Maintenance Burden**: Clinical guidelines evolve frequently—updating complex SQL for each change is error-prone and time-consuming

### The EADV Challenge

Picorules works with the Entity-Attribute-Date-Value (EADV) data model, which stores all clinical observations in a flexible schema:

| eid (patient) | att (attribute) | dt (date) | val (value) |
|---------------|-----------------|-----------|-------------|
| 12345 | lab_bld_haemoglobin | 2024-03-15 | 118 |
| 12345 | lab_bld_haemoglobin | 2024-06-20 | 121 |
| 12345 | icd_N18.3 | 2024-03-10 | 1 |

While EADV provides tremendous flexibility, querying it requires complex SQL with:
- Self-joins to correlate different attributes
- Window functions to get latest values
- Temporary tables or CTEs to organize multi-step logic
- Careful date filtering and aggregation

## How Picorules Helps

### 1. Declarative Syntax

Instead of describing *how* to query the database, you declare *what* you want:

```javascript
// Get the most recent hemoglobin value
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

This single line compiles to SQL (using temporary tables in T-SQL implementations) with window functions, date filtering, and proper aggregation.

### 2. Clinical-Friendly Abstractions

Picorules provides functions that match clinical thinking:

- `.last()` — most recent value
- `.lastdv()` — most recent date-value pair
- `.where()` — filter by conditions
- `.bind()` — reference other ruleblocks

### 3. Automatic SQL Generation

Picorules compiles to optimized SQL automatically:
- Generates intermediate result sets (temp tables in T-SQL) for each statement
- Handles joins on patient ID (`eid`)
- Applies proper windowing and aggregation
- Manages NULL handling and date arithmetic

### 4. Modular Composition

Ruleblocks can reference outputs from other ruleblocks, enabling:
- Reusable clinical definitions (e.g., CKD staging)
- Separation of concerns (diagnostics, risk assessment, treatment eligibility)
- Team collaboration (different teams maintain different ruleblocks)

```javascript
// Reference CKD status from another ruleblock
ckd => rout_ckd.ckd.val.bind();

// Use it in conditional logic
at_risk : { ckd=0 and risk_factors>0 => 1 }, { => 0 };
```

### 5. Documentation as Code

Compiler directives keep metadata and clinical evidence collocated with logic:

```javascript
#define_attribute(is_anaemic, {
    label: "Patient has anemia",
    type: 1001,
    is_reportable: 1
});

#doc(is_anaemic, {
    txt: "Anemia defined as Hb <120 g/L for non-pregnant adults",
    cite: "who_anemia_ref1, kdigo_anemia_ref2"
});
```

## SQL Compilation

Picorules compiles to SQL for execution against your database. The compilation approach depends on your SQL dialect:

**T-SQL (Microsoft SQL Server):**
- Each functional statement compiles to a temporary table (`#temp_table`)
- Statements are executed sequentially, building up intermediate results
- Final results are joined and written to the output table (`rout_<blockid>`)

**Other SQL Dialects:**
- May use CTEs (Common Table Expressions) instead of temp tables
- Consult your implementation's compiler documentation

## Design Philosophy

### Readable over Terse
```javascript
// Clear intent
is_diabetic : { has_dm_dx=1 or on_dm_meds=1 => 1 }, { => 0 };
```

### Explicit over Implicit
```javascript
// Explicit aggregation
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

### Safe by Default
The compiler enforces correctness:
- Functional statements before conditional statements
- All referenced variables must exist
- Statements must end with semicolon
- Attribute names must be defined

---

# 2. Tutorial

## Your First Ruleblock

### Step 1: Create the File

Create a file named `my_first_rule.prb` in `picodomain_rule_pack/rule_blocks/`.

### Step 2: Define the Ruleblock

Every ruleblock must start with metadata using `#define_ruleblock()`:

```javascript
#define_ruleblock(my_first_rule, {
    description: "My first Picorules ruleblock",
    is_active: 2,
    version: "1.0",
    target_table: "rout_my_first_rule",
    environment: "DEV_2"
});
```

**What this means:**
- `my_first_rule` — The unique identifier (must match filename without `.prb`)
- `description` — Human-readable explanation
- `is_active: 2` — Active status (2 = active, 0 = inactive)
- `version` — Version string for tracking
- `target_table` — SQL table where results are written (convention: `rout_<blockid>`)
- `environment` — Deployment environment

### Step 3: Write Your First Functional Statement

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

**Breaking it down:**
- `hb_last` — Variable name you're creating
- `=>` — Functional statement operator (retrieves data)
- `eadv` — The EADV table containing clinical data
- `lab_bld_haemoglobin` — The attribute (hemoglobin lab test)
- `val` — The value column
- `.last()` — Function that returns the most recent value

### Step 4: Define the Output Attribute

```javascript
#define_attribute(hb_last, {
    label: "Most recent hemoglobin (g/L)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});
```

### Step 5: Add Documentation

```javascript
#doc(hb_last, {
    txt: "Most recent hemoglobin measurement in grams per liter",
    cite: ""
});
```

### Complete First Ruleblock

```javascript
#define_ruleblock(my_first_rule, {
    description: "My first Picorules ruleblock",
    is_active: 2,
    version: "1.0",
    target_table: "rout_my_first_rule",
    environment: "DEV_2"
});

// Retrieve most recent hemoglobin value
hb_last => eadv.lab_bld_haemoglobin.val.last();

#define_attribute(hb_last, {
    label: "Most recent hemoglobin (g/L)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#doc(hb_last, {
    txt: "Most recent hemoglobin measurement in grams per liter",
    cite: ""
});
```

## Adding More Variables

### Multiple Functional Statements

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
cr_last => eadv.lab_bld_creatinine.val.last();
alb_last => eadv.lab_bld_albumin.val.last();
```

Each statement creates its own intermediate result set in the generated SQL, and all are joined on `eid` (patient ID).

### Getting Dates Too

Use `.lastdv()` to get both the date and value:

```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
```

**Note:** The underscore `_` is a placeholder when you want both date and value. This returns two columns: `hb_dt` (date) and `hb_val` (value).

### Retrieving Multiple Attributes

Use square brackets for OR logic:

```javascript
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

## Conditional Logic

### Your First Conditional Statement

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();

is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

**Breaking down the conditional:**
- `is_anaemic` — Variable name
- `:` — Conditional statement operator
- `{ hb_last < 120 => 1 }` — If hemoglobin is less than 120, return 1
- `,` — Separator between conditions
- `{ => 0 }` — Otherwise (default case), return 0

**Critical rule:** Conditional statements can ONLY reference variables defined earlier.

### Multiple Conditions

```javascript
anemia_severity :
    { hb_last < 80 => 3 },      // Severe
    { hb_last < 100 => 2 },     // Moderate
    { hb_last < 120 => 1 },     // Mild
    { => 0 };                   // Normal
```

Conditions are evaluated in order; first matching condition wins. Always include a default case `{ => 0 }`.

### Compound Conditions

```javascript
ckd => rout_ckd.ckd.val.bind();
hb_last => eadv.lab_bld_haemoglobin.val.last();

ckd_anemia : { ckd > 0 and hb_last < 120 => 1 }, { => 0 };
```

**Boolean operators:** `and`, `or`, parentheses for grouping: `(A and B) or C`

## Working with Dates

### Date Arithmetic

```javascript
hb_ld => eadv.lab_bld_haemoglobin.dt.max();
hb_is_recent : { hb_ld > sysdate-730 => 1 }, { => 0 };
```

- `sysdate` — Current system date
- `sysdate-730` — Two years ago (730 days)
- `sysdate-365` — One year ago

### NULL Handling

```javascript
has_hb_test : { hb_last!? => 1 }, { => 0 };
```

- `!?` — "is not null" (value exists)
- `?` — "is null" (value missing)

## Chaining Ruleblocks

### Using `.bind()`

```javascript
ckd_stage => rout_ckd.ckd_stage.val.bind();
needs_nephrology : { ckd_stage >= 4 => 1 }, { => 0 };
```

**Pattern:** `rout_<ruleblock_id>.<variable_name>.val.bind()`

## Best Practices

1. **Order Matters**: Functional statements first, then conditionals
2. **Use Clear Variable Names**: Descriptive, medical terminology
3. **Always Include Default Cases**: `{ => 0 }` or `{ => value }`
4. **Document Everything**: Use `#doc()` for every output attribute
5. **Group Related Logic**: Use comment sections

## Common Mistakes to Avoid

1. Forgetting semicolons
2. Wrong operator for statement type (`=>` for functional, `:` for conditional)
3. Missing `.val` or `.dt` in functional statements
4. Referencing variables before they're defined

---

# 3. Language Reference

## Statement Types

| Statement Type | Operator | Purpose | Example |
|---------------|----------|---------|---------|
| **Functional** | `=>` | Retrieve data from EADV tables | `hb => eadv.lab_bld_haemoglobin.val.last();` |
| **Conditional** | `:` | Transform variables using logic | `is_low : { hb < 120 => 1 }, { => 0 };` |

### Statement Ordering Rule

**Critical:** All functional statements MUST come before conditional statements in a ruleblock.

**Why?** Functional statements compile to SQL intermediate result sets that must be defined before being referenced in CASE expressions (conditional statements).

## Functional Statements

### Basic Syntax

```javascript
variable_name => eadv.attribute_name.column.aggregation_function();
```

### Components

#### Variable Name
- Alphanumeric plus underscore, must start with letter/underscore
- Lowercase with underscores (snake_case)

#### Table Reference
- `eadv` — References the EADV clinical data table
- `rout_<blockid>` — For cross-ruleblock binding

#### Attribute Name

**Single attribute:**
```javascript
eadv.lab_bld_haemoglobin...
```

**Multiple attributes (OR logic):**
```javascript
eadv.[lab_ua_rbc,lab_ua_poc_rbc]...
```

**Wildcard patterns:**
```javascript
eadv.[icd_%,lab_%]...    // Any ICD code OR any lab
eadv.icd_N18%...         // Any CKD ICD-10 code
```

#### Column Specifier

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

### Filtering with `.where()`

```javascript
variable => eadv.attribute.column.where(condition).function();
```

**Examples:**
```javascript
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();
hb_abnormal_min => eadv.lab_bld_haemoglobin.val.where(val < 120).min();
```

### Cross-Ruleblock Binding

```javascript
variable_name => rout_<source_ruleblock>.<variable_name>.val.bind();
```

## Conditional Statements

### Basic Syntax

```javascript
variable_name : { condition => value }, { condition => value }, ... { => default_value };
```

### Key Rules
- Conditions evaluated **left to right**; first matching wins
- Curly braces `{}` required
- Comma separates condition blocks
- **Always include a default** `{ => value }` to avoid NULLs
- Can reference variables from functional statements, earlier conditionals, and bound ruleblocks

### Comparison Operators

| Operator | Meaning |
|----------|---------|
| `=` | Equal |
| `!=` or `<>` | Not equal |
| `<`, `>`, `<=`, `>=` | Comparisons |

### Logical Operators

| Operator | Meaning | Precedence |
|----------|---------|-----------|
| `not` | Negate | Highest |
| `and` | Both true | Middle |
| `or` | Either true | Lowest |

### NULL Operators

| Operator | Meaning |
|----------|---------|
| `!?` | Is NOT NULL |
| `?` | Is NULL |

## Compiler Directives

### `#define_ruleblock()`

**Required.** Must appear at the top of the file.

```javascript
#define_ruleblock(block_id, {
    description: "Human-readable description",
    is_active: 2,
    version: "1.0",
    target_table: "rout_block_id",
    environment: "DEV_2"
});
```

### `#define_attribute()`

Defines metadata for output variables.

```javascript
#define_attribute(variable_name, {
    label: "Display label",
    type: type_code,
    is_reportable: 0_or_1,
    is_bi_obj: 0_or_1
});
```

**Type codes:**

| Code | Type |
|------|------|
| 1001 | Numeric |
| 1002 | String/Text |
| 1003 | Date |
| 1004 | Boolean |

### `#doc()`

```javascript
#doc(variable_name, {
    txt: "Description of what this variable represents",
    cite: "citation_ref1, citation_ref2"
});
```

Empty variable name for ruleblock-level documentation:
```javascript
#doc(, {
    txt: "This ruleblock implements KDIGO 2024 CKD guidelines.",
    cite: "kdigo_ckd_2024"
});
```

## Data Types and Literals

- **Integers:** `0`, `42`, `365`
- **Decimals:** `1.5`, `30.5`
- **Negative:** `-1`, `-273.15`
- **Strings:** Single `'` or double `"` quotes
- **Dates:** `sysdate`, `sysdate-365`, `sysdate+30`
- **Booleans:** `1` (true), `0` (false)
- **NULL:** `NULL` or `null`

## Comments

```javascript
// Single-line comment
hb_last => eadv.lab_bld_haemoglobin.val.last();  // Inline comment
```

No multi-line comment syntax; use `//` on each line.

## Syntax Rules Summary

1. All statements end with semicolon (`;`)
2. Functional statements before conditional statements
3. Variables must be defined before use
4. Conditional statements must have default case
5. Attribute names use dot notation
6. Multi-attribute references use brackets (`[att1,att2]`)
7. Comments use `//`
8. Compiler directives start with `#`

---

# 4. EADV Model

## What is EADV?

EADV is a flexible data modeling approach that stores all clinical observations as rows in a single table:

| Column | Full Name | Description | Example |
|--------|-----------|-------------|---------|
| `eid` | Entity ID | Patient identifier | `12345` |
| `att` | Attribute | What was measured/observed | `lab_bld_haemoglobin` |
| `dt` | Date | When it occurred | `2024-03-15` |
| `val` | Value | The measurement/observation | `118` |

## Attribute Naming Conventions

| Prefix | Category | Examples |
|--------|----------|----------|
| `lab_` | Laboratory tests | `lab_bld_haemoglobin`, `lab_ua_protein` |
| `icd_` | Diagnosis codes | `icd_N18.3`, `icd_E11.9` |
| `rx_` | Medications | `rx_metformin`, `rx_atorvastatin` |
| `enc_` | Encounters | `enc_outpatient`, `enc_emergency` |
| `proc_` | Procedures | `proc_dialysis`, `proc_transplant` |
| `demo_` | Demographics | `demo_age`, `demo_sex` |

**Lab sub-prefixes:**
- `lab_bld_` — Blood tests
- `lab_ua_` — Urine tests
- `lab_chem_` — Chemistry panels
- `lab_mic_` — Microbiology

## Additional Columns (Implementation-Specific)

| Column | Purpose | Example |
|--------|---------|---------|
| `source` | Data origin | `"main_lab"`, `"poc"` |
| `unit` | Measurement unit | `"g/L"`, `"mmol/L"` |
| `ref_low` / `ref_high` | Reference range | `120` / `160` |

## EADV vs. Ruleblock Output Tables

**EADV table (`eadv`):**
- Raw clinical observations, huge (millions/billions of rows)
- Queried via Picorules functional statements

**Ruleblock output tables (`rout_*`):**
- Computed/derived values, one row per patient
- Queried via `.bind()` in other ruleblocks

**Data flow:**
```
Raw clinical data (EADV table)
         ↓
    Picorules ruleblock (ckd.prb)
         ↓
    Output table (rout_ckd)
         ↓
    Referenced by other ruleblocks (.bind())
```

---

# 5. Functions Reference

## Function Types

### Fetch Functions (Custom Picorules Implementation)
Custom DSL functions that query the EADV data model and generate SQL CTEs with window functions.
- Use dot notation: `.function()`
- Operate on EADV table data in functional statements

### Standard SQL Functions (Direct Translation)
Standard SQL functions translated directly to the target SQL dialect.
- Use function call syntax: `function(args)`
- Used primarily in conditional statements

## Complete Function Reference

### Basic Fetch Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `.last()` | Most recent value | Latest lab result |
| `.first()` | Earliest value | Baseline measurement |
| `.count()` | Number of occurrences | Visit frequency |
| `.count(default)` | Count with default | Count with 0 fallback |

### Aggregation Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `.sum()` | Sum of values | Total doses |
| `.avg()` | Average value | Mean blood pressure |
| `.min()` | Minimum value | Lowest eGFR |
| `.max()` | Maximum value | Highest creatinine |
| `.median()` | Median value | Baseline creatinine |
| `.distinct_count()` | Unique value count | Distinct visit dates |

### Date-Value Pair Functions (DV Functions)

These return **TWO columns** (`variable_val` and `variable_dt`). Use `._` as column specifier.

| Function | Creates | Description |
|----------|---------|-------------|
| `.lastdv()` | `var_val`, `var_dt` | Most recent value with its date |
| `.firstdv()` | `var_val`, `var_dt` | Earliest value with its date |
| `.maxldv()` | `var_val`, `var_dt` | Maximum value with LAST date of max |
| `.minldv()` | `var_val`, `var_dt` | Minimum value with LAST date of min |
| `.minfdv()` | `var_val`, `var_dt` | Minimum value with FIRST date of min |
| `.max_neg_delta_dv()` | `var_val`, `var_dt` | Largest drop with date it occurred |

**Usage:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
// Creates hb_val and hb_dt

// Use in conditionals:
is_recent_low : { hb_val < 100 and hb_dt > sysdate-90 => 1 }, { => 0 };
```

**Why `.lastdv()` over separate `.last()` + `.max()`:**
```javascript
// Efficient: One query, guaranteed same row
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Inefficient: Two queries, might get different rows
hb_val => eadv.lab_bld_haemoglobin.val.last();
hb_dt => eadv.lab_bld_haemoglobin.dt.max();
```

### Statistical Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `.regr_slope()` | Slope coefficient (change per day) | Rate of eGFR decline |
| `.regr_intercept()` | Y-intercept | Baseline estimation |
| `.regr_r2()` | R-squared (0-1) | Fit quality of trend |
| `.stats_mode()` | Most frequent value | Primary healthcare location |

**Example — eGFR decline rate:**
```javascript
egfr_slope => eadv.lab_bld_egfr_c.val.regr_slope();
// Negative slope = declining values over time
// slope of -0.01 means losing ~3.65 mL/min/1.73m²/year
```

### Advanced Analysis Functions

#### `.temporal_regularity()`

Measures how regular/consistent the timing intervals between events are.

```javascript
hd_tr => eadv.icd_z49_1.dt.temporal_regularity();
```

Returns coefficient of variation of intervals (lower = more regular):
- CV < 0.2 = highly regular
- CV 0.2-0.5 = moderately regular
- CV > 0.5 = irregular

### Other Fetch Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `.exists()` | 1 or 0 | Comorbidity presence check |
| `.nth(n)` | Nth value from end | Previous value comparison |

**`.exists()` example:**
```javascript
mi => eadv.[icd_i21%, icd_i22%, icd_i25_2].dt.exists();
cva => eadv.[icd_g45%, icd_g46%, icd_h34%, icd_i6%].dt.exists();
```

### Serialization Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `.serialize(delimiter)` | Concatenated string | All values joined |
| `.serializedv(delimiter)` | `value~date` pairs | Values with dates |
| `.serializedv2(format)` | Custom format | Expression-based serialization |

### Cross-Ruleblock: `.bind()`

```javascript
variable => rout_<source_ruleblock>.<variable_name>.val.bind();
```

### Filter: `.where()`

```javascript
variable => eadv.attribute.column.where(condition).function();
```

Available in conditions: `dt`, `val`, `sysdate`, comparison operators, `and`, `or`.

### Standard SQL Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `least_date(d1, d2, ...)` | Dates | Earliest date (NULL-safe) |
| `greatest_date(d1, d2, ...)` | Dates | Latest date (NULL-safe) |
| `least(v1, v2, ...)` | Values | Smallest value |
| `greatest(v1, v2, ...)` | Values | Largest value |
| `coalesce(v1, v2, ...)` | Values | First non-NULL value |
| `abs(x)` | Number | Absolute value |
| `round(x, n)` | Number, decimals | Round to n decimals |

### Date Arithmetic

| Period | Days | Expression |
|--------|------|------------|
| 1 month | 30 | `sysdate-30` |
| 3 months | 90 | `sysdate-90` |
| 6 months | 180 | `sysdate-180` |
| 1 year | 365 | `sysdate-365` |
| 2 years | 730 | `sysdate-730` |
| 5 years | 1825 | `sysdate-1825` |

---

# 6. Jinja2 Templating

Dashboard templates use Jinja2 to create dynamic HTML interfaces that display ruleblock outputs.

## Template Structure

Templates live in `picodomain_template_pack/template_blocks/` as paired files:

```
my_template.json      # Metadata
my_template.txt       # HTML/CSS content with Jinja2
```

### Metadata File (`.json`)

```json
{
  "name": "CKD Dashboard",
  "description": "Comprehensive CKD patient overview",
  "related_ruleblock": "ckd_diagnostics",
  "is_active": 2,
  "version": "1.0",
  "display_order": 10,
  "category": "Clinical"
}
```

### Content File (`.txt`)

```html
<div class="ckd-dashboard">
  <h2>CKD Status</h2>
  <p>Stage: {{ ckd_stage }}</p>
  {% if ckd_stage >= 4 %}
    <div class="alert">Advanced CKD - Nephrology referral needed</div>
  {% endif %}
</div>
```

## Jinja2 Syntax

### Variables
```jinja2
{{ variable_name }}
{{ variable_name | default('N/A') }}
{{ variable_name | round(1) }}
```

### Common Filters

| Filter | Purpose | Example |
|--------|---------|---------|
| `default(value)` | Fallback if NULL | `{{ hb \| default('N/A') }}` |
| `round(n)` | Round number | `{{ egfr \| round(1) }}` |
| `upper` / `lower` / `title` | Case conversion | `{{ status \| upper }}` |

### Control Structures

```jinja2
{% if condition %}
  ...
{% elif condition2 %}
  ...
{% else %}
  ...
{% endif %}

{% for item in collection %}
  {{ item }}
{% else %}
  No items found
{% endfor %}
```

### Comments
```jinja2
{# This is a comment #}
```

### Macros
```jinja2
{% macro badge(label, type) %}
  <span class="badge badge-{{ type }}">{{ label }}</span>
{% endmacro %}
```

### Frame Templates

Templates use a frame-based composition pattern:
```jinja2
{% include '__dashboard_header__.txt' %}
{% set frame_title = "CKD Overview" %}
{% include '__frame_begin__.txt' %}
<p>Content here</p>
{% include '__frame_end__.txt' %}
{% include '__dashboard_footer__.txt' %}
```

## Best Practices

1. Always handle missing data with `| default('N/A')`
2. Keep logic in ruleblocks, not templates — templates are for presentation
3. Use semantic CSS class names
4. Comment templates with version and related ruleblock info

---

# 7. Examples & Cookbook

## Example 1: CKD Staging

```javascript
#define_ruleblock(ckd_staging, {
    description: "CKD staging per KDIGO 2024 guidelines",
    is_active: 2,
    version: "2.0",
    target_table: "rout_ckd_staging",
    environment: "PROD"
});

// Functional Statements
egfr => eadv.lab_bld_egfr._.lastdv();
cr => eadv.lab_bld_creatinine._.lastdv();
acr => eadv.lab_ua_acr._.lastdv();
ckd_dx => eadv.icd_N18%.dt.max();
structural_dx => eadv.[icd_Q61%,icd_N03%].dt.max();
age => rout_global.age.val.bind();

// Conditional Statements
ckd_stage_egfr :
    { egfr_val >= 90 => 1 },
    { egfr_val >= 60 => 2 },
    { egfr_val >= 45 => 3a },
    { egfr_val >= 30 => 3b },
    { egfr_val >= 15 => 4 },
    { egfr_val < 15 => 5 },
    { => 0 };

acr_category :
    { acr_val < 3 => 1 },      // A1: Normal
    { acr_val < 30 => 2 },     // A2: Moderate
    { acr_val >= 30 => 3 },    // A3: Severe
    { => 0 };

has_kidney_damage :
    { ckd_dx!? => 1 },
    { structural_dx!? => 1 },
    { acr_category >= 2 => 1 },
    { => 0 };

ckd_stage :
    { ckd_stage_egfr >= 3 => ckd_stage_egfr },
    { ckd_stage_egfr <= 2 and has_kidney_damage = 1 => ckd_stage_egfr },
    { => 0 };

#define_attribute(ckd_stage, { label: "CKD Stage (0-5)", type: 1001, is_reportable: 1, is_bi_obj: 1 });
#doc(ckd_stage, { txt: "CKD stages per KDIGO 2024. Stages 1-2 require kidney damage evidence.", cite: "kdigo_ckd_2024" });
```

## Example 2: Anemia in CKD

```javascript
#define_ruleblock(ckd_anemia, {
    description: "Anemia assessment in CKD per KDIGO guidelines",
    is_active: 2, version: "1.5",
    target_table: "rout_ckd_anemia", environment: "PROD"
});

// Bind context
ckd_stage => rout_ckd_staging.ckd_stage.val.bind();

// Labs
hb => eadv.lab_bld_haemoglobin._.lastdv();
ferritin => eadv.lab_bld_ferritin._.lastdv();
tsat => eadv.lab_bld_tsat._.lastdv();

// Anemia definition
is_anaemic :
    { ckd_stage == 5 and hb_val < 100 => 1 },
    { ckd_stage >= 3 and hb_val < 115 => 1 },
    { hb_val < 120 => 1 },
    { => 0 };

// Iron deficiency
is_iron_deficient :
    { ferritin_val < 100 => 1 },
    { ferritin_val < 300 and tsat_val < 20 => 1 },
    { => 0 };

// ESA eligibility
esa_eligible :
    { is_anaemic = 1 and ckd_stage >= 3 and is_iron_deficient = 0 and hb_val < 100 => 1 },
    { => 0 };
```

## Example 3: Diabetes Risk Assessment

```javascript
#define_ruleblock(diabetes_risk, {
    description: "Pre-diabetes and diabetes risk assessment",
    is_active: 2, version: "1.0",
    target_table: "rout_diabetes_risk", environment: "PROD"
});

hba1c => eadv.lab_bld_hba1c._.lastdv();
glucose_fasting => eadv.lab_bld_glucose_fasting._.lastdv();
dm_dx => eadv.icd_E11%.dt.max();
dm_meds => eadv.rx_[metformin,gliclazide,insulin%,sglt2%,glp1%].dt.max();

has_diabetes :
    { dm_dx!? => 1 },
    { dm_meds!? => 1 },
    { hba1c_val >= 6.5 => 1 },
    { glucose_fasting_val >= 7.0 => 1 },
    { => 0 };

has_prediabetes :
    { has_diabetes = 1 => 0 },
    { hba1c_val >= 5.7 and hba1c_val < 6.5 => 1 },
    { glucose_fasting_val >= 5.6 and glucose_fasting_val < 7.0 => 1 },
    { => 0 };
```

## Example 4: Medication Reconciliation

```javascript
#define_ruleblock(med_recon, {
    description: "Medication reconciliation for CKD patients",
    is_active: 2, version: "1.0",
    target_table: "rout_med_recon", environment: "PROD"
});

ckd_stage => rout_ckd.ckd_stage.val.bind();
egfr => rout_ckd.egfr_last.val.bind();
is_diabetic => rout_dm.has_diabetes.val.bind();

acei => eadv.rx_[enalapril,ramipril,perindopril].dt.max();
arb => eadv.rx_[irbesartan,candesartan,telmisartan].dt.max();
nsaid => eadv.rx_[ibuprofen,diclofenac,naproxen].dt.max();

on_raas_blockade :
    { acei!? and acei > sysdate-90 => 1 },
    { arb!? and arb > sysdate-90 => 1 },
    { => 0 };

nsaid_concern :
    { ckd_stage >= 3 and nsaid!? and nsaid > sysdate-180 => 1 },
    { => 0 };
```

## Common Patterns

### Time-Windowed Aggregates
```javascript
cr_min_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).min();
cr_max_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).max();
aki_last_year : { cr_max_1yr >= cr_min_1yr * 2 => 1 }, { => 0 };
```

### Multi-Source Data Fusion
```javascript
sbp => eadv.[bp_device_systolic,bp_manual_systolic]._.lastdv();
```

### Risk Score Accumulation
```javascript
risk_base : { condition => 1 }, { => 0 };
risk_with_age : { risk_base = 1 and age >= 65 => risk_base + 1 }, { => risk_base };
risk_with_dm : { risk_with_age >= 1 and is_diabetic = 1 => risk_with_age + 2 }, { => risk_with_age };
```

### Date Freshness Check
```javascript
hb_dt => eadv.lab_bld_haemoglobin.dt.max();
hb_freshness :
    { hb_dt > sysdate-90 => 1 },       // Recent
    { hb_dt > sysdate-180 => 2 },      // Moderate
    { hb_dt > sysdate-365 => 3 },      // Old
    { hb_dt!? => 4 },                  // Very old
    { => 5 };                          // Never tested
```

### Presence Check
```javascript
has_cvd : { eadv.[icd_I21%,icd_I25%,icd_I63%,icd_I50%].dt.max()!? => 1 }, { => 0 };
```

### Conditional Date Selection
```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
cr_peak_dt => eadv.lab_bld_creatinine.dt.max();

aki_first :
    { aki_icd_dt!? and cr_peak_dt!? => least_date(aki_icd_dt, cr_peak_dt) },
    { aki_icd_dt!? => aki_icd_dt },
    { cr_peak_dt!? => cr_peak_dt };
```

### Days Since Last Visit
```javascript
last_visit_dt => eadv.enc_outpatient.dt.max();
days_since_visit :
    { last_visit_dt!? => sysdate - last_visit_dt },
    { => 9999 };
is_lost_to_followup : { days_since_visit > 365 => 1 }, { => 0 };
```

---

# 8. Reserved Keywords

**Operators:** `and`, `or`, `not`

**Fetch Functions:** `last`, `first`, `count`, `sum`, `avg`, `min`, `max`, `median`, `distinct_count`, `lastdv`, `firstdv`, `maxldv`, `minldv`, `minfdv`, `regr_slope`, `regr_intercept`, `regr_r2`, `stats_mode`, `max_neg_delta_dv`, `temporal_regularity`, `exists`, `nth`, `serialize`, `serializedv`, `serializedv2`, `bind`, `where`

**SQL Functions:** `coalesce`, `least_date`, `greatest_date`, `least`, `greatest`, `abs`, `round`

**Date/time:** `sysdate`

**Special:** `eadv` (EADV table reference), `rout_` (ruleblock output table prefix)

**Avoid using these as variable names.**
