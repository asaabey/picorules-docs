# Tutorial

This tutorial will guide you through writing Picorules code step by step. By the end, you'll be able to create ruleblocks that retrieve clinical data, apply medical logic, and chain together complex decision support rules.

## Prerequisites

You should have:
- Basic understanding of clinical data concepts (labs, diagnoses, medications)
- Familiarity with any programming language (not necessarily SQL)
- Access to view existing `.prb` files in the repository

## Your First Ruleblock

Let's start with the simplest possible ruleblock—retrieving a single lab value.

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

Add a functional statement to retrieve the most recent hemoglobin value:

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

Tell Picorules about your output variable:

```javascript
#define_attribute(hb_last, {
    label: "Most recent hemoglobin (g/L)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});
```

**Fields explained:**
- `label` — Display name for reports and dashboards
- `type` — Data type code (1001 = numeric)
- `is_reportable` — Should this appear in standard reports? (1 = yes)
- `is_bi_obj` — Is this a business intelligence object? (1 = yes)

### Step 5: Add Documentation

Document what this variable represents:

```javascript
#doc(hb_last, {
    txt: "Most recent hemoglobin measurement in grams per liter",
    cite: ""
});
```

### Complete First Ruleblock

Here's your complete first ruleblock:

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

**What happens when this compiles?**

Picorules generates T-SQL that:
1. Selects from the EADV table
2. Filters for `lab_bld_haemoglobin` attribute
3. Uses a window function to get the latest value per patient
4. Stores intermediate results in temporary tables
5. Writes final results to `rout_my_first_rule` table

## Adding More Variables

Let's expand our ruleblock to retrieve multiple lab values.

### Multiple Functional Statements

Add creatinine and albumin:

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
cr_last => eadv.lab_bld_creatinine.val.last();
alb_last => eadv.lab_bld_albumin.val.last();
```

Each statement creates its own intermediate result set in the generated SQL (temp table in T-SQL), and all are joined on `eid` (patient ID).

### Getting Dates Too

Use `.lastdv()` to get both the date and value:

```javascript
hb => eadv.lab_bld_haemoglobin._.lastdv();
```

**Note:** The underscore `_` is a placeholder when you want both date and value. This returns two columns: `hb_dt` (date) and `hb_val` (value).

### Retrieving Multiple Attributes

Use square brackets for OR logic:

```javascript
// Get urine RBC from either standard lab or point-of-care test
ua_rbc => eadv.[lab_ua_rbc,lab_ua_poc_rbc]._.lastdv();
```

This checks `lab_ua_rbc` OR `lab_ua_poc_rbc`, whichever has the most recent value.

## Conditional Logic

Now let's add medical decision logic using conditional statements.

### Your First Conditional Statement

Define anemia based on hemoglobin level:

```javascript
// First, get the hemoglobin value (functional statement)
hb_last => eadv.lab_bld_haemoglobin.val.last();

// Then, apply clinical criteria (conditional statement)
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

**Breaking down the conditional:**
- `is_anaemic` — Variable name
- `:` — Conditional statement operator
- `{ hb_last < 120 => 1 }` — If hemoglobin is less than 120, return 1
- `,` — Separator between conditions
- `{ => 0 }` — Otherwise (default case), return 0

**Critical rule:** Conditional statements can ONLY reference variables defined earlier (in functional or other conditional statements).

### Multiple Conditions

Create a severity classification:

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();

anemia_severity :
    { hb_last < 80 => 3 },      // Severe
    { hb_last < 100 => 2 },     // Moderate
    { hb_last < 120 => 1 },     // Mild
    { => 0 };                   // Normal
```

**How it works:**
- Conditions are evaluated in order
- First matching condition wins
- Always include a default case `{ => 0 }`

### Compound Conditions

Combine multiple criteria:

```javascript
ckd => rout_ckd.ckd.val.bind();  // Get CKD status from another ruleblock
hb_last => eadv.lab_bld_haemoglobin.val.last();

// CKD patients with anemia
ckd_anemia : { ckd > 0 and hb_last < 120 => 1 }, { => 0 };
```

**Boolean operators:**
- `and` — Both conditions must be true
- `or` — Either condition can be true
- Parentheses for grouping: `(A and B) or C`

## Working with Dates

Date handling is crucial for clinical logic.

### Get Latest Test Date

```javascript
hb_ld => eadv.lab_bld_haemoglobin.dt.max();
```

**Note:** `dt.max()` gets the most recent date.

### Check Recency

Determine if a test is recent (within 2 years):

```javascript
hb_ld => eadv.lab_bld_haemoglobin.dt.max();

hb_is_recent : { hb_ld > sysdate-730 => 1 }, { => 0 };
```

**Date arithmetic:**
- `sysdate` — Current system date
- `sysdate-730` — Two years ago (730 days)
- `sysdate-365` — One year ago

### Working with Multiple Dates

Find the earliest of several dates:

```javascript
aki_icd_ld => eadv.icd_N17.dt.max();
cr_spike_ld => eadv.lab_bld_creatinine.dt.max();  // Simplified

// Get the earliest AKI indicator
aki_first_dt : { coalesce(aki_icd_ld, cr_spike_ld)!? => least_date(aki_icd_ld, cr_spike_ld) };
```

**Date functions:**
- `least_date(d1, d2)` — Returns the earlier date
- `greatest_date(d1, d2)` — Returns the later date
- `coalesce(d1, d2)` — Returns first non-null value

### NULL Handling

Check if a value exists:

```javascript
has_hb_test : { hb_last!? => 1 }, { => 0 };
```

**NULL operators:**
- `!?` — "is not null" (value exists)
- `?` — "is null" (value missing)

## Chaining Ruleblocks

One of Picorules' most powerful features is referencing outputs from other ruleblocks.

### Using `.bind()`

Reference a variable from another ruleblock:

```javascript
// In your ruleblock, use CKD stage calculated elsewhere
ckd_stage => rout_ckd.ckd_stage.val.bind();

// Now use it in your logic
needs_nephrology : { ckd_stage >= 4 => 1 }, { => 0 };
```

**Pattern:** `rout_<ruleblock_id>.<variable_name>.val.bind()`

### Why Chain Ruleblocks?

1. **Reusability**: Define CKD staging once, use everywhere
2. **Modularity**: Separate diagnostic logic from treatment logic
3. **Maintainability**: Update one ruleblock, all dependents get updated
4. **Collaboration**: Different teams maintain different ruleblocks

### Example: Multi-Block Clinical Pathway

```javascript
// Block 1: ckd.prb (diagnostic)
egfr_last => eadv.lab_bld_egfr.val.last();
ckd_stage :
    { egfr_last < 15 => 5 },
    { egfr_last < 30 => 4 },
    { egfr_last < 45 => 3 },
    { => 0 };

// Block 2: anemia.prb (diagnostic)
hb_last => eadv.lab_bld_haemoglobin.val.last();
is_anaemic : { hb_last < 120 => 1 }, { => 0 };

// Block 3: ckd_complications.prb (integrative)
ckd_stage => rout_ckd.ckd_stage.val.bind();
is_anaemic => rout_anemia.is_anaemic.val.bind();

ckd_anemia : { ckd_stage >= 3 and is_anaemic = 1 => 1 }, { => 0 };
```

## Advanced Patterns

### Multi-Attribute Wildcards

Search across related attributes:

```javascript
// Get most recent ICD code or lab test
last_encounter => eadv.[icd_%,lab_%].dt.max();
```

**Wildcard:**
- `%` — Matches any characters (like SQL LIKE)
- Useful for groups of related attributes

### Filtering with `.where()`

Apply conditions when retrieving data:

```javascript
// Only get hemoglobin tests from main lab (exclude point-of-care)
hb_lab_only => eadv.lab_bld_haemoglobin.val.where(source='main_lab').last();
```

### Aggregate Multiple Values

```javascript
// Get minimum creatinine in the last year
cr_min_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).min();

// Get maximum creatinine in the last year
cr_max_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).max();

// Calculate if there was a significant rise
cr_doubled : { cr_max_1yr >= cr_min_1yr * 2 => 1 }, { => 0 };
```

## Adding Citations

Link your logic to clinical evidence:

### Step 1: Create Citation File

Create `kdigo_ckd_ref1.citation.txt` in `picodomain_rule_pack/citations/`:

```
KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.
Kidney International (2024) 105, S117–S314.
https://kdigo.org/guidelines/ckd/
```

### Step 2: Reference in #doc()

```javascript
#doc(ckd_stage, {
    txt: "CKD stage based on eGFR per KDIGO 2024 guidelines. Stage 1-2 require additional criteria (albuminuria or structural abnormality).",
    cite: "kdigo_ckd_ref1"
});
```

Multiple citations: `cite: "kdigo_ckd_ref1, kdigo_anemia_ref2"`

## Complete Example: Anemia in CKD

Here's a complete ruleblock putting it all together:

```javascript
#define_ruleblock(ckd_anemia_assessment, {
    description: "Assess anemia in CKD patients per KDIGO guidelines",
    is_active: 2,
    version: "1.0",
    target_table: "rout_ckd_anemia_assessment",
    environment: "DEV_2"
});

// ===================
// Bind from other ruleblocks
// ===================
ckd_stage => rout_ckd.ckd_stage.val.bind();
egfr_last => rout_ckd.egfr_last.val.bind();

// ===================
// Functional Statements: Retrieve data
// ===================
hb => eadv.lab_bld_haemoglobin._.lastdv();
ferritin_last => eadv.lab_bld_ferritin.val.last();
tsat_last => eadv.lab_bld_tsat.val.last();

// ===================
// Conditional Statements: Apply logic
// ===================

// Define anemia (varies by CKD stage per KDIGO)
is_anaemic :
    { ckd_stage >= 5 and hb_val < 100 => 1 },  // Dialysis patients
    { ckd_stage >= 3 and hb_val < 120 => 1 },  // CKD 3-5
    { => 0 };

// Assess iron deficiency
is_iron_deficient :
    { ferritin_last < 100 => 1 },
    { ferritin_last < 300 and tsat_last < 20 => 1 },
    { => 0 };

// Determine if needs workup
needs_anemia_workup :
    { is_anaemic = 1 and hb_dt > sysdate-90 => 1 },  // Recent anemia
    { => 0 };

// Determine treatment eligibility
esa_eligible :
    { is_anaemic = 1 and is_iron_deficient = 0 and ckd_stage >= 3 => 1 },
    { => 0 };

// ===================
// Attribute Definitions
// ===================
#define_attribute(is_anaemic, {
    label: "Has anemia",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(is_iron_deficient, {
    label: "Has iron deficiency",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(needs_anemia_workup, {
    label: "Needs anemia investigation",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(esa_eligible, {
    label: "Eligible for ESA therapy",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

// ===================
// Documentation
// ===================
#doc(is_anaemic, {
    txt: "Anemia defined per KDIGO 2012: Hb <130 g/L (males), <120 g/L (females). Simplified here to <120 g/L for CKD 3-4, <100 g/L for dialysis.",
    cite: "kdigo_anemia_ref1"
});

#doc(is_iron_deficient, {
    txt: "Iron deficiency: ferritin <100 ng/mL, or ferritin 100-300 ng/mL with TSAT <20%",
    cite: "kdigo_anemia_ref1"
});

#doc(esa_eligible, {
    txt: "Consider ESA if anemic, iron replete, and CKD 3-5. Requires shared decision-making.",
    cite: "kdigo_anemia_ref1"
});
```

## Best Practices

### 1. **Order Matters**

✅ **Good:** Functional statements first, then conditionals
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
is_anaemic : { hb_last < 120 => 1 }, { => 0 };
```

❌ **Bad:** Referencing variables before they're defined
```javascript
is_anaemic : { hb_last < 120 => 1 }, { => 0 };  // ERROR: hb_last not defined yet
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

### 2. **Use Clear Variable Names**

✅ **Good:** Descriptive, medical terminology
```javascript
ckd_stage_5 : { egfr_last < 15 => 1 }, { => 0 };
```

❌ **Bad:** Cryptic abbreviations
```javascript
cs5 : { e < 15 => 1 }, { => 0 };
```

### 3. **Always Include Default Cases**

✅ **Good:** Explicit default
```javascript
severity : { score > 10 => 3 }, { score > 5 => 2 }, { => 1 };
```

❌ **Bad:** Missing default (can produce NULLs)
```javascript
severity : { score > 10 => 3 }, { score > 5 => 2 };
```

### 4. **Document Everything**

Use `#doc()` for every output attribute with:
- Clinical definition
- Data source
- Clinical significance
- Citations to guidelines

### 5. **Group Related Logic**

Use comments to organize:
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
```

## Common Mistakes to Avoid

### 1. Forgetting Semicolons

❌ **Error:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last()  // Missing semicolon
```

✅ **Correct:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

### 2. Wrong Operator for Statement Type

❌ **Error:**
```javascript
hb_last : eadv.lab_bld_haemoglobin.val.last();  // Should be =>
is_anaemic => { hb_last < 120 => 1 };           // Should be :
```

✅ **Correct:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();  // Functional uses =>
is_anaemic : { hb_last < 120 => 1 }, { => 0 };   // Conditional uses :
```

### 3. Missing `.val` or `.dt` in Functional Statements

❌ **Error:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.last();  // Missing .val
```

✅ **Correct:**
```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();  // Specify .val
```

## Next Steps

Congratulations! You now know how to:
- ✅ Create ruleblocks with metadata
- ✅ Write functional statements to retrieve data
- ✅ Apply conditional logic for medical decision support
- ✅ Chain ruleblocks together
- ✅ Handle dates and NULL values
- ✅ Document your code with citations

**Continue learning:**
- [Language Reference](#language-reference) — Complete syntax details
- [EADV Model](#eadv-model) — Deep dive into the data structure
- [Functions Reference](#functions-reference) — All available operations
- [Examples](#examples) — Real-world clinical patterns
