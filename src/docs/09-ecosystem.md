# SDK & Ecosystem

Picorules is available as a set of npm packages for building clinical decision support applications in JavaScript and TypeScript. The packages support two execution modes: compiling to SQL for population-scale batch analytics, or evaluating directly in JavaScript for single-patient real-time use.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [picorules-compiler-js-core](https://www.npmjs.com/package/picorules-compiler-js-core) | 1.1.x | Compiler + JS runtime evaluator |
| [picorules-adapter-fhir](https://www.npmjs.com/package/picorules-adapter-fhir) | 0.1.x | FHIR R4 data adapter |
| [picorules-compiler-js-eadv-mocker](https://www.npmjs.com/package/picorules-compiler-js-eadv-mocker) | 0.1.x | Mock EADV data generator for testing |
| [picorules-compiler-js-db-manager](https://www.npmjs.com/package/picorules-compiler-js-db-manager) | - | Database execution manager |

## Architecture

```
                    ┌──────────────────────┐
                    │   .prb source file    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    Parse → AST        │
                    │    Link → Sort deps   │
                    │    Transform → Filter │
                    └──────────┬───────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
    ┌──────────▼──────────┐         ┌──────────▼──────────┐
    │   Compile to SQL     │         │   Evaluate in JS     │
    │                      │         │                      │
    │   Oracle / MSSQL /   │         │   EADV data or       │
    │   PostgreSQL         │         │   FHIR R4 Bundles    │
    │                      │         │                      │
    │   Population batch   │         │   Single-patient     │
    │   analytics          │         │   real-time CDS      │
    └──────────────────────┘         └──────────────────────┘
```

The compiler and evaluator share the same parser, linker, and transformer. The parsed AST is dialect-agnostic — it feeds into either the SQL code generator (existing) or the JavaScript runtime evaluator (new in v1.1).

## Core Package: picorules-compiler-js-core

### Installation

```bash
npm install picorules-compiler-js-core
```

### Mode 1: Compile to SQL

Best for processing thousands to millions of patients in batch against an EADV database.

```typescript
import { compile, Dialect } from 'picorules-compiler-js-core';

const result = compile(
  [{ name: 'ckd', text: ruleblockSource, isActive: true }],
  { dialect: Dialect.ORACLE }
);

if (result.success) {
  console.log(result.sql[0]); // Optimized Oracle SQL
}
```

**Supported SQL dialects:** Oracle PL/SQL, SQL Server T-SQL, PostgreSQL

### Mode 2: Evaluate in JavaScript

Best for point-of-care CDS, SMART on FHIR apps, browser-based tools, and serverless functions. No database required.

```typescript
import { parse, evaluate, EadvDataAdapter } from 'picorules-compiler-js-core';

// Parse the ruleblock (can be done once and cached)
const parsed = parse([{ name: 'ckd', text: ruleblockSource, isActive: true }]);

// Provide patient data
const adapter = new EadvDataAdapter([
  { eid: 1, att: 'lab_bld_egfr', dt: '2024-06-01', val: 44 },
  { eid: 1, att: 'lab_bld_egfr', dt: '2024-01-15', val: 48 },
  { eid: 1, att: 'lab_bld_egfr', dt: '2023-06-01', val: 52 },
]);

// Evaluate — returns results in ~1ms
const result = evaluate(parsed[0], adapter);
// { egfr_last: 44, egfr_slope: -0.018, ckd_stage: 4, ... }
```

### Multi-Ruleblock Evaluation

When ruleblocks depend on each other via `.bind()`, use `evaluateAll()` which handles dependency ordering automatically:

```typescript
import { parse, evaluateAll, EadvDataAdapter } from 'picorules-compiler-js-core';

const parsed = parse([
  { name: 'egfr_metrics', text: egfrSource, isActive: true },
  { name: 'ckd', text: ckdSource, isActive: true }, // binds to egfr_metrics
]);

const results = evaluateAll(parsed, adapter);
// results.get('egfr_metrics') = { egfr_last: 44, egfr_slope: -0.018 }
// results.get('ckd')          = { ckd_stage: 4, has_ckd: 1 }
```

### Expression Functions

All SQL functions used in conditional statements are supported in the JS evaluator:

| Category | Functions |
|----------|-----------|
| Math | `round()`, `ln()`, `exp()`, `power()`, `abs()`, `ceil()`, `log()`, `sqrt()` |
| Null handling | `nvl()`, `coalesce()` |
| Comparison | `greatest()`, `least()`, `greatest_date()`, `least_date()` |
| String | `substr()`, `to_number()`, `to_char()` |
| Date | `sysdate`, `extract(year/month/day from date)`, `to_date()` |
| Date arithmetic | `date - date` → days, `date ± number` → new date |
| Operators | `and`, `or`, `not`, `in`, `not in`, `between`, `is null`, `is not null`, `!?`, `?` |

### Advanced: Standalone Expression Evaluation

The expression evaluator can be used independently:

```typescript
import { evaluateExpression } from 'picorules-compiler-js-core';

const bmi = evaluateExpression(
  'round(wt / power(ht / 100, 2), 1)',
  { wt: 95, ht: 170 }
);
// bmi = 32.9
```

## FHIR Adapter: picorules-adapter-fhir

Enables evaluation of Picorules ruleblocks directly against FHIR R4 Bundles. No EADV database or data flattening required.

### Installation

```bash
npm install picorules-adapter-fhir picorules-compiler-js-core
```

### Usage

```typescript
import { parse, evaluate } from 'picorules-compiler-js-core';
import { FhirDataAdapter } from 'picorules-adapter-fhir';

// Your FHIR R4 Bundle (from a FHIR server, Bulk Export, etc.)
const bundle = await fetchPatientBundle(patientId);

// Create the adapter — it translates EADV attribute names to FHIR queries
const adapter = new FhirDataAdapter(bundle);

// Evaluate any Picorules ruleblock against FHIR data
const parsed = parse([{ name: 'anaemia', text: prbSource, isActive: true }]);
const result = evaluate(parsed[0], adapter);
// { hb_last: 118, is_anaemic: 1 }
```

### How Terminology Mapping Works

The adapter translates EADV attribute names to FHIR resource queries using three strategies:

**1. Auto-Derived (ICD-10, ICPC-2, ATC)**

The EADV attribute name encodes the code directly:

| EADV Attribute | FHIR Query |
|---|---|
| `icd_e11%` | Condition where code system = ICD-10 and code starts with "E11" |
| `icpc_k86001` | Condition where code system = ICPC-2 and code = "K86001" |
| `rxnc_c09aa%` | MedicationRequest where code system = ATC and code starts with "C09AA" |

**2. Curated LOINC Lookup (80+ mappings)**

Lab and observation attributes map to LOINC codes via a built-in dictionary:

| EADV Attribute | LOINC Code | FHIR Resource |
|---|---|---|
| `lab_bld_egfr` | 33914-3 | Observation |
| `lab_bld_haemoglobin` | 718-7 | Observation |
| `lab_bld_creatinine` | 2160-0 | Observation |
| `obs_bp_systolic` | 8480-6 | Observation |
| `obs_weight` | 29463-7 | Observation |

**3. User Overrides**

Add custom mappings at runtime:

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

### FHIR Code Systems

The adapter uses official HL7 FHIR R4 code system URIs:

| System | URI |
|--------|-----|
| ICD-10 | `http://hl7.org/fhir/sid/icd-10` |
| ICPC-2 | `http://hl7.org/fhir/sid/icpc-2` |
| LOINC | `http://loinc.org` |
| SNOMED CT | `http://snomed.info/sct` |
| WHO ATC | `http://www.whocc.no/atc` |
| RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |

## Mock Data Generator: picorules-compiler-js-eadv-mocker

Generates synthetic EADV data for testing ruleblocks without a real clinical database.

### Installation

```bash
npm install picorules-compiler-js-eadv-mocker
```

### Usage

```typescript
import { generateMockData } from 'picorules-compiler-js-eadv-mocker';

const result = generateMockData({
  ruleblocks: [{ name: 'ckd', text: prbSource, isActive: true }],
  options: {
    entityCount: 10,          // 10 patients
    observationsPerEntity: 5, // 5 observations per attribute
    seed: 42,                 // Reproducible results
    dateDistribution: 'recent-weighted', // More recent observations
  },
});

console.log(result.eadv);     // EADV rows
console.log(result.metadata); // { entities, attributes, totalRows }
```

The mocker:
- Analyses the ruleblock to determine which EADV attributes are needed
- Generates clinically realistic values using built-in value ranges (e.g., eGFR 15-120, Hb 80-180)
- Supports wildcard attribute expansion (e.g., `icd_e11%` generates `icd_e11xx`)
- Produces seeded, reproducible output for deterministic testing

## Pluggable Data Adapters

The JS evaluator works with any data source through the `DataAdapter` interface:

```typescript
interface DataAdapter {
  getRecords(attributeList: string[]): DataRecord[];
}

interface DataRecord {
  val: number | string | Date | null;
  dt: Date | null;
}
```

Built-in adapters:
- **`EadvDataAdapter`** — For in-memory EADV records (from `picorules-compiler-js-core`)
- **`FhirDataAdapter`** — For FHIR R4 Bundles (from `picorules-adapter-fhir`)

Custom adapters can be built for any data source (HL7v2, CSV, custom EMR APIs, etc.) by implementing this interface.

## Performance

| Operation | Time |
|-----------|------|
| Parse a ruleblock | ~0.5ms |
| Evaluate against EADV data | ~0.3ms |
| Evaluate against FHIR Bundle | ~0.4ms |
| Compile to SQL | < 1ms |
| All 85 first-order ruleblocks (mock data) | ~30ms total |

## Source Code

| Repository | Description |
|------------|-------------|
| [picorules-compiler-js-core](https://github.com/asaabey/picorules-compiler-js-core) | Compiler + JS evaluator |
| [picorules-adapter-fhir](https://github.com/asaabey/picorules-adapter-fhir) | FHIR R4 adapter |
| [picorules-compiler-js-eadv-mocker](https://github.com/asaabey/picorules-compiler-js-eadv-mocker) | Mock data generator |
| [picorules-agent](https://github.com/asaabey/picorules-agent) | AI-assisted rule authoring CLI |
| [picorules-docs](https://github.com/asaabey/picorules-docs) | This documentation site |
| [picorule-sentry](https://github.com/asaabey/picorule-sentry) | Web UI for rule variable analysis |
