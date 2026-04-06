# openEHR Integration

Picorules evaluates ruleblocks against openEHR Clinical Data Repositories via AQL (Archetype Query Language). The `picorules-adapter-openehr` package maps EADV attributes to openEHR archetype paths and executes targeted AQL queries — the same rules produce identical results whether the data comes from FHIR or openEHR.

## Installation

```bash
npm install picorules-adapter-openehr picorules-compiler-js-core
```

## Quick Start

```typescript
import { parse, evaluate } from 'picorules-compiler-js-core';
import { OpenEhrDataAdapter, createAqlExecutor } from 'picorules-adapter-openehr';

// 1. Parse your ruleblock (same rules as FHIR — no changes needed)
const parsed = parse([{
  name: 'ckd_check',
  text: `
    #define_ruleblock(ckd_check, { description: "CKD screening", is_active: 2 });
    egfr_last => eadv.lab_bld_egfr.val.last();
    has_dm => eadv.[icd_e11%].dt.exists();
    ckd_stage : { egfr_last >= 90 => 1 }, { egfr_last >= 60 => 2 },
                { egfr_last >= 45 => 3 }, { egfr_last >= 30 => 4 },
                { egfr_last >= 15 => 5 }, { => 6 };
  `,
  isActive: true,
}]);

// 2. Create the AQL executor (connects to your openEHR CDR)
const executor = createAqlExecutor(
  'https://ehrbase.example.com/ehrbase/rest/openehr/v1',
  'Basic dXNlcjpwYXNz'  // your auth header
);

// 3. Prefetch data via AQL queries
const adapter = new OpenEhrDataAdapter();
await adapter.prefetch('ehr-uuid-here', executor, new Set([
  'lab_bld_egfr', 'icd_e11%',
]));

// 4. Evaluate — identical to FHIR path
const result = evaluate(parsed[0], adapter);
// { egfr_last: 39, has_dm: 1, ckd_stage: 4 }
```

## How It Works

The adapter translates EADV attributes to AQL queries via a three-step process:

### 1. Attribute Resolution

Each EADV attribute is resolved to an openEHR archetype query group using the same terminology codes as the FHIR adapter:

| EADV Attribute | Query Group | Archetype |
|---------------|-------------|-----------|
| `lab_bld_egfr` | lab_analyte | `OBSERVATION.laboratory_test_result.v1` → `CLUSTER.laboratory_test_analyte.v1` |
| `obs_bp_systolic` | bp_systolic | `OBSERVATION.blood_pressure.v2` |
| `obs_weight` | body_weight | `OBSERVATION.body_weight.v2` |
| `icd_e11%` | diagnosis_icd | `EVALUATION.problem_diagnosis.v1` |
| `rxnc_c09aa%` | medication_atc | `INSTRUCTION.medication_order.v3` |
| `dmg_gender` | demographic | EHR demographic service |

### 2. AQL Query Building

Attributes are grouped by archetype and batched into minimal AQL queries. Lab results use `IN` clauses for efficient multi-code matching:

```sql
SELECT
  r/items[at0024]/value/defining_code/code_string as code,
  r/items[at0001]/value/magnitude as val,
  r/items[at0001]/value/units as units,
  c/context/start_time/value as dt
FROM EHR e
  CONTAINS COMPOSITION c
    CONTAINS OBSERVATION o[openEHR-EHR-OBSERVATION.laboratory_test_result.v1]
      CONTAINS CLUSTER r[openEHR-EHR-CLUSTER.laboratory_test_analyte.v1]
WHERE e/ehr_id/value = $ehr_id
  AND r/items[at0024]/value/defining_code/code_string
      IN ('33914-3', '718-7', '4548-4', '2160-0', '9318-7')
```

### 3. Result Caching

AQL ResultSets (tabular rows) are parsed into `DataRecord[]` and cached by attribute name. Subsequent `getRecords()` calls from the evaluator hit the cache — no further AQL queries are needed.

## Query Efficiency

For a typical CKD rule scenario, the adapter generates **6 AQL queries**:

| Query | Archetype | What It Fetches |
|-------|-----------|----------------|
| `lab_analytes` | laboratory_test_analyte | All requested LOINC-coded lab results (batched) |
| `blood_pressure` | blood_pressure | Systolic + diastolic pairs with timestamps |
| `body_weight` | body_weight | Weight measurements |
| `height` | height | Height measurements |
| `diagnoses` | problem_diagnosis | All coded diagnoses (ICD-10 + ICPC-2) |
| `medications` | medication_order | All coded medication orders (ATC) |

All queries execute in parallel.

## Supported Archetypes

The adapter maps to these international CKM-published archetypes:

| Archetype | openEHR ID | Data Extracted |
|-----------|-----------|----------------|
| Lab results | `openEHR-EHR-OBSERVATION.laboratory_test_result.v1` | Analyte code, value, units, date |
| Lab analyte | `openEHR-EHR-CLUSTER.laboratory_test_analyte.v1` | Individual analyte within a panel |
| Blood pressure | `openEHR-EHR-OBSERVATION.blood_pressure.v2` | Systolic, diastolic, timestamp |
| Body weight | `openEHR-EHR-OBSERVATION.body_weight.v2` | Weight in kg/lb |
| Height | `openEHR-EHR-OBSERVATION.height.v2` | Height in cm/in |
| Pulse | `openEHR-EHR-OBSERVATION.pulse.v2` | Heart rate |
| Problem/Diagnosis | `openEHR-EHR-EVALUATION.problem_diagnosis.v1` | Diagnosis code, system, onset |
| Medication order | `openEHR-EHR-INSTRUCTION.medication_order.v3` | Medication code, system, date |

## Compatible openEHR Platforms

The adapter works with any openEHR CDR that implements the standard REST API:

- **EHRbase** (open source, Java/PostgreSQL) — Docker: `docker pull ehrbase/ehrbase`
- **Better Platform** (commercial, used by NHS England, Norwegian health regions)
- **DIPS** (Norwegian hospital EHR vendor)
- Any platform supporting `POST /v1/query/aql`

## Custom AQL Executor

For non-standard setups, provide your own executor function:

```typescript
const adapter = new OpenEhrDataAdapter();
await adapter.prefetch(ehrId, async (aql, params) => {
  // Your custom AQL execution logic
  const result = await myOpenEhrClient.query(aql, params);
  return {
    columns: result.columns,
    rows: result.rows,
  };
}, attributes);
```

## Transport Equivalence

The same ruleblock produces identical outputs regardless of adapter:

```typescript
// FHIR path
const fhirAdapter = new FhirDataAdapter(fhirBundle);
const fhirResult = evaluate(ruleblock, fhirAdapter);

// openEHR path
const openehrAdapter = new OpenEhrDataAdapter();
await openehrAdapter.prefetch(ehrId, aqlExecutor, attributes);
const openehrResult = evaluate(ruleblock, openehrAdapter);

// fhirResult === openehrResult (every variable identical)
```

This is validated by automated E2E tests comparing outputs across all adapter paths.
