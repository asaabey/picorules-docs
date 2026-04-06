# FHIR R4 Integration

Picorules evaluates ruleblocks directly against FHIR R4 data — from SMART on FHIR apps, Bulk FHIR exports, or any FHIR server. The `picorules-adapter-fhir` package handles all terminology mapping and resource resolution.

## Installation

```bash
npm install picorules-adapter-fhir picorules-compiler-js-core
```

## Quick Start

```typescript
import { parse, evaluate } from 'picorules-compiler-js-core';
import { FhirDataAdapter } from 'picorules-adapter-fhir';

// 1. Parse your ruleblock
const parsed = parse([{
  name: 'ckd_check',
  text: `
    #define_ruleblock(ckd_check, { description: "CKD screening", is_active: 2 });
    egfr_last => eadv.lab_bld_egfr.val.last();
    has_dm => eadv.[icd_e11%].dt.exists();
    on_acei => eadv.[rxnc_c09aa%].dt.exists();
    ckd_stage : { egfr_last >= 90 => 1 }, { egfr_last >= 60 => 2 },
                { egfr_last >= 45 => 3 }, { egfr_last >= 30 => 4 },
                { egfr_last >= 15 => 5 }, { => 6 };
  `,
  isActive: true,
}]);

// 2. Create adapter from a FHIR Bundle
const adapter = new FhirDataAdapter(patientBundle);

// 3. Evaluate
const result = evaluate(parsed[0], adapter);
// { egfr_last: 39, has_dm: 1, on_acei: 1, ckd_stage: 4 }
```

## Terminology Mapping

The adapter automatically translates EADV attribute names to FHIR resource queries. No configuration required for standard clinical data.

### Auto-Derived Codes

The attribute name encodes the code directly:

| EADV Pattern | Code System | FHIR Resource | Example |
|-------------|-------------|---------------|---------|
| `icd_{code}` | ICD-10 | Condition | `icd_e11%` → E11.* (diabetes) |
| `icpc_{code}` | ICPC-2 | Condition | `icpc_k86005` → K86005 (hypertension) |
| `rxnc_{code}` | WHO ATC | MedicationRequest | `rxnc_c09aa%` → C09AA (ACE inhibitors) |

Underscores in ICD codes become dots: `icd_n18_3` → `N18.3`. The `%` suffix enables wildcard (prefix) matching.

### Curated LOINC Mappings (80+ codes)

Lab and observation attributes map to LOINC codes via a built-in dictionary:

**Renal:** eGFR (33914-3), creatinine (2160-0), urea (3094-0), ACR (9318-7), cystatin C (33863-2)

**Haematology:** haemoglobin (718-7), WBC (6690-2), platelets (777-3), ferritin (2276-4), transferrin saturation (2502-3)

**Metabolic:** HbA1c (4548-4), glucose variants, lipid panel (total cholesterol, HDL, LDL, triglycerides)

**Electrolytes:** potassium (2823-3), sodium (2951-2), calcium (17861-6), phosphate (2777-1), magnesium (19123-9), bicarbonate (1963-8)

**Liver:** ALT (1742-6), AST (1920-8), ALP (6768-6), GGT (2324-2), bilirubin (1975-2), albumin (1751-7)

**Other:** TSH (3016-3), INR (6301-6), CRP (1988-5), PTH (2731-8), vitamin D (1989-3), urate (3084-1)

**Vitals:** systolic BP (8480-6), diastolic BP (8462-4), heart rate (8867-4), weight (29463-7), height (8302-2), BMI (39156-5), SpO2 (2708-6), temperature (8310-5)

### Custom Overrides

Add your own mappings at runtime:

```typescript
const adapter = new FhirDataAdapter(bundle, {
  overrides: {
    'my_custom_lab': {
      system: 'http://loinc.org',
      code: '12345-6',
      resourceType: 'Observation',
    },
  },
});
```

## Smart FHIR Fetching

Instead of fetching all patient data and filtering in-memory, Picorules can **introspect its ruleblocks** to derive the exact FHIR queries needed — then fetch only that data.

### How It Works

```typescript
import { parse, evaluateAll } from 'picorules-compiler-js-core';
import {
  introspectDataRequirements,
  buildFhirSearchUrls,
  smartFetch,
  FhirDataAdapter,
} from 'picorules-adapter-fhir';

// 1. Parse ruleblocks (once at startup)
const parsed = parse(ruleblocks);

// 2. Introspect — what data do these rules need?
const requirements = introspectDataRequirements(parsed);
// → 943 attributes → 638 FHIR codes

// 3. Build minimal FHIR queries
const queries = buildFhirSearchUrls(requirements, patientId);
// → 4 queries: Patient + Observation?code=... + Condition + MedicationRequest?code=...

// 4. Execute queries in parallel
const { bundle } = await smartFetch(queries, (url) => fhirClient.request(url));

// 5. Evaluate with the minimal bundle
const adapter = new FhirDataAdapter(bundle);
const results = evaluateAll(parsed, adapter);
```

### What Introspection Produces

For the full 153-ruleblock reference set:

| Metric | Value |
|--------|-------|
| EADV attributes extracted | 943 |
| Resolved to FHIR codes | 638 |
| FHIR queries generated | 4 |
| Observation LOINC codes | 30 (one query with comma-separated codes) |
| Condition | 1 query (fetch all — wildcard strategy) |
| MedicationRequest ATC codes | 62 (one query) |
| Patient | 1 read |

The `Observation` query uses standard FHIR token search syntax:

```
Observation?patient=123&code=http://loinc.org|33914-3,http://loinc.org|718-7,...
```

This is universally supported across FHIR servers (HAPI, Epic, Cerner, Azure, AWS HealthLake).

### Data Reduction

For a real patient with 3498 FHIR resources, smart fetch retrieved 2262 — a **35% reduction**. For patients with larger histories (years of lab data, imaging reports), the reduction is far more dramatic.

## CDS Hooks Integration

The same introspection auto-generates CDS Hooks `prefetch` templates:

```typescript
import { generateCdsHooksPrefetch } from 'picorules-adapter-fhir';

const prefetch = generateCdsHooksPrefetch(requirements);
// {
//   patient: "Patient/{{context.patientId}}",
//   observations: "Observation?patient={{context.patientId}}&code=http://loinc.org|33914-3,718-7,...",
//   conditions: "Condition?patient={{context.patientId}}",
//   medicationrequests: "MedicationRequest?patient={{context.patientId}}&code=..."
// }
```

This makes Picorules ruleblocks **self-describing CDS artefacts** — the rules define their own data contract for CDS Hooks integration.

## FHIR Output Mapping

The adapter can also map evaluation results back to FHIR resources:

```typescript
import { FhirOutputMapper, PicoTypeCode, OutputCategory } from 'picorules-adapter-fhir';

const mapper = new FhirOutputMapper({
  patientReference: 'Patient/123',
  ruleblockId: 'ckd_assessment',
  attributes: [
    { variable: 'egfr_last', label: 'eGFR', type: PicoTypeCode.NUMERIC, isReportable: true },
    { variable: 'ckd_stage', label: 'CKD Stage', type: PicoTypeCode.CODED, isReportable: true },
  ],
});

const outputBundle = mapper.toBundle(evaluationResult);
// → FHIR Bundle with GuidanceResponse, Observations, RiskAssessments
```

Output resource types: `GuidanceResponse`, `Observation`, `RiskAssessment`, `DetectedIssue`, `Parameters`.

## SMART on FHIR Apps

Picorules works in-browser via Vite/webpack bundling, making it ideal for SMART on FHIR applications:

```typescript
import FHIR from 'fhirclient';
import { parse, evaluate } from 'picorules-compiler-js-core';
import { FhirDataAdapter } from 'picorules-adapter-fhir';

// After SMART launch
const client = await FHIR.oauth2.ready();
const bundle = await fetchPatientBundle(client);
const adapter = new FhirDataAdapter(bundle);
const result = evaluate(parsedRuleblock, adapter);
// → CDS cards rendered from result
```

The E2E test harness includes a working SMART on FHIR app with mock server, demonstrating this pattern end-to-end.

## Supported FHIR Code Systems

| System | URI | Used For |
|--------|-----|----------|
| ICD-10 | `http://hl7.org/fhir/sid/icd-10` | Diagnoses |
| ICPC-2 | `http://hl7.org/fhir/sid/icpc-2` | Primary care diagnoses |
| LOINC | `http://loinc.org` | Lab results, vitals |
| SNOMED CT | `http://snomed.info/sct` | Clinical terms |
| WHO ATC | `http://www.whocc.no/atc` | Medications |
| RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` | Medications (US) |
