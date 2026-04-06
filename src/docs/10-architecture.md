# Architecture: Transport-Agnostic CDS

Picorules is designed around a three-layer architecture that separates **what clinical logic to compute** from **where the data comes from**. This means the same ruleblocks — written once — evaluate identically against FHIR R4 servers, openEHR Clinical Data Repositories, and legacy SQL databases.

## The Three Layers

```
┌─────────────────────────────────────────────────┐
│              LANGUAGE LAYER                      │
│                                                  │
│  .prb ruleblock files                           │
│  FETCH → COMPUTE → BIND statements             │
│  Written once, never modified for transport     │
└─────────────────────┬───────────────────────────┘
                      │ parse()
                      ▼
┌─────────────────────────────────────────────────┐
│            COMPILATION LAYER                     │
│                                                  │
│  Parsed AST → Dependency graph → Evaluate       │
│  + introspectDataRequirements()                 │
│  Derives the data contract from the rules       │
└─────────────────────┬───────────────────────────┘
                      │ evaluate(ruleblock, adapter)
                      ▼
┌─────────────────────────────────────────────────┐
│            ADAPTATION LAYER                      │
│                                                  │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐ │
│  │  FHIR R4  │ │  openEHR   │ │  EADV SQL    │ │
│  │  Adapter   │ │  Adapter   │ │  Adapter     │ │
│  └─────┬─────┘ └─────┬──────┘ └──────┬───────┘ │
│        │              │               │          │
│   DataRecord[]   DataRecord[]    DataRecord[]    │
│        └──────────────┼───────────────┘          │
│            Identical output from all             │
└─────────────────────────────────────────────────┘
```

## The DataAdapter Interface

Every data source implements one interface:

```typescript
interface DataAdapter {
  getRecords(attributeList: string[]): DataRecord[];
}

interface DataRecord {
  val: number | string | Date | null;
  dt: Date | null;
}
```

The evaluator calls `getRecords(['lab_bld_egfr'])` and gets back date-value pairs. It never knows whether those came from a FHIR server, an openEHR CDR, or a SQL database.

## Built-in Adapters

| Adapter | Data Source | Transport | Package |
|---------|-----------|-----------|---------|
| `EadvDataAdapter` | In-memory EADV records | Direct | `picorules-compiler-js-core` |
| `FhirDataAdapter` | FHIR R4 Bundles | FHIR Search | `picorules-adapter-fhir` |
| `OpenEhrDataAdapter` | openEHR CDRs | AQL queries | `picorules-adapter-openehr` |

## Self-Describing Rules

A unique capability: the compiler can **introspect its own parsed ruleblocks** to automatically derive the minimal data contract needed for evaluation.

```typescript
import { parse } from 'picorules-compiler-js-core';
import { introspectDataRequirements, buildFhirSearchUrls } from 'picorules-adapter-fhir';

const parsed = parse(ruleblocks);
const requirements = introspectDataRequirements(parsed);
// → { requirements: [{code: '33914-3', system: 'LOINC', ...}, ...],
//     needsPatient: true, resourceTypes: ['Observation', 'Condition', ...] }

const queries = buildFhirSearchUrls(requirements, patientId);
// → 4 targeted FHIR queries instead of fetching everything
```

For the full 153-ruleblock reference set, this produces:
- **943 EADV attributes** extracted from FETCH statements
- **638 FHIR codes** resolved via the terminology map
- **4 FHIR queries** (or 6 AQL queries) per patient

This means:
- **No manual data contract** — the rules define what data they need
- **Minimal data access** — only the resources the rules reference are fetched
- **Auto-generated CDS Hooks prefetch** — the compiler produces CDS Hooks service definitions
- **Privacy by design** — the app only touches data the rules require

## The Shared Terminology Bridge

The critical insight: LOINC, ICD-10, SNOMED, and ATC codes are the same regardless of transport.

```
EADV attribute: lab_bld_egfr
         │
    resolveAttribute()
         │
         ▼
{ system: "http://loinc.org", code: "33914-3" }
         │
    ┌────┴──────────────────────────────┐
    ▼                                   ▼
FHIR:  Observation?code=               AQL: WHERE code_string =
       http://loinc.org|33914-3              '33914-3'
```

Adding a new data source means implementing `DataAdapter` and the transport-specific query mechanism. The rules, terminology, and evaluator are all reused unchanged.

## Proven: Identical Clinical Outputs

The same CKD patient evaluated through all three paths:

| Variable | FHIR R4 | openEHR AQL | EADV SQL |
|----------|---------|-------------|----------|
| CKD Stage | 3B | 3B | 3B |
| eGFR | 39 | 39 | 39 |
| ACR | 45 | 45 | 45 |
| Diabetes | Type 2 | Type 2 | Type 2 |
| HTN | Yes | Yes | Yes |
| CV Risk | High | High | High |
| Charlson Index | 3 | 3 | 3 |

Validated by 25 automated E2E tests and 110 unit tests across 4 patient scenarios.

## Comparison with Other CDS Standards

| Capability | Picorules | CQL | Arden Syntax | CDS Hooks |
|-----------|-----------|-----|-------------|-----------|
| Data binding | FHIR + openEHR + SQL | FHIR only | None standardised | FHIR prefetch |
| Self-describing data contract | Yes (auto-derived) | No (manual) | No | No (manual prefetch) |
| Transport-agnostic | Yes | No | Theoretically | No |
| Batch + real-time | Yes (SQL + JS) | Engine-dependent | Single MLM | Service-based |
| Rule portability | Same rules, any site | FHIR sites only | "Curly braces problem" | Service-specific |
