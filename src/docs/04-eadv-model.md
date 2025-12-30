# EADV Model

Understanding the Entity-Attribute-Date-Value (EADV) data model is essential for effective Picorules development. This section explains the model's structure, rationale, and query patterns.

## What is EADV?

EADV is a flexible data modeling approach that stores all clinical observations as rows in a single table with four key columns:

| Column | Full Name | Description | Example |
|--------|-----------|-------------|---------|
| `eid` | Entity ID | Patient identifier | `12345` |
| `att` | Attribute | What was measured/observed | `lab_bld_haemoglobin` |
| `dt` | Date | When it occurred | `2024-03-15` |
| `val` | Value | The measurement/observation | `118` |

### Example EADV Data

```
| eid   | att                    | dt         | val   |
|-------|------------------------|------------|-------|
| 12345 | lab_bld_haemoglobin    | 2024-01-15 | 121   |
| 12345 | lab_bld_haemoglobin    | 2024-03-20 | 118   |
| 12345 | lab_bld_haemoglobin    | 2024-06-10 | 119   |
| 12345 | lab_bld_creatinine     | 2024-01-15 | 95    |
| 12345 | lab_bld_creatinine     | 2024-03-20 | 102   |
| 12345 | icd_N18.3              | 2024-01-10 | 1     |
| 12345 | rx_atorvastatin        | 2024-02-01 | 40    |
| 67890 | lab_bld_haemoglobin    | 2024-02-10 | 135   |
| 67890 | lab_bld_glucose        | 2024-02-10 | 8.2   |
```

## Why EADV?

### Traditional Relational Model Problems

In a traditional relational database, clinical data might look like:

```sql
-- Separate table for labs
CREATE TABLE labs (
    patient_id INT,
    test_date DATE,
    haemoglobin DECIMAL,
    creatinine DECIMAL,
    glucose DECIMAL,
    albumin DECIMAL,
    ...  -- Hundreds more columns
);

-- Separate table for diagnoses
CREATE TABLE diagnoses (
    patient_id INT,
    dx_date DATE,
    icd_code VARCHAR,
    ...
);

-- Separate table for medications
CREATE TABLE medications (
    patient_id INT,
    rx_date DATE,
    drug_name VARCHAR,
    dose DECIMAL,
    ...
);
```

**Problems with this approach:**

1. **Schema Rigidity**: Adding a new lab test requires ALTER TABLE
2. **Sparse Data**: Most patients don't have all labs → many NULL values
3. **Complex Joins**: Correlating data requires joining many tables
4. **Temporal Queries**: Getting "most recent" requires complex window functions per table

### EADV Advantages

1. **Schema Flexibility**: Add new clinical attributes without altering schema
2. **Dense Storage**: Only store observations that occurred
3. **Uniform Querying**: All clinical data accessed the same way
4. **Temporal Focus**: Date is a first-class column, easy to filter and window
5. **Extension Friendly**: New data types (genomics, imaging reports) fit the same model

## EADV Structure in Detail

### Entity (eid)

The subject of observation—in TKC, this is the patient.

**Characteristics:**
- Unique patient identifier
- Links all observations for a patient
- Partition key for queries (important for performance)

**Example queries focus on one patient or group of patients:**
```sql
WHERE eid = 12345
WHERE eid IN (SELECT eid FROM cohort_table)
```

### Attribute (att)

What was measured or observed.

**Naming Conventions:**

| Prefix | Category | Examples |
|--------|----------|----------|
| `lab_` | Laboratory tests | `lab_bld_haemoglobin`, `lab_ua_protein` |
| `icd_` | Diagnosis codes | `icd_N18.3`, `icd_E11.9` |
| `rx_` | Medications | `rx_metformin`, `rx_atorvastatin` |
| `enc_` | Encounters | `enc_outpatient`, `enc_emergency` |
| `proc_` | Procedures | `proc_dialysis`, `proc_transplant` |
| `demo_` | Demographics | `demo_age`, `demo_sex` |

**Sub-prefixes for labs:**
- `lab_bld_` — Blood tests
- `lab_ua_` — Urine tests
- `lab_chem_` — Chemistry panels
- `lab_mic_` — Microbiology

**Attributes are the "vocabulary" of your clinical system.** Adding a new concept means adding a new attribute name.

### Date (dt)

When the observation occurred.

**Precision:** Typically DATE (day-level), though system may support DATETIME.

**Importance:**
- Clinical data is inherently temporal
- "Most recent" is a fundamental clinical query
- Trends require ordering by date
- Eligibility often time-bound ("within last 6 months")

**NULL dates:** Rare but possible for timeless facts (e.g., patient's date of birth could be stored as both `dt` and `val`).

### Value (val)

The measurement, observation, or categorical value.

**Type:** Typically VARCHAR or TEXT (to accommodate all value types)

**Value Representations:**

| Data Type | Representation | Example |
|-----------|----------------|---------|
| Numeric | String number | `"118"` for Hb 118 g/L |
| Boolean | 1 or 0 | `"1"` for presence of diagnosis |
| Categorical | Text | `"Positive"`, `"Negative"` |
| Date | ISO date string | `"2024-03-15"` |
| Text | Free text | `"Patient reports nausea"` |

**Important:** Values are stored as strings. Picorules and SQL handle type conversion.

## Common EADV Query Patterns

### Pattern 1: Latest Value for an Attribute

**Clinical need:** "What is the patient's most recent hemoglobin?"

**Picorules:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

**Conceptual SQL:**
```sql
SELECT eid,
       LAST_VALUE(val) OVER (PARTITION BY eid ORDER BY dt) as hb_last
FROM eadv
WHERE att = 'lab_bld_haemoglobin'
```

### Pattern 2: Latest Date for an Attribute

**Clinical need:** "When was the patient's last hemoglobin test?"

**Picorules:**
```javascript
hb_ld => eadv.lab_bld_haemoglobin.dt.max();
```

**Conceptual SQL:**
```sql
SELECT eid, MAX(dt) as hb_ld
FROM eadv
WHERE att = 'lab_bld_haemoglobin'
GROUP BY eid
```

### Pattern 3: Latest Date-Value Pair

**Clinical need:** "What was the hemoglobin value and when was it measured?"

**Picorules:**
```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
```

**Result:** Creates `hb_val` and `hb_dt`

**Conceptual SQL:**
```sql
WITH ranked AS (
  SELECT eid, dt, val,
         ROW_NUMBER() OVER (PARTITION BY eid ORDER BY dt DESC) as rn
  FROM eadv
  WHERE att = 'lab_bld_haemoglobin'
)
SELECT eid, val as hb_val, dt as hb_dt
FROM ranked
WHERE rn = 1
```

### Pattern 4: Multiple Attributes (OR Logic)

**Clinical need:** "Get urine RBC from either standard lab or point-of-care test"

**Picorules:**
```javascript
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

**Conceptual SQL:**
```sql
WITH combined AS (
  SELECT eid, dt, val
  FROM eadv
  WHERE att IN ('lab_ua_rbc', 'lab_ua_poc_rbc')
),
ranked AS (
  SELECT eid, dt, val,
         ROW_NUMBER() OVER (PARTITION BY eid ORDER BY dt DESC) as rn
  FROM combined
)
SELECT eid, val as ua_rbc_val, dt as ua_rbc_dt
FROM ranked
WHERE rn = 1
```

### Pattern 5: Wildcard Attributes

**Clinical need:** "When was the patient's last interaction with the health system?"

**Picorules:**
```javascript
last_encounter => eadv.[icd_%,lab_%,enc_%].dt.max();
```

**Conceptual SQL:**
```sql
SELECT eid, MAX(dt) as last_encounter
FROM eadv
WHERE att LIKE 'icd_%'
   OR att LIKE 'lab_%'
   OR att LIKE 'enc_%'
GROUP BY eid
```

### Pattern 6: Filtered Aggregation

**Clinical need:** "Lowest creatinine in the last year"

**Picorules:**
```javascript
cr_min_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).min();
```

**Conceptual SQL:**
```sql
SELECT eid, MIN(val::numeric) as cr_min_1yr
FROM eadv
WHERE att = 'lab_bld_creatinine'
  AND dt > CURRENT_DATE - 365
GROUP BY eid
```

### Pattern 7: Presence Check

**Clinical need:** "Does the patient have a CKD diagnosis?"

**Picorules:**
```javascript
has_ckd_dx => eadv.icd_N18%.dt.max();

// Then in conditional:
is_ckd_patient : { has_ckd_dx!? => 1 }, { => 0 };
```

**Conceptual SQL:**
```sql
SELECT eid,
       CASE WHEN MAX(dt) IS NOT NULL THEN 1 ELSE 0 END as is_ckd_patient
FROM eadv
WHERE att LIKE 'icd_N18%'
GROUP BY eid
```

## EADV Schema Details

### Additional Columns (Implementation-Specific)

While the core EADV model has four columns, implementations often include:

| Column | Purpose | Example |
|--------|---------|---------|
| `source` | Data origin | `"main_lab"`, `"poc"`, `"ehr"` |
| `unit` | Measurement unit | `"g/L"`, `"mmol/L"` |
| `ref_low` | Reference range low | `120` |
| `ref_high` | Reference range high | `160` |
| `status` | Result status | `"final"`, `"preliminary"` |
| `provider` | Ordering provider | Provider ID |
| `location` | Care location | `"outpatient"`, `"inpatient"` |

**Use in Picorules:**
```javascript
hb_lab => eadv.lab_bld_haemoglobin.val.where(source='main_lab').last();
```

### Indexing Strategy

For performance, EADV tables typically have indexes on:

1. **`(eid, att, dt)`** — Core query pattern
2. **`(att, eid, dt)`** — Attribute-first queries
3. **`(eid, dt)`** — Temporal queries

**Why this matters:** Your Picorules queries are fast because:
- Filtering by `att` uses index
- Partitioning by `eid` uses index
- Ordering by `dt` uses index

## Working with EADV in Picorules

### Best Practices

#### 1. Be Specific with Attributes

✅ **Good:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

❌ **Too Broad:**
```javascript
all_labs => eadv.lab_%.val.last();  // Which lab?
```

#### 2. Use Multi-Attribute for Synonyms

When the same concept has multiple attribute names:

```javascript
// RBC in urine can come from different sources
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

#### 3. Filter Early with `.where()`

Reduce data scanned:

```javascript
// Only recent values
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-730).last();
```

#### 4. Leverage Wildcards for Grouped Concepts

```javascript
// Any CKD diagnosis (N18.1, N18.2, ..., N18.9)
ckd_dx_date => eadv.icd_N18%.dt.max();

// Any diabetes medication
dm_med_date => eadv.rx_[metformin,gliclazide,insulin%].dt.max();
```

### Common Mistakes

#### Mistake 1: Forgetting `.val` or `.dt`

❌ **Error:**
```javascript
hb => eadv.lab_bld_haemoglobin.last();  // Missing column specifier
```

✅ **Correct:**
```javascript
hb => eadv.lab_bld_haemoglobin.val.last();
```

#### Mistake 2: Comparing Strings as Numbers

EADV `val` column is text. Comparisons work, but be aware:

```javascript
// This works (string "118" < string "120" lexically)
is_low : { hb_last < 120 => 1 }, { => 0 };
```

**But watch out for:**
```javascript
// "9" > "10" lexically! (string comparison)
```

Picorules handles type conversion, but understand the underlying data type.

#### Mistake 3: Not Handling NULLs

Always check for NULL when it's possible:

```javascript
ferritin_last => eadv.lab_bld_ferritin.val.last();

// ❌ May fail if no ferritin test
is_low_ferritin : { ferritin_last < 100 => 1 }, { => 0 };

// ✅ NULL-safe
is_low_ferritin : { ferritin_last!? and ferritin_last < 100 => 1 }, { => 0 };
```

## Attribute Catalog

Your organization should maintain an **attribute catalog** documenting:
- Attribute names
- Descriptions
- Units
- Data sources
- Valid value ranges

**Example catalog entry:**

```
Attribute: lab_bld_haemoglobin
Description: Blood hemoglobin concentration
Category: Laboratory - Hematology
Unit: g/L
Source: Main laboratory LIS
Normal Range: 120-160 (varies by sex)
Frequency: Typically measured every 3-6 months for CKD patients
Related: lab_bld_hematocrit, lab_bld_rbc_count
```

This catalog is essential for:
- New Picorules developers
- Understanding available data
- Consistent naming
- Data governance

## EADV vs. Ruleblock Output Tables

**EADV table (`eadv`):**
- Raw clinical observations
- Huge (millions/billions of rows)
- Source of truth
- Queried via Picorules functional statements

**Ruleblock output tables (`rout_*`):**
- Computed/derived values
- One row per patient
- Result of Picorules compilation
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

## Performance Considerations

### Efficient Queries

✅ **Efficient:** Specific attribute, clear aggregation
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

⚠️ **Less Efficient:** Broad wildcard
```javascript
anything => eadv.%.val.last();  // Scans entire table
```

### Use Intermediate Ruleblocks

Instead of repeating complex logic:

❌ **Inefficient:** Repeat calculation in multiple ruleblocks
```javascript
// In ruleblock A
egfr_calc : { complicated calculation }

// In ruleblock B
egfr_calc : { same complicated calculation }  // Duplicated
```

✅ **Efficient:** Calculate once, bind everywhere
```javascript
// In ckd.prb
egfr_calc : { complicated calculation }

// In other ruleblocks
egfr => rout_ckd.egfr_calc.val.bind();
```

### Appropriate Time Ranges

Don't scan more history than needed:

```javascript
// If you only need recent data
hb_recent => eadv.lab_bld_haemoglobin.val.where(dt > sysdate-365).last();
```

## Next Topics

- [Functions Reference](#functions-reference) — All available EADV functions
- [Examples](#examples) — Real-world EADV query patterns
