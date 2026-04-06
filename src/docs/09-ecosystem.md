# SDK & Ecosystem

Picorules is available as a set of npm packages for building clinical decision support applications in JavaScript and TypeScript. The packages support three execution modes: compiling to SQL for population-scale batch analytics, evaluating directly in JavaScript against FHIR R4 data, or querying openEHR Clinical Data Repositories via AQL.

## Packages

| Package | Description |
|---------|-------------|
| [picorules-compiler-js-core](https://www.npmjs.com/package/picorules-compiler-js-core) | Compiler + JS runtime evaluator — parser, linker, multi-dialect SQL generator, and in-memory evaluator |
| [picorules-adapter-fhir](https://www.npmjs.com/package/picorules-adapter-fhir) | FHIR R4 data adapter — terminology mapping, smart fetch introspection, CDS Hooks prefetch generation, output mapper |
| [picorules-adapter-openehr](https://www.npmjs.com/package/picorules-adapter-openehr) | openEHR data adapter — AQL query builder, archetype mapping, CDR integration |
| [picorules-compiler-js-eadv-mocker](https://www.npmjs.com/package/picorules-compiler-js-eadv-mocker) | Mock EADV data generator — synthetic patient data for testing |
| [picorules-compiler-js-db-manager](https://www.npmjs.com/package/picorules-compiler-js-db-manager) | Database execution manager — run compiled SQL against PostgreSQL/Oracle/MSSQL |

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
          ┌────────────────────┼────────────────────┐
          │                    │                     │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌─────────▼─────────┐
│  Compile to SQL    │ │ Evaluate (FHIR)│ │ Evaluate (openEHR)│
│                    │ │                │ │                    │
│  Oracle / MSSQL /  │ │ FHIR R4 Bundle │ │ AQL via REST API  │
│  PostgreSQL        │ │ + smart fetch  │ │ EHRbase / Better   │
│                    │ │                │ │                    │
│  Population batch  │ │ Single-patient │ │ Single-patient     │
│  analytics         │ │ real-time CDS  │ │ real-time CDS      │
└────────────────────┘ └────────────────┘ └────────────────────┘
```

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

const parsed = parse([{ name: 'ckd', text: ruleblockSource, isActive: true }]);

const adapter = new EadvDataAdapter([
  { eid: 1, att: 'lab_bld_egfr', dt: '2024-06-01', val: 44 },
  { eid: 1, att: 'lab_bld_egfr', dt: '2024-01-15', val: 48 },
]);

const result = evaluate(parsed[0], adapter);
// { egfr_last: 44, ckd_stage: 4, ... }
```

### Multi-Ruleblock Evaluation

When ruleblocks depend on each other via `.bind()`, use `evaluateAll()` which handles dependency ordering automatically:

```typescript
import { parse, evaluateAll } from 'picorules-compiler-js-core';

const parsed = parse([
  { name: 'egfr_metrics', text: egfrSource, isActive: true },
  { name: 'ckd', text: ckdSource, isActive: true }, // binds to egfr_metrics
]);

const results = evaluateAll(parsed, adapter);
// results.get('egfr_metrics') = { egfr_last: 44, egfr_slope: -0.018 }
// results.get('ckd')          = { ckd_stage: 4, has_ckd: 1 }
```

## Data Adapters

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

| Adapter | Data Source | Package |
|---------|-----------|---------|
| `EadvDataAdapter` | In-memory EADV records | `picorules-compiler-js-core` |
| `FhirDataAdapter` | FHIR R4 Bundles | `picorules-adapter-fhir` |
| `OpenEhrDataAdapter` | openEHR CDRs (via AQL) | `picorules-adapter-openehr` |

Custom adapters can be built for any data source (HL7v2, CSV, OMOP CDM, etc.) by implementing this two-method interface.

## Applications & Tools

| Application | Description | Tech Stack |
|------------|-------------|-----------|
| [Picorules Studio](https://github.com/asaabey/picorules-studio) | Web IDE for rule authoring, compilation, and testing | Next.js, Monaco Editor, Neon PostgreSQL |
| [Picorule Sentry](https://github.com/asaabey/picorule-sentry) | Ruleblock variable catalog and explorer | React, Netlify Functions, MCP |
| [Picorules Agent](https://github.com/asaabey/picorules-agent) | AI-assisted rule authoring via Claude Code | Node.js, Claude Code Skills |
| [Picorules Docs](https://github.com/asaabey/picorules-docs) | This documentation site | React, Vite, Markdown |

## Performance

| Operation | Time |
|-----------|------|
| Parse 153 ruleblocks | ~50ms |
| Evaluate 153 ruleblocks (FHIR, per patient) | ~16ms |
| Evaluate 153 ruleblocks (openEHR, per patient) | ~50ms |
| Smart fetch (4 FHIR queries) | ~30ms |
| Compile single ruleblock to SQL | < 1ms |

## Source Repositories

| Repository | Description |
|------------|-------------|
| [picorules-compiler-js-core](https://github.com/asaabey/picorules-compiler-js-core) | Compiler + JS evaluator |
| [picorules-adapter-fhir](https://github.com/asaabey/picorules-adapter-fhir) | FHIR R4 adapter + smart fetch + CDS Hooks |
| [picorules-adapter-openehr](https://github.com/asaabey/picorules-adapter-openehr) | openEHR AQL adapter |
| [picorules-studio](https://github.com/asaabey/picorules-studio) | Web IDE |
| [picorules-agent](https://github.com/asaabey/picorules-agent) | AI-assisted rule authoring |
| [picorule-sentry](https://github.com/asaabey/picorule-sentry) | Variable catalog explorer |
| [picorules-docs](https://github.com/asaabey/picorules-docs) | Documentation site |
| [tkc-picorules](https://github.com/asaabey/tkc-picorules) | Original PL/SQL compiler (2019) |
