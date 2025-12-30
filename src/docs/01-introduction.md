# Introduction

## What is Picorules?

Picorules is a domain-specific language (DSL) designed for clinical decision support systems. It enables clinicians and clinical informaticians to author complex medical logic without writing SQL, while maintaining the power and performance of database-native computation.

Think of Picorules as a bridge between clinical reasoning and database queries—you describe *what* clinical insights you want to derive, and Picorules generates the *how* in optimized SQL.

**Note:** This documentation references The Kidney Centre (TKC) as an example implementation, but Picorules is designed to work with any clinical system using an EADV data model.

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

A typical clinical query might require 50+ lines of SQL with multiple intermediate steps—making it difficult to author, review, and maintain.

## How Picorules Helps

Picorules transforms clinical logic authoring by:

### 1. **Declarative Syntax**

Instead of describing *how* to query the database, you declare *what* you want:

```javascript
// Get the most recent hemoglobin value
hb_last => eadv.lab_bld_haemoglobin.val.last();
```

This single line compiles to SQL (using temporary tables in T-SQL implementations) with window functions, date filtering, and proper aggregation.

### 2. **Clinical-Friendly Abstractions**

Picorules provides functions that match clinical thinking:

- `.last()` — most recent value
- `.lastdv()` — most recent date-value pair
- `.where()` — filter by conditions
- `.bind()` — reference other ruleblocks

### 3. **Automatic SQL Generation**

Picorules compiles to optimized SQL automatically:
- Generates intermediate result sets (temp tables in T-SQL) for each statement
- Handles joins on patient ID (`eid`)
- Applies proper windowing and aggregation
- Manages NULL handling and date arithmetic

### 4. **Modular Composition**

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

### 5. **Documentation as Code**

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

This abstraction means you write Picorules once, and the compiler generates the appropriate SQL for your database platform.

## Who Should Use Picorules?

Picorules is designed for:

- **Clinical Informaticians**: Bridge clinical knowledge and technical implementation
- **Data Analysts**: Query clinical data without complex SQL
- **Medical Directors**: Define and maintain clinical protocols
- **Quality Improvement Teams**: Implement and track clinical measures
- **Researchers**: Extract cohorts and outcomes for studies

## What You'll Learn

This documentation is organized to take you from beginner to expert:

1. **Tutorial** — Hands-on introduction building real ruleblocks
2. **Language Reference** — Complete syntax and semantics
3. **EADV Model** — Understanding the underlying data structure
4. **Functions Reference** — All available operations
5. **Templating** — Creating dashboards with Jinja2
6. **Examples** — Real-world clinical patterns and solutions

## Design Philosophy

Picorules follows key design principles:

### Readable over Terse
Code should be understandable by clinical reviewers:
```javascript
// Clear intent
is_diabetic : { has_dm_dx=1 or on_dm_meds=1 => 1 }, { => 0 };

// Avoid cryptic abbreviations
```

### Explicit over Implicit
Operations should be obvious:
```javascript
// Explicit aggregation
hb_last => eadv.lab_bld_haemoglobin.val.last();

// Not: hb => eadv.lab_bld_haemoglobin  // What does this return?
```

### Safe by Default
The compiler enforces correctness:
- Functional statements before conditional statements
- All referenced variables must exist
- Statements must end with semicolon
- Attribute names must be defined

### Performance Conscious
Generated SQL is optimized for the EADV model:
- Efficient window functions
- Proper indexing strategies
- Minimal data scanning

## Next Steps

Ready to write your first ruleblock? Continue to the [Tutorial](#tutorial) to get started with hands-on examples.

Already familiar with the basics? Jump to the [Language Reference](#language-reference) for detailed syntax documentation.

Want to understand the underlying data model? See [EADV Model](#eadv-model).
