# Functions Reference

This section documents all functions available in Picorules for data retrieval, aggregation, and transformation.

## Function Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Aggregation** | Get single value from multiple rows | `.last()`, `.max()`, `.min()` |
| **Date-Value** | Get paired date and value | `.lastdv()` |
| **Cross-Ruleblock** | Reference other ruleblocks | `.bind()` |
| **Date Functions** | Date arithmetic and comparison | `least_date()`, `greatest_date()` |
| **NULL Handling** | Manage missing values | `coalesce()` |
| **Math Functions** | Numerical operations | `abs()`, `round()` |

## Aggregation Functions

Used in functional statements to aggregate EADV data per patient.

### `.last()`

Returns the most recent value for an attribute.

**Syntax:**
```javascript
variable => eadv.attribute.val.last();
```

**Example:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

**Behavior:**
- Orders all rows for each patient by `dt` (date) descending
- Returns the `val` from the row with the latest date
- Returns NULL if no rows exist for the patient

**SQL Equivalent (conceptual):**
```sql
LAST_VALUE(val) OVER (PARTITION BY eid ORDER BY dt)
```

**Use Cases:**
- Most recent lab result
- Current medication dose
- Latest vital sign

**With Filtering:**
```javascript
// Most recent Hb in last 2 years
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();
```

---

### `.max()`

Returns the maximum value.

**Syntax:**
```javascript
// Maximum value
variable => eadv.attribute.val.max();

// Most recent date
variable => eadv.attribute.dt.max();
```

**Examples:**
```javascript
// Highest creatinine ever recorded
cr_max => eadv.lab_bld_creatinine.val.max();

// Most recent hemoglobin test date
hb_date => eadv.lab_bld_haemoglobin.dt.max();

// Last diagnosis date
ckd_dx_date => eadv.icd_N18%.dt.max();
```

**Behavior:**
- For `.val.max()`: Returns the largest numeric value
- For `.dt.max()`: Returns the most recent date
- Returns NULL if no rows exist

**Common Use:**
`.dt.max()` is extremely common for "last occurrence" queries:
```javascript
last_visit => eadv.enc_outpatient.dt.max();
```

**With Time Window:**
```javascript
// Peak creatinine in last year
cr_max_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).max();
```

---

### `.min()`

Returns the minimum value.

**Syntax:**
```javascript
variable => eadv.attribute.val.min();
```

**Examples:**
```javascript
// Lowest eGFR ever recorded
egfr_min => eadv.lab_bld_egfr.val.min();

// Lowest Hb in last year
hb_min_1yr => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-365).min();

// Baseline creatinine (lowest in first year)
cr_baseline => eadv.lab_bld_creatinine.val.where(dt < first_visit+365).min();
```

**Behavior:**
- Returns the smallest numeric value
- Returns NULL if no rows exist
- For dates: use `.dt.min()` for earliest date

**Use Cases:**
- Baseline measurements
- Best kidney function (lowest creatinine, highest eGFR)
- Trough values

---

### `.lastdv()`

Returns both the latest date AND value as a pair.

**Syntax:**
```javascript
variable => eadv.attribute._.lastdv();
```

**Note:** Use underscore `_` for the column specifier.

**Example:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
```

**Creates TWO variables:**
- `hb_val` — The hemoglobin value
- `hb_dt` — The date of that measurement

**Use in Conditionals:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Check both value and recency
needs_repeat :
    { hb_val < 100 and hb_dt < sysdate-90 => 1 },  // Low AND old
    { => 0 };
```

**Multi-Attribute Example:**
```javascript
// Get most recent RBC from either source
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
// Creates: ua_rbc_val, ua_rbc_dt
```

**Why Use `.lastdv()`:**
- When you need both value and date
- Checking test recency
- Temporal analysis

**vs. Separate Calls:**
```javascript
// ✅ Efficient: One query, guaranteed same row
hb => eadv.lab_bld_haemoglobin._.lastdv();

// ❌ Inefficient: Two queries, might get different rows
hb_val => eadv.lab_bld_haemoglobin.val.last();
hb_dt => eadv.lab_bld_haemoglobin.dt.max();
```

---

## Cross-Ruleblock Functions

### `.bind()`

References a variable calculated in another ruleblock.

**Syntax:**
```javascript
variable => rout_<source_ruleblock>.<variable_name>.val.bind();
```

**Example:**
```javascript
// In ckd.prb
egfr_last => eadv.lab_bld_egfr.val.last();

// In another ruleblock
egfr => rout_ckd.egfr_last.val.bind();
```

**Pattern:**
- `rout_<ruleblock_id>` — Output table from another ruleblock
- `<variable_name>` — Variable defined in that ruleblock
- `.val.bind()` — Bind the value

**Multiple Bindings:**
```javascript
// Get multiple variables from ckd ruleblock
ckd_stage => rout_ckd.ckd_stage.val.bind();
egfr => rout_ckd.egfr_last.val.bind();
albuminuria => rout_ckd.albuminuria_cat.val.bind();

// Use them in logic
high_risk :
    { ckd_stage >= 4 => 1 },
    { ckd_stage >= 3 and albuminuria >= 3 => 1 },
    { => 0 };
```

**Binding Dates:**
```javascript
// If source ruleblock used .lastdv()
hb_val => rout_labs.hb_val.val.bind();
hb_dt => rout_labs.hb_dt.val.bind();
```

**Use Cases:**
- Reuse complex calculations (risk scores, staging)
- Modular ruleblock design
- Avoid code duplication
- Maintain single source of truth

**Performance:**
Output tables (`rout_*`) have one row per patient—binding is very efficient (simple join on `eid`).

---

## Date Functions

Functions for working with dates and temporal logic.

### `least_date()`

Returns the earliest (minimum) date from multiple dates.

**Syntax:**
```javascript
least_date(date1, date2, ...)
```

**Example:**
```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
aki_cr_dt => eadv.lab_bld_creatinine.dt.max();  // Simplified

// Get earliest AKI indicator
aki_first_dt :
    { aki_icd_dt!? and aki_cr_dt!? => least_date(aki_icd_dt, aki_cr_dt) },
    { aki_icd_dt!? => aki_icd_dt },
    { aki_cr_dt!? => aki_cr_dt };
```

**With More Dates:**
```javascript
earliest : { all_exist => least_date(dt1, dt2, dt3, dt4) };
```

**NULL Handling:**
- If all dates are NULL, returns NULL
- Non-NULL dates are compared; NULLs ignored
- Best practice: Check `!?` before calling

---

### `greatest_date()`

Returns the latest (maximum) date from multiple dates.

**Syntax:**
```javascript
greatest_date(date1, date2, ...)
```

**Example:**
```javascript
dm_dx_dt => eadv.icd_E11%.dt.max();
dm_med_dt => eadv.rx_metformin.dt.max();

// Most recent diabetes indicator
dm_last_dt :
    { dm_dx_dt!? and dm_med_dt!? => greatest_date(dm_dx_dt, dm_med_dt) },
    { dm_dx_dt!? => dm_dx_dt },
    { dm_med_dt!? => dm_med_dt };
```

**Use Cases:**
- Finding most recent of multiple events
- Last interaction across categories

---

### Date Arithmetic

Perform addition/subtraction on dates using `sysdate`.

**Syntax:**
```javascript
sysdate          // Current system date
sysdate - n      // n days ago
sysdate + n      // n days from now
```

**Examples:**
```javascript
// Test is recent if within 2 years
is_recent : { hb_dt > sysdate-730 => 1 }, { => 0 };

// Due for repeat if last test > 6 months ago
due_for_test : { last_test_dt < sysdate-180 => 1 }, { => 0 };

// Upcoming appointment
is_upcoming : { appt_dt > sysdate and appt_dt < sysdate+30 => 1 }, { => 0 };
```

**Common Time Windows:**
| Period | Days | Expression |
|--------|------|------------|
| 1 month | 30 | `sysdate-30` |
| 3 months | 90 | `sysdate-90` |
| 6 months | 180 | `sysdate-180` |
| 1 year | 365 | `sysdate-365` |
| 2 years | 730 | `sysdate-730` |
| 5 years | 1825 | `sysdate-1825` |

**In Functional Statements:**
```javascript
// Only consider recent tests
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-365).last();
```

---

## NULL Handling Functions

### `coalesce()`

Returns the first non-NULL value from a list.

**Syntax:**
```javascript
coalesce(value1, value2, value3, ...)
```

**Example:**
```javascript
ferritin => eadv.lab_bld_ferritin.val.last();
default_ferritin => 0;

// Use actual ferritin if available, otherwise 0
ferritin_or_default : { coalesce(ferritin, default_ferritin) => coalesce(ferritin, default_ferritin) };

// More typical: use in condition
has_value : { coalesce(ferritin, -1)!? => 1 }, { => 0 };
```

**With Dates:**
```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
cr_spike_dt => eadv.lab_bld_creatinine.dt.max();

// Use either date, whichever exists
aki_any_dt : { coalesce(aki_icd_dt, cr_spike_dt)!? => coalesce(aki_icd_dt, cr_spike_dt) };
```

**Use Cases:**
- Providing default values
- Fallback logic
- Checking if any of several values exist

---

## Mathematical Functions

### `abs()`

Returns the absolute value (magnitude without sign).

**Syntax:**
```javascript
abs(number)
```

**Example:**
```javascript
cr_baseline => eadv.lab_bld_creatinine.val.min();
cr_last => eadv.lab_bld_creatinine.val.last();

// Absolute change in creatinine
cr_change : { cr_last!? and cr_baseline!? => abs(cr_last - cr_baseline) };
```

**Use Cases:**
- Calculating change (regardless of direction)
- Distance metrics
- Absolute differences

---

### `round()`

Rounds a number to specified decimal places.

**Syntax:**
```javascript
round(number, decimals)
```

**Example:**
```javascript
egfr_raw => eadv.lab_bld_egfr.val.last();

// Round to 1 decimal place
egfr_rounded : { egfr_raw!? => round(egfr_raw, 1) };

// Round to integer
egfr_int : { egfr_raw!? => round(egfr_raw, 0) };
```

**Use Cases:**
- Display formatting
- Reducing precision
- Standardizing values

---

## Filtering Functions

### `.where()`

Filters rows before aggregation.

**Syntax:**
```javascript
variable => eadv.attribute.column.where(condition).function();
```

**Available in Conditions:**
- `dt` — Date column
- `val` — Value column
- `sysdate` — Current date
- Comparison operators: `>`, `<`, `>=`, `<=`, `=`, `!=`
- Boolean operators: `and`, `or`

**Examples:**

**Filter by Date:**
```javascript
// Only last 2 years
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();

// Within specific date range
hb_2023 => eadv.lab_bld_haemoglobin.val.where(dt >= '2023-01-01' and dt < '2024-01-01').last();
```

**Filter by Value:**
```javascript
// Only abnormal results
hb_low_values => eadv.lab_bld_haemoglobin.val.where(val < 120).min();

// Exclude outliers
cr_reasonable => eadv.lab_bld_creatinine.val.where(val > 20 and val < 500).last();
```

**Filter by Other Columns:**
```javascript
// Only from main lab (if 'source' column exists)
hb_main_lab => eadv.lab_bld_haemoglobin.val.where(source='main_lab').last();

// Only finalized results (if 'status' column exists)
hb_final => eadv.lab_bld_haemoglobin.val.where(status='final').last();
```

**Complex Conditions:**
```javascript
// Recent AND abnormal
hb_recent_low => eadv.lab_bld_haemoglobin.val
    .where(dt > sysdate-365 and val < 100)
    .min();
```

**Use Cases:**
- Temporal filtering (recent data only)
- Quality filtering (exclude outliers, pending results)
- Source filtering (specific lab, device, provider)
- Value-based filtering (abnormal results only)

---

## Wildcard Patterns

Not functions per se, but special syntax for matching multiple attributes.

### Single Wildcard: `%`

Matches any characters (like SQL LIKE).

**Examples:**
```javascript
// Any CKD diagnosis
ckd_dx => eadv.icd_N18%.dt.max();
// Matches: icd_N18.1, icd_N18.2, icd_N18.3, etc.

// Any diabetes medication
dm_med => eadv.rx_%metformin%.dt.max();
// Matches: rx_metformin, rx_metformin_er, rx_metformin_xr

// Any lab test
last_lab => eadv.lab_%.dt.max();
```

### Multi-Attribute Lists: `[att1,att2,...]`

Matches any of the specified attributes (OR logic).

**Examples:**
```javascript
// Either standard or POC test
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();

// Any of these diagnoses
ckd_related_dx => eadv.[icd_N18%,icd_N19%,icd_Z99.2].dt.max();
```

### Combining Wildcards and Lists:

```javascript
// Any ICD code OR any lab test
last_clinical_data => eadv.[icd_%,lab_%].dt.max();
```

---

## Function Chaining

Some functions can be chained:

```javascript
// Filter THEN aggregate
hb_recent_min => eadv.lab_bld_haemoglobin.val
    .where(dt > sysdate-730)
    .min();
```

**Order:**
1. Select attribute(s)
2. Apply `.where()` filter (optional)
3. Apply aggregation function (`.last()`, `.max()`, etc.)

---

## Common Function Combinations

### Get Recent Value and Date

```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Use both
is_low_and_recent :
    { hb_val < 100 and hb_dt > sysdate-90 => 1 },
    { => 0 };
```

### Compare Current to Baseline

```javascript
cr_baseline => eadv.lab_bld_creatinine.val.min();
cr_current => eadv.lab_bld_creatinine.val.last();

cr_doubled : { cr_current >= cr_baseline * 2 => 1 }, { => 0 };
```

### Find Earliest of Multiple Events

```javascript
dx_dt => eadv.icd_N18%.dt.max();
lab_dt => eadv.lab_bld_creatinine.dt.max();
med_dt => eadv.rx_enalapril.dt.max();

first_ckd_indicator :
    { dx_dt!? and lab_dt!? and med_dt!? => least_date(dx_dt, lab_dt, med_dt) },
    { coalesce(dx_dt, lab_dt, med_dt)!? => coalesce(dx_dt, lab_dt, med_dt) };
```

### Aggregate Over Time Window

```javascript
// Minimum in last year
cr_min_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).min();

// Maximum in last year
cr_max_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).max();

// AKI = creatinine doubled
aki_last_year : { cr_max_1yr >= cr_min_1yr * 2 => 1 }, { => 0 };
```

---

## Function Reference Table

| Function | Category | Input | Output | Use Case |
|----------|----------|-------|--------|----------|
| `.last()` | Aggregation | Column | Single value | Most recent value |
| `.max()` | Aggregation | Column | Single value | Maximum value or latest date |
| `.min()` | Aggregation | Column | Single value | Minimum value or earliest date |
| `.lastdv()` | Date-Value | `_` | Two values | Latest date-value pair |
| `.bind()` | Cross-Ruleblock | Ruleblock variable | Single value | Reference another ruleblock |
| `.where()` | Filter | Condition | Filtered rows | Pre-filter before aggregation |
| `least_date()` | Date | Multiple dates | Single date | Earliest of several dates |
| `greatest_date()` | Date | Multiple dates | Single date | Latest of several dates |
| `coalesce()` | NULL | Multiple values | First non-NULL | Default value logic |
| `abs()` | Math | Number | Number | Absolute value |
| `round()` | Math | Number, decimals | Number | Round to precision |

---

## Next Topics

- [Jinja2 Templating](#jinja2-templating) — Dashboard templates
- [Examples](#examples) — Real-world function usage patterns
