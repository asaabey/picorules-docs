# Functions Reference

This section documents all functions available in Picorules for data retrieval, aggregation, and transformation.

## Understanding Function Types

Picorules has two fundamentally different types of functions:

### Fetch Functions (Custom Picorules Implementation)

These are **custom DSL functions** that query the EADV data model and generate SQL CTEs with window functions. They:
- Use dot notation: `.function()`
- Operate on EADV table data in functional statements
- Generate complex SQL with ROW_NUMBER, partitioning, aggregations
- Return aggregated/windowed results (one row per patient)

**Examples:** `.last()`, `.first()`, `.count()`, `.lastdv()`, `.regr_slope()`

### Standard SQL Functions (Direct Translation)

These are **standard SQL functions** that are translated directly to the target SQL dialect. They:
- Use function call syntax: `function(args)`
- Operate on already-computed variables
- Used primarily in conditional statements
- Passed through to SQL with minimal transformation

**Examples:** `coalesce()`, `abs()`, `round()`, `least_date()`, `greatest_date()`

---

## Function Categories Overview

| Category | Purpose | Examples |
|----------|---------|----------|
| **Basic Fetch** | Get single values from rows | `.last()`, `.first()`, `.count()` |
| **Aggregation** | Aggregate multiple rows | `.sum()`, `.avg()`, `.min()`, `.max()`, `.median()` |
| **Date-Value (DV)** | Get paired date and value | `.lastdv()`, `.firstdv()`, `.maxldv()`, `.minldv()` |
| **Statistical** | Regression and frequency analysis | `.regr_slope()`, `.regr_r2()`, `.stats_mode()` |
| **Advanced Analysis** | Specialized clinical metrics | `.max_neg_delta_dv()`, `.temporal_regularity()` |
| **Serialization** | Concatenate values to strings | `.serialize()`, `.serializedv()` |
| **Cross-Ruleblock** | Reference other ruleblocks | `.bind()` |
| **Filter** | Pre-filter data | `.where()` |
| **Standard SQL** | Date, NULL, math operations | `coalesce()`, `least_date()`, `abs()` |

---

## Basic Fetch Functions

Used in functional statements to retrieve single values from EADV data.

### `.last()`

Returns the most recent value for an attribute (ordered by date descending).

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

### `.first()`

Returns the earliest value for an attribute (ordered by date ascending).

**Syntax:**
```javascript
variable => eadv.attribute.val.first();
```

**Example:**
```javascript
// First lung cancer diagnosis date
icd_fd => eadv.[icd_c34%].dt.first();
```

**Behavior:**
- Orders all rows for each patient by `dt` (date) ascending
- Returns the value from the row with the earliest date
- Returns NULL if no rows exist for the patient

**Use Cases:**
- First diagnosis date for a condition
- Baseline measurement
- Initial encounter with a service

**Real-World Example:**
```javascript
// From ca_lung.prb - First lung cancer diagnosis
icd_fd => eadv.[icd_c34%].dt.first();
```

---

### `.count()`

Counts the number of rows/occurrences for an attribute per patient.

**Syntax:**
```javascript
variable => eadv.attribute.column.count();
variable => eadv.attribute.column.count(default);  // With default value
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| default | number | No | Default value if count is 0 (typically 0) |

**Example:**
```javascript
// Count HD sessions
hd_n => eadv.[icd_z49_1,mbs_13105].dt.count();

// Count with default
hb_n => eadv.lab_bld_hb.dt.count(0);
```

**Behavior:**
- Counts all matching rows per patient
- Returns integer count
- With default parameter: returns default instead of NULL when no rows

**Use Cases:**
- Number of dialysis sessions
- Visit frequency
- Number of abnormal lab results

**With Filtering:**
```javascript
// Count optimal HbA1c results in last 2 years
hba1c_n_opt => eadv.lab_bld_hba1c_ngsp.dt.where(val>=6 and val<8 and dt > sysdate-730).count();
```

---

## Aggregation Functions

Used to aggregate multiple rows per patient into summary statistics.

### `.sum()`

Returns the sum of all values per patient.

**Syntax:**
```javascript
variable => eadv.attribute.val.sum();
```

**Example:**
```javascript
total_dose => eadv.rx_insulin.val.sum();
```

**Behavior:**
- Sums all numeric values for each patient
- Returns NULL if no rows exist
- Casts values to FLOAT for calculation

**Use Cases:**
- Total medication doses
- Cumulative measurements
- Sum of scores

---

### `.avg()`

Returns the arithmetic mean of all values per patient.

**Syntax:**
```javascript
variable => eadv.attribute.val.avg();
```

**Example:**
```javascript
// Average eGFR in last 30 days
egfr_30_mu => eadv.lab_bld_egfr_c.val.where(dt>sysdate-30).avg();
```

**Behavior:**
- Calculates mean of all numeric values
- Returns NULL if no rows exist
- Casts values to FLOAT for calculation

**Use Cases:**
- Average lab value over time period
- Mean blood pressure
- Average medication dosage

**Real-World Example:**
```javascript
// From ckd_dense.prb - Average eGFR in observation window
egfr_30_mu => eadv.lab_bld_egfr_c.val.where(dt>egfr_l_dt-30).avg();
```

---

### `.min()`

Returns the minimum value per patient.

**Syntax:**
```javascript
variable => eadv.attribute.val.min();
variable => eadv.attribute.dt.min();  // For earliest date
```

**Examples:**
```javascript
// Lowest eGFR ever recorded
egfr_min => eadv.lab_bld_egfr.val.min();

// Earliest diagnosis date
first_dx_dt => eadv.icd_N18%.dt.min();
```

**Behavior:**
- For `.val.min()`: Returns the smallest numeric value
- For `.dt.min()`: Returns the earliest date
- Returns NULL if no rows exist

**Use Cases:**
- Baseline measurements (lowest creatinine)
- Best kidney function (lowest creatinine, highest eGFR)
- Trough values
- Earliest date of condition

---

### `.max()`

Returns the maximum value per patient.

**Syntax:**
```javascript
variable => eadv.attribute.val.max();
variable => eadv.attribute.dt.max();  // For most recent date
```

**Examples:**
```javascript
// Highest creatinine ever recorded
cr_max => eadv.lab_bld_creatinine.val.max();

// Most recent hemoglobin test date
hb_date => eadv.lab_bld_haemoglobin.dt.max();
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

---

### `.median()`

Returns the median (50th percentile) of all values per patient.

**Syntax:**
```javascript
variable => eadv.attribute.val.median();
```

**Example:**
```javascript
// Median creatinine (baseline for AKI detection)
cr_median_1y => eadv.lab_bld_creatinine.val.where(dt<cr_ld-90).median();
```

**Behavior:**
- Calculates the 50th percentile value
- More resistant to outliers than mean
- Returns NULL if no rows exist

**Use Cases:**
- Baseline creatinine for AKI detection (KDIGO recommends median)
- Typical blood pressure (resistant to outliers)
- Representative value when data is skewed

**Real-World Example:**
```javascript
// From tg4100.prb - Baseline creatinine using median
cr_median_1y => eadv.lab_bld_creatinine.val.where(dt<cr_ld-90).median();
```

---

### `.distinct_count()`

Counts the number of distinct/unique values per patient.

**Syntax:**
```javascript
variable => eadv.attribute.column.distinct_count();
variable => eadv.attribute.column.distinct_count(default);
```

**Example:**
```javascript
// Count distinct visit dates at specific location
loc_n => eadv.[caresys_1310000].dt.where(substr(loc,8,5)='10857').distinct_count();
```

**Behavior:**
- Counts unique values (SQL: `COUNT(DISTINCT column)`)
- Returns integer count
- Useful when same value appears multiple times

**Use Cases:**
- Number of unique visit dates
- Number of different diagnoses
- Distinct locations attended

**Real-World Example:**
```javascript
// From kpi_uncategorised.prb - Distinct ICD diagnoses in last year
total_dc_n => eadv.[icd_%].dt.distinct_count(0).where(dt > sysdate-365);
```

---

## Date-Value Pair Functions (DV Functions)

These functions return **TWO columns**: a value and its corresponding date. The variable creates `variable_val` and `variable_dt` outputs.

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
- `hb_val` - The hemoglobin value
- `hb_dt` - The date of that measurement

**Use in Conditionals:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Check both value and recency
needs_repeat :
    { hb_val < 100 and hb_dt < sysdate-90 => 1 },  // Low AND old
    { => 0 };
```

**Why Use `.lastdv()`:**
```javascript
// Efficient: One query, guaranteed same row
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Inefficient: Two queries, might get different rows
hb_val => eadv.lab_bld_haemoglobin.val.last();
hb_dt => eadv.lab_bld_haemoglobin.dt.max();
```

---

### `.firstdv()`

Returns both the earliest date AND value as a pair.

**Syntax:**
```javascript
variable => eadv.attribute._.firstdv();
```

**Example:**
```javascript
// First eGFR test in last 10 years
egfr_f => eadv.lab_bld_egfr_c.val.where(dt > sysdate - 3650).firstdv();
```

**Creates TWO variables:**
- `variable_val` - The value from the earliest record
- `variable_dt` - The date of that record

**Use Cases:**
- Baseline lab value with date
- First diagnosis with date
- Initial presentation value

**Real-World Example:**
```javascript
// From egfr_graph2.prb
egfr_f => eadv.lab_bld_egfr_c.val.where(dt > sysdate - 3650).firstdv();
```

---

### `.maxldv()`

Returns the maximum value AND the date when that maximum occurred.

**Syntax:**
```javascript
variable => eadv.attribute._.maxldv();
```

**Example:**
```javascript
// Peak Hb in last 2 years
hb_max => eadv.lab_bld_hb._.where(dt>sysdate-730).maxldv();
```

**Creates TWO variables:**
- `variable_val` - The maximum value
- `variable_dt` - The date of the maximum value

**Note:** When there are ties (multiple rows with the same max value), returns the most recent date.

**Use Cases:**
- Peak creatinine during AKI episode with date
- Highest blood pressure reading with date
- Maximum HbA1c with date

**Real-World Example:**
```javascript
// From cd_dm_glyc_cntrl.prb - Peak HbA1c ever
hba1c_max => eadv.lab_bld_hba1c_ngsp._.maxldv();
```

---

### `.minldv()`

Returns the minimum value AND the date when that minimum occurred.

**Syntax:**
```javascript
variable => eadv.attribute._.minldv();
```

**Example:**
```javascript
// Lowest Hb in last 2 years
hb_min => eadv.lab_bld_hb._.where(dt>sysdate-730).minldv();
```

**Creates TWO variables:**
- `variable_val` - The minimum value
- `variable_dt` - The date of the minimum value

**Note:** When there are ties, returns the most recent date of the minimum value.

**Use Cases:**
- Lowest eGFR (worst kidney function) with date
- Nadir hemoglobin with date
- Trough drug level with date

---

### `.minfdv()`

Returns the minimum value AND the **FIRST** date when that minimum occurred.

**Syntax:**
```javascript
variable => eadv.attribute._.minfdv();
```

**Difference from `.minldv()`:**
- `.minldv()` returns the LAST (most recent) date of the minimum
- `.minfdv()` returns the FIRST (earliest) date of the minimum

**Example:**
```javascript
// Minimum creatinine after transplant (nadir) - first occurrence
cr_min => eadv.lab_bld_creatinine._.where(dt > tx_dt).minfdv();
```

**Use Cases:**
- Post-transplant nadir creatinine (when function was best)
- First occurrence of minimum value
- Baseline establishment

**Real-World Example:**
```javascript
// From rrt_tx.prb
cr_min => eadv.lab_bld_creatinine._.where(dt > tx_dt).minfdv();
```

---

## Statistical Functions

Functions for statistical analysis including regression and frequency analysis.

### `.regr_slope()`

Calculates the slope of linear regression of values over time.

**Syntax:**
```javascript
variable => eadv.attribute.val.regr_slope();
```

**Return Value:** Slope coefficient (change in value per day)

**Example:**
```javascript
// eGFR decline rate
egfr_slope => eadv.lab_bld_egfr_c.val.regr_slope();
```

**Behavior:**
- Uses days since first measurement as X variable
- Value as Y variable
- Calculates slope of best-fit line

**Interpretation:**
- Negative slope = declining values over time
- For eGFR: slope of -0.01 means losing 0.01 mL/min/1.73m² per day (~3.65/year)

**Use Cases:**
- Rate of eGFR decline (CKD progression)
- Blood pressure trend
- Weight change trajectory

**Real-World Example:**
```javascript
// From egfr_metrics.prb - eGFR decline rate after hitting 60
p3_b1 => eadv.lab_bld_egfr_c.val.where(dt>egfr60_last_dt).regr_slope();
```

---

### `.regr_intercept()`

Calculates the y-intercept of linear regression of values over time.

**Syntax:**
```javascript
variable => eadv.attribute.val.regr_intercept();
```

**Return Value:** Intercept coefficient (predicted value at time zero)

**Example:**
```javascript
egfr_intercept => eadv.lab_bld_egfr_c.val.regr_intercept();
```

**Use Cases:**
- Baseline estimation from regression
- Combined with slope for prediction

---

### `.regr_r2()`

Calculates the R-squared (coefficient of determination) for the linear regression.

**Syntax:**
```javascript
variable => eadv.attribute.val.regr_r2();
```

**Return Value:** R-squared value (0 to 1, where 1 = perfect linear fit)

**Example:**
```javascript
egfr_r2 => eadv.lab_bld_egfr_c.val.regr_r2();
```

**Interpretation:**
- R² near 1.0 = data closely follows linear trend
- R² near 0 = poor linear fit, slope unreliable
- Use to filter out unreliable trend estimates

**Real-World Example:**
```javascript
// From egfr_metrics.prb - Only trust slopes with good fit
slope_valid : { egfr_r2 > 0.5 => 1 }, { => 0 };
```

---

### `.stats_mode()`

Returns the most frequently occurring value per patient (statistical mode).

**Syntax:**
```javascript
variable => eadv.attribute.column.stats_mode();
```

**Example:**
```javascript
// Most frequent location in last 2 years
primary_loc => eadv.[mbs_%].loc.where(dt > sysdate - 730).stats_mode();
```

**Behavior:**
- Counts occurrences of each value
- Returns the most frequent value
- Handles ties by returning alphabetically first value

**Use Cases:**
- Primary healthcare location
- Most common dialysis unit
- Typical prescribing pattern

**Real-World Example:**
```javascript
// From dmg_loc.prb
mode_24_ => eadv.[mbs_%].loc.where(dt > sysdate - 730).stats_mode();
```

---

## Advanced Analysis Functions

Specialized functions for clinical metric analysis.

### `.max_neg_delta_dv()`

Finds the largest decrease between consecutive values (sorted by date) and returns both the delta and the date when it occurred.

**Syntax:**
```javascript
variable => eadv.attribute.val.max_neg_delta_dv();
```

**Creates TWO variables:**
- `variable_val` - The largest negative delta (as a negative number)
- `variable_dt` - The date when this drop occurred

**Example:**
```javascript
// Largest eGFR drop between tests
gap_max => eadv.lab_bld_egfr_c.val.max_neg_delta_dv();
```

**Behavior:**
- Calculates difference between consecutive values (current - previous)
- Filters for negative deltas (decreases)
- Returns the largest decrease and its date

**Use Cases:**
- Acute kidney injury detection (sudden creatinine rise = eGFR drop)
- Largest hemoglobin drop (acute bleed)
- Sudden deterioration in any metric

**Real-World Example:**
```javascript
// From egfr_metrics.prb
gap_max => eadv.lab_bld_egfr_c.val.max_neg_delta_dv();
```

---

### `.temporal_regularity()`

Measures how regular/consistent the timing intervals between events are.

**Syntax:**
```javascript
variable => eadv.attribute.dt.temporal_regularity();
```

**Return Value:** Coefficient of variation of intervals (lower = more regular)
- 0 = perfectly regular intervals
- Higher values = more irregular timing

**Example:**
```javascript
// Regularity of HD sessions
hd_tr => eadv.icd_z49_1.dt.temporal_regularity();
```

**Behavior:**
- Calculates intervals between consecutive events
- Returns: STDDEV(intervals) / AVG(intervals)
- Returns NULL if fewer than 2 events

**Interpretation:**
- CV < 0.2 = highly regular
- CV 0.2-0.5 = moderately regular
- CV > 0.5 = irregular

**Use Cases:**
- Dialysis session regularity (adherence indicator)
- Appointment attendance consistency
- Medication refill regularity

**Real-World Example:**
```javascript
// From rrt_1_metrics.prb
hd_tr => eadv.icd_z49_1.dt.temporal_regularity();
hd_sl : { .=> round(hd_tr*100,0) };  // Convert to percentage
```

---

## Other Fetch Functions

### `.exists()`

Returns 1 if ANY matching records exist, 0 otherwise.

**Syntax:**
```javascript
variable => eadv.attribute.column.exists();
```

**Return Value:** 1 (exists) or 0 (does not exist)

**Example:**
```javascript
// Has any diabetes diagnosis
has_dm => eadv.[icd_E11%,icd_E10%].dt.exists();
```

**Behavior:**
- Returns 1 if COUNT(*) > 0
- Returns 0 if no matching rows
- Useful for presence/absence checks

**Use Cases:**
- Comorbidity presence/absence
- Has diagnosis (yes/no)
- Has ever had procedure (yes/no)

**Real-World Example:**
```javascript
// From cmidx_charlson.prb - Charlson Comorbidity Index
mi => eadv.[icd_i21%, icd_i22%, icd_i25_2].dt.exists();
cva => eadv.[icd_g45%, icd_g46%, icd_h34%, icd_i6%].dt.exists();
ca => eadv.[icd_c%].dt.exists();
```

---

### `.nth(n)`

Returns the nth value from the end (ordered by date descending).

**Syntax:**
```javascript
variable => eadv.attribute.val.nth(n);
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| n | integer | Yes | Position from end (1 = last, 2 = second-to-last) |

**Example:**
```javascript
// Second-to-last creatinine value
cr_prev => eadv.lab_bld_creatinine.val.nth(2);
```

**Use Cases:**
- Previous value comparison
- Trend detection
- Delta calculations

---

## Serialization Functions

Functions for concatenating multiple values into strings. These are less commonly used and are briefly documented here.

### `.serialize(delimiter)`

Concatenates all values into a single delimited string, ordered by date.

**Syntax:**
```javascript
variable => eadv.attribute.val.serialize(',');
variable => eadv.attribute.val.serialize();  // Default: comma
```

**Example:**
```javascript
all_hb_values => eadv.lab_bld_haemoglobin.val.serialize(',');
// Result: "118,120,115,122"
```

### `.serializedv(delimiter)`

Concatenates values WITH their dates in format: `value~date`.

**Syntax:**
```javascript
variable => eadv.attribute._.serializedv(',');
```

**Example:**
```javascript
hb_history => eadv.lab_bld_haemoglobin._.serializedv(',');
// Result: "118~2024-01-15,120~2024-02-20,115~2024-03-10"
```

### `.serializedv2(format)`

Custom format serialization with expression support.

**Syntax:**
```javascript
variable => eadv.attribute._.serializedv2('expression');
```

**Example:**
```javascript
// Round values before serializing
hb_rounded => eadv.lab_bld_haemoglobin._.serializedv2('round(val,0)~dt');
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
- `rout_<ruleblock_id>` - Output table from another ruleblock
- `<variable_name>` - Variable defined in that ruleblock
- `.val.bind()` - Bind the value

**Multiple Bindings:**
```javascript
ckd_stage => rout_ckd.ckd_stage.val.bind();
egfr => rout_ckd.egfr_last.val.bind();
albuminuria => rout_ckd.albuminuria_cat.val.bind();
```

**Binding DV Variables:**
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

---

## Filter Functions

### `.where()`

Filters rows before aggregation.

**Syntax:**
```javascript
variable => eadv.attribute.column.where(condition).function();
```

**Available in Conditions:**
- `dt` - Date column
- `val` - Value column
- `sysdate` - Current date
- Comparison operators: `>`, `<`, `>=`, `<=`, `=`, `!=`
- Boolean operators: `and`, `or`

**Examples:**

**Filter by Date:**
```javascript
// Only last 2 years
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();
```

**Filter by Value:**
```javascript
// Only abnormal results
hb_abnormal_min => eadv.lab_bld_haemoglobin.val.where(val < 120).min();
```

**Complex Conditions:**
```javascript
// Recent AND abnormal
hb_recent_low => eadv.lab_bld_haemoglobin.val
    .where(dt > sysdate-365 and val < 100)
    .min();
```

---

## Standard SQL Functions

These functions are translated directly to the target SQL dialect and are used primarily in conditional statements.

### Date Functions

#### `least_date()`

Returns the earliest (minimum) date from multiple dates.

**Syntax:**
```javascript
least_date(date1, date2, ...)
```

**Example:**
```javascript
aki_first_dt :
    { aki_icd_dt!? and aki_cr_dt!? => least_date(aki_icd_dt, aki_cr_dt) },
    { aki_icd_dt!? => aki_icd_dt },
    { aki_cr_dt!? => aki_cr_dt };
```

#### `greatest_date()`

Returns the latest (maximum) date from multiple dates.

**Syntax:**
```javascript
greatest_date(date1, date2, ...)
```

**Example:**
```javascript
dm_last_dt :
    { dm_dx_dt!? and dm_med_dt!? => greatest_date(dm_dx_dt, dm_med_dt) },
    { => coalesce(dm_dx_dt, dm_med_dt) };
```

#### `least()` and `greatest()`

Return the smallest/largest value from multiple values.

**Syntax:**
```javascript
least(value1, value2, ...)
greatest(value1, value2, ...)
```

### Date Arithmetic

Perform addition/subtraction on dates using `sysdate`.

**Syntax:**
```javascript
sysdate          // Current system date
sysdate - n      // n days ago
sysdate + n      // n days from now
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

---

### NULL Handling Functions

#### `coalesce()`

Returns the first non-NULL value from a list.

**Syntax:**
```javascript
coalesce(value1, value2, value3, ...)
```

**Example:**
```javascript
// Use either date, whichever exists
aki_any_dt : { coalesce(aki_icd_dt, cr_spike_dt)!? => coalesce(aki_icd_dt, cr_spike_dt) };
```

---

### Mathematical Functions

#### `abs()`

Returns the absolute value.

**Syntax:**
```javascript
abs(number)
```

**Example:**
```javascript
cr_change : { cr_last!? and cr_baseline!? => abs(cr_last - cr_baseline) };
```

#### `round()`

Rounds a number to specified decimal places.

**Syntax:**
```javascript
round(number, decimals)
```

**Example:**
```javascript
egfr_rounded : { egfr_raw!? => round(egfr_raw, 1) };
```

---

## Wildcard Patterns

Special syntax for matching multiple attributes (not functions, but commonly used with functions).

### Single Wildcard: `%`

Matches any characters (like SQL LIKE).

```javascript
// Any CKD diagnosis
ckd_dx => eadv.icd_N18%.dt.max();
// Matches: icd_N18.1, icd_N18.2, icd_N18.3, etc.
```

### Multi-Attribute Lists: `[att1,att2,...]`

Matches any of the specified attributes (OR logic).

```javascript
// Either standard or POC test
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

---

## Complete Function Reference Table

### Fetch Functions

| Function | Category | Output | Parameters | Description |
|----------|----------|--------|------------|-------------|
| `.last()` | Basic | Single | - | Most recent value by date |
| `.first()` | Basic | Single | - | Earliest value by date |
| `.count()` | Basic | Single | (default) | Count of occurrences |
| `.sum()` | Aggregation | Single | - | Sum of values |
| `.avg()` | Aggregation | Single | - | Average of values |
| `.min()` | Aggregation | Single | - | Minimum value |
| `.max()` | Aggregation | Single | - | Maximum value |
| `.median()` | Aggregation | Single | - | Median (50th percentile) |
| `.distinct_count()` | Aggregation | Single | (default) | Count of unique values |
| `.lastdv()` | Date-Value | Dual | - | Last value + date |
| `.firstdv()` | Date-Value | Dual | - | First value + date |
| `.maxldv()` | Date-Value | Dual | - | Max value + last date |
| `.minldv()` | Date-Value | Dual | - | Min value + last date |
| `.minfdv()` | Date-Value | Dual | - | Min value + first date |
| `.regr_slope()` | Statistical | Single | - | Linear regression slope |
| `.regr_intercept()` | Statistical | Single | - | Linear regression intercept |
| `.regr_r2()` | Statistical | Single | - | R-squared coefficient |
| `.stats_mode()` | Statistical | Single | - | Most frequent value |
| `.max_neg_delta_dv()` | Advanced | Dual | - | Largest decrease + date |
| `.temporal_regularity()` | Advanced | Single | - | Interval regularity (CV) |
| `.exists()` | Existence | Single | - | 1 if exists, 0 if not |
| `.nth()` | Window | Single | (n) | Nth value from end |
| `.serialize()` | String | Single | (delimiter) | Concatenate values |
| `.serializedv()` | String | Single | (delimiter) | Concatenate value~date |
| `.serializedv2()` | String | Single | (format) | Custom format serialize |
| `.bind()` | Cross-Ruleblock | Single | - | Reference other ruleblock |
| `.where()` | Filter | - | (condition) | Filter before aggregation |

### Standard SQL Functions

| Function | Category | Parameters | Description |
|----------|----------|------------|-------------|
| `least_date()` | Date | (d1, d2, ...) | Earliest date (NULL-safe) |
| `greatest_date()` | Date | (d1, d2, ...) | Latest date (NULL-safe) |
| `least()` | Comparison | (v1, v2, ...) | Smallest value |
| `greatest()` | Comparison | (v1, v2, ...) | Largest value |
| `coalesce()` | NULL | (v1, v2, ...) | First non-NULL value |
| `abs()` | Math | (x) | Absolute value |
| `round()` | Math | (x, n) | Round to n decimals |

---

## DV Functions Quick Reference

These functions return **TWO columns** (`_val` and `_dt`):

| Function | Creates | Description |
|----------|---------|-------------|
| `.lastdv()` | `var_val`, `var_dt` | Most recent value with its date |
| `.firstdv()` | `var_val`, `var_dt` | Earliest value with its date |
| `.maxldv()` | `var_val`, `var_dt` | Maximum value with LAST date of max |
| `.minldv()` | `var_val`, `var_dt` | Minimum value with LAST date of min |
| `.minfdv()` | `var_val`, `var_dt` | Minimum value with FIRST date of min |
| `.max_neg_delta_dv()` | `var_val`, `var_dt` | Largest drop with date it occurred |

**Usage Pattern:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();

// Access both in conditional statements:
is_recent_low : { hb_val < 100 and hb_dt > sysdate-90 => 1 }, { => 0 };
```

---

## Next Topics

- [Jinja2 Templating](#jinja2-templating) - Dashboard templates
- [Examples](#examples) - Real-world function usage patterns
