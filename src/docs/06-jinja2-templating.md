# Jinja2 Templating

Dashboard templates in TKC use Jinja2, a powerful templating engine, to create dynamic HTML interfaces that display ruleblock outputs. This section covers template structure, Jinja2 syntax, and best practices.

## Template Structure

Templates live in `picodomain_template_pack/template_blocks/` as **paired files**:

### The Two-File Pattern

```
my_template.json      # Metadata
my_template.txt       # HTML/CSS content with Jinja2
```

#### Metadata File (`.json`)

Defines template configuration:

```json
{
  "name": "CKD Dashboard",
  "description": "Comprehensive CKD patient overview",
  "related_ruleblock": "ckd_diagnostics",
  "is_active": 2,
  "version": "1.0",
  "environment": "PROD",
  "display_order": 10,
  "category": "Clinical"
}
```

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for dashboard |
| `description` | string | What this template shows |
| `related_ruleblock` | string | Which ruleblock provides data |
| `is_active` | integer | 2 = active, 0 = inactive |
| `version` | string | Version for tracking |
| `display_order` | integer | Sort order in UI |
| `category` | string | Grouping (Clinical, Admin, etc.) |

#### Content File (`.txt`)

Contains HTML with Jinja2 template syntax:

```html
<div class="ckd-dashboard">
  <h2>CKD Status</h2>
  <p>Stage: {{ ckd_stage }}</p>
  {% if ckd_stage >= 4 %}
    <div class="alert">Advanced CKD - Nephrology referral needed</div>
  {% endif %}
</div>
```

## Data Access in Templates

Templates have access to variables from the `related_ruleblock`.

### Basic Variable Interpolation

Use double curly braces `{{ }}` to output values:

```html
<p>Hemoglobin: {{ hb_last }} g/L</p>
<p>eGFR: {{ egfr_last }} mL/min/1.73m²</p>
<p>Last test: {{ hb_dt }}</p>
```

**Pattern:** `{{ variable_name }}` where `variable_name` is defined in the ruleblock.

### Example Ruleblock and Template

**Ruleblock (`ckd_anemia.prb`):**

```javascript
#define_ruleblock(ckd_anemia, { ... });

hb => eadv.lab_bld_haemoglobin._.lastdv();
is_anaemic : { hb_val < 120 => 1 }, { => 0 };
```

**Template (`ckd_anemia.txt`):**

```html
<div class="anemia-status">
  <p>Hemoglobin: {{ hb_val }} g/L ({{ hb_dt }})</p>
  {% if is_anaemic == 1 %}
    <span class="badge badge-warning">Anemic</span>
  {% else %}
    <span class="badge badge-success">Normal</span>
  {% endif %}
</div>
```

## Jinja2 Syntax Basics

### Variables

```jinja2
{{ variable_name }}
```

**Examples:**

```html
<p>Patient age: {{ age }} years</p>
<p>CKD Stage: {{ ckd_stage }}</p>
```

### Comments

```jinja2
{# This is a comment - not rendered in output #}
```

**Example:**

```html
{# TODO: Add ferritin trending graph #}
<p>Iron stores: {{ ferritin_last }} ng/mL</p>
```

### Filters

Transform variables using the pipe `|` operator:

```jinja2
{{ variable | filter }}
```

**Common Filters:**

| Filter | Purpose | Example |
|--------|---------|---------|
| `default(value)` | Fallback if NULL/missing | `{{ hb \| default('N/A') }}` |
| `round(n)` | Round number | `{{ egfr \| round(1) }}` |
| `upper` | Uppercase | `{{ status \| upper }}` |
| `lower` | Lowercase | `{{ name \| lower }}` |
| `title` | Title Case | `{{ name \| title }}` |
| `length` | Count items | `{{ medications \| length }}` |

**Examples:**

```html
<p>eGFR: {{ egfr_last | round(1) | default('Not available') }} mL/min/1.73m²</p>
<p>Status: {{ status | upper }}</p>
```

### Chaining Filters

```html
{{ variable | filter1 | filter2 | filter3 }}
```

**Example:**

```html
<p>{{ patient_name | default('Unknown') | title }}</p>
```

## Control Structures

### If Statements

```jinja2
{% if condition %}
  <!-- content -->
{% endif %}
```

**Example:**

```html
{% if is_anaemic == 1 %}
  <div class="alert alert-warning">
    Patient has anemia (Hb: {{ hb_val }} g/L)
  </div>
{% endif %}
```

### If-Else

```jinja2
{% if condition %}
  <!-- true branch -->
{% else %}
  <!-- false branch -->
{% endif %}
```

**Example:**

```html
{% if ckd_stage >= 4 %}
  <span class="badge badge-danger">Advanced CKD</span>
{% else %}
  <span class="badge badge-info">CKD Stage {{ ckd_stage }}</span>
{% endif %}
```

### If-Elif-Else

```jinja2
{% if condition1 %}
  <!-- branch 1 -->
{% elif condition2 %}
  <!-- branch 2 -->
{% elif condition3 %}
  <!-- branch 3 -->
{% else %}
  <!-- default -->
{% endif %}
```

**Example:**

```html
{% if ckd_stage == 5 %}
  <div class="status-critical">Kidney Failure</div>
{% elif ckd_stage == 4 %}
  <div class="status-severe">Severe CKD</div>
{% elif ckd_stage == 3 %}
  <div class="status-moderate">Moderate CKD</div>
{% elif ckd_stage >= 1 %}
  <div class="status-mild">Mild CKD</div>
{% else %}
  <div class="status-none">No CKD</div>
{% endif %}
```

### Comparison Operators

| Operator | Meaning |
|----------|---------|
| `==` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater or equal |
| `<=` | Less or equal |

**Example:**

```html
{% if hb_val < 100 %}
  <span class="severe">Severe anemia</span>
{% elif hb_val < 120 %}
  <span class="moderate">Mild anemia</span>
{% else %}
  <span class="normal">Normal</span>
{% endif %}
```

### Logical Operators

| Operator | Meaning |
|----------|---------|
| `and` | Both true |
| `or` | Either true |
| `not` | Negate |

**Example:**

```html
{% if ckd_stage >= 3 and is_anaemic == 1 %}
  <div class="alert">CKD-related anemia - consider EPO</div>
{% endif %}

{% if ferritin_last < 100 or (ferritin_last < 300 and tsat_last < 20) %}
  <div class="alert">Iron deficiency</div>
{% endif %}
```

## Loops

### For Loop

```jinja2
{% for item in collection %}
  {{ item }}
{% endfor %}
```

**Example (if ruleblock returns lists):**

```html
<ul>
{% for medication in active_medications %}
  <li>{{ medication.name }} - {{ medication.dose }}</li>
{% endfor %}
</ul>
```

### Loop Variables

Inside loops, special variables are available:

| Variable | Description |
|----------|-------------|
| `loop.index` | Current iteration (1-indexed) |
| `loop.index0` | Current iteration (0-indexed) |
| `loop.first` | True if first iteration |
| `loop.last` | True if last iteration |

**Example:**

```html
<table>
{% for lab in lab_results %}
  <tr class="{% if loop.first %}header{% endif %}">
    <td>{{ loop.index }}</td>
    <td>{{ lab.name }}</td>
    <td>{{ lab.value }}</td>
  </tr>
{% endfor %}
</table>
```

### Empty Check

```jinja2
{% for item in collection %}
  {{ item }}
{% else %}
  <p>No items found</p>
{% endfor %}
```

## Template Composition

TKC uses a frame-based composition pattern for reusable dashboard components.

### Frame Templates

Special templates that wrap content:

#### Dashboard Header (`__dashboard_header__.txt`)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .dashboard { font-family: Arial, sans-serif; }
    .alert { padding: 10px; border-radius: 5px; }
    .alert-warning { background: #fff3cd; border: 1px solid #ffc107; }
    .alert-danger { background: #f8d7da; border: 1px solid #dc3545; }
    .badge { padding: 5px 10px; border-radius: 3px; color: white; }
    .badge-success { background: #28a745; }
    .badge-warning { background: #ffc107; }
    .badge-danger { background: #dc3545; }
  </style>
</head>
<body>
<div class="dashboard">
```

#### Dashboard Footer (`__dashboard_footer__.txt`)

```html
</div>
</body>
</html>
```

#### Frame Begin (`__frame_begin__.txt`)

```html
<div class="dashboard-frame">
  <div class="frame-header">
    <h3>{{ frame_title }}</h3>
  </div>
  <div class="frame-content">
```

#### Frame End (`__frame_end__.txt`)

```html
  </div>
</div>
```

### Using Frames

Your template references frames:

```jinja2
{% include '__dashboard_header__.txt' %}

{% set frame_title = "CKD Overview" %}
{% include '__frame_begin__.txt' %}

<p>eGFR: {{ egfr_last }} mL/min/1.73m²</p>
<p>Stage: {{ ckd_stage }}</p>

{% include '__frame_end__.txt' %}

{% include '__dashboard_footer__.txt' %}
```

## Practical Examples

### Example 1: Simple Status Card

**Ruleblock Variables:**
- `hb_val` — Hemoglobin value
- `hb_dt` — Test date
- `is_anaemic` — Boolean flag

**Template:**

```html
<div class="lab-card">
  <h4>Hemoglobin</h4>
  <div class="value-display">
    <span class="lab-value">{{ hb_val | default('N/A') }}</span>
    <span class="lab-unit">g/L</span>
  </div>
  <div class="test-date">Last tested: {{ hb_dt | default('Never') }}</div>

  {% if is_anaemic == 1 %}
    <div class="alert alert-warning">
      <strong>Anemia detected</strong><br>
      Consider iron studies and further workup
    </div>
  {% endif %}
</div>
```

### Example 2: Risk Stratification

**Ruleblock Variables:**
- `cvd_risk` — Risk score (0-4)
- `ckd_stage`
- `is_diabetic`
- `age`

**Template:**

```html
<div class="risk-assessment">
  <h3>Cardiovascular Risk</h3>

  {% if cvd_risk == 4 %}
    <div class="risk-badge risk-very-high">VERY HIGH RISK</div>
    <p>Intensive management required</p>
  {% elif cvd_risk == 3 %}
    <div class="risk-badge risk-high">HIGH RISK</div>
    <p>Consider cardiology referral</p>
  {% elif cvd_risk == 2 %}
    <div class="risk-badge risk-moderate">MODERATE RISK</div>
    <p>Optimize modifiable risk factors</p>
  {% elif cvd_risk == 1 %}
    <div class="risk-badge risk-low">LOW-MODERATE RISK</div>
  {% else %}
    <div class="risk-badge risk-none">LOW RISK</div>
  {% endif %}

  <h4>Risk Factors</h4>
  <ul>
    {% if ckd_stage >= 3 %}
      <li>CKD Stage {{ ckd_stage }}</li>
    {% endif %}
    {% if is_diabetic == 1 %}
      <li>Diabetes Mellitus</li>
    {% endif %}
    {% if age >= 65 %}
      <li>Age ≥65 years</li>
    {% endif %}
  </ul>
</div>
```

### Example 3: Lab Trend Table

**Ruleblock Variables:**
- `hb_1`, `hb_2`, `hb_3` — Last 3 Hb values
- `hb_dt_1`, `hb_dt_2`, `hb_dt_3` — Corresponding dates

**Template:**

```html
<div class="lab-trend">
  <h4>Hemoglobin Trend</h4>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Value (g/L)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ hb_dt_1 }}</td>
        <td>{{ hb_1 }}</td>
        <td>
          {% if hb_1 < 100 %}
            <span class="status-low">Low</span>
          {% elif hb_1 < 120 %}
            <span class="status-borderline">Borderline</span>
          {% else %}
            <span class="status-normal">Normal</span>
          {% endif %}
        </td>
      </tr>
      <tr>
        <td>{{ hb_dt_2 }}</td>
        <td>{{ hb_2 }}</td>
        <td>
          {% if hb_2 < 100 %}
            <span class="status-low">Low</span>
          {% elif hb_2 < 120 %}
            <span class="status-borderline">Borderline</span>
          {% else %}
            <span class="status-normal">Normal</span>
          {% endif %}
        </td>
      </tr>
      <tr>
        <td>{{ hb_dt_3 }}</td>
        <td>{{ hb_3 }}</td>
        <td>
          {% if hb_3 < 100 %}
            <span class="status-low">Low</span>
          {% elif hb_3 < 120 %}
            <span class="status-borderline">Borderline</span>
          {% else %}
            <span class="status-normal">Normal</span>
          {% endif %}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Example 4: Conditional Recommendations

**Ruleblock Variables:**
- `ckd_stage`
- `is_anaemic`
- `is_iron_deficient`
- `esa_eligible`

**Template:**

```html
<div class="clinical-recommendations">
  <h3>Clinical Actions</h3>

  {% if ckd_stage >= 4 %}
    <div class="recommendation priority-high">
      <strong>Nephrology Referral</strong>
      <p>Advanced CKD requires specialist management</p>
    </div>
  {% endif %}

  {% if is_anaemic == 1 %}
    <div class="recommendation priority-medium">
      <strong>Anemia Management</strong>
      {% if is_iron_deficient == 1 %}
        <p>✓ Iron supplementation indicated</p>
      {% else %}
        <p>Iron stores adequate</p>
      {% endif %}

      {% if esa_eligible == 1 %}
        <p>✓ Consider ESA therapy (shared decision-making)</p>
      {% else %}
        <p>Not currently eligible for ESA</p>
      {% endif %}
    </div>
  {% endif %}

  {% if ckd_stage >= 3 %}
    <div class="recommendation priority-low">
      <strong>Routine Monitoring</strong>
      <p>Labs every 3-6 months: Hb, Cr, eGFR, electrolytes</p>
    </div>
  {% endif %}
</div>
```

## Advanced Jinja2 Features

### Set Variables

```jinja2
{% set variable_name = value %}
```

**Example:**

```html
{% set threshold = 100 %}
{% if hb_val < threshold %}
  <p>Hemoglobin below {{ threshold }} g/L</p>
{% endif %}

{% set risk_class = 'high' if cvd_risk >= 3 else 'low' %}
<div class="{{ risk_class }}-risk">...</div>
```

### Math Operations

```jinja2
{{ value + 10 }}
{{ value - 5 }}
{{ value * 2 }}
{{ value / 3 }}
{{ value // 3 }}  {# Integer division #}
{{ value % 2 }}   {# Modulo #}
```

**Example:**

```html
<p>Next test due: {{ hb_dt + 180 }} days</p>
<p>Doubling threshold: {{ cr_baseline * 2 }} μmol/L</p>
```

### Tests

Check value properties:

```jinja2
{% if variable is defined %}
{% if variable is none %}
{% if variable is number %}
{% if variable is string %}
```

**Example:**

```html
{% if hb_val is defined %}
  <p>Hemoglobin: {{ hb_val }} g/L</p>
{% else %}
  <p>No hemoglobin data available</p>
{% endif %}
```

### Macros (Reusable Components)

```jinja2
{% macro badge(label, type) %}
  <span class="badge badge-{{ type }}">{{ label }}</span>
{% endmacro %}
```

**Usage:**

```html
{% if is_anaemic == 1 %}
  {{ badge('Anemic', 'warning') }}
{% else %}
  {{ badge('Normal', 'success') }}
{% endif %}
```

## Styling Dashboards

Templates include inline CSS in the header frames:

```html
<style>
.dashboard {
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.lab-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: white;
}

.value-display {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin: 10px 0;
}

.alert-warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.alert-danger {
  background-color: #f8d7da;
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.badge-success { background-color: #28a745; }
.badge-warning { background-color: #ffc107; color: #333; }
.badge-danger { background-color: #dc3545; }

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}
</style>
```

## Best Practices

### 1. Always Handle Missing Data

```html
{# ❌ Bad - will show "None" or error #}
<p>Hemoglobin: {{ hb_val }} g/L</p>

{# ✅ Good - graceful fallback #}
<p>Hemoglobin: {{ hb_val | default('Not available') }} g/L</p>
```

### 2. Use Semantic CSS Classes

```html
{# ❌ Bad #}
<div class="red-box">Alert!</div>

{# ✅ Good #}
<div class="alert alert-danger">Alert!</div>
```

### 3. Keep Logic Simple

Templates are for presentation. Complex logic belongs in ruleblocks.

```html
{# ❌ Bad - complex calculation in template #}
{% set egfr_adjusted = (140 - age) * weight / (cr * 72) %}

{# ✅ Good - calculation in ruleblock, display in template #}
<p>eGFR: {{ egfr_calculated }} mL/min/1.73m²</p>
```

### 4. Comment Your Templates

```html
{# CKD Anemia Dashboard - v2.1 #}
{# Last updated: 2024-03-15 #}
{# Related ruleblock: ckd_anemia #}

<div class="dashboard">
  {# Hemoglobin status section #}
  <div class="lab-card">
    ...
  </div>

  {# Iron studies section #}
  <div class="lab-card">
    ...
  </div>
</div>
```

### 5. Use Consistent Naming

Match template variable names to ruleblock variable names:

**Ruleblock:**
```javascript
hb_val => ...
hb_dt => ...
is_anaemic => ...
```

**Template:**
```html
{{ hb_val }}
{{ hb_dt }}
{% if is_anaemic == 1 %}
```

### 6. Test Edge Cases

Consider:
- Missing data (NULL values)
- Extreme values
- Date formatting
- Division by zero

```html
{% if hb_val is defined and hb_val is not none %}
  <p>Hemoglobin: {{ hb_val }} g/L</p>
{% else %}
  <p>Hemoglobin: Not tested</p>
{% endif %}
```

## Debugging Templates

### Common Errors

**Error: Variable not found**
- Check spelling matches ruleblock variable
- Ensure `related_ruleblock` is correct in `.json`
- Verify ruleblock has `#define_attribute()` for the variable

**Error: Unexpected token**
- Check for unclosed `{% %}` or `{{ }}`
- Verify filter syntax: `{{ var | filter }}` not `{{ var | filter() }}`

**Error: Division by zero**
- Use conditional checks before math operations

```html
{% if denominator != 0 %}
  <p>Result: {{ numerator / denominator }}</p>
{% endif %}
```

## Complete Template Example

**Metadata (`ckd_overview.json`):**

```json
{
  "name": "CKD Patient Overview",
  "description": "Comprehensive CKD status dashboard",
  "related_ruleblock": "ckd_integrated",
  "is_active": 2,
  "version": "1.0",
  "display_order": 1,
  "category": "Clinical"
}
```

**Content (`ckd_overview.txt`):**

```html
{% include '__dashboard_header__.txt' %}

<div class="patient-dashboard">
  <h2>CKD Management Dashboard</h2>

  {# CKD Status Section #}
  <div class="section">
    <h3>Kidney Function</h3>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">eGFR</div>
        <div class="metric-value">{{ egfr_last | default('N/A') }}</div>
        <div class="metric-unit">mL/min/1.73m²</div>
      </div>
      <div class="metric">
        <div class="metric-label">CKD Stage</div>
        <div class="metric-value">
          {% if ckd_stage > 0 %}
            {{ ckd_stage }}
          {% else %}
            None
          {% endif %}
        </div>
      </div>
    </div>
  </div>

  {# Alerts Section #}
  {% if ckd_stage >= 4 or is_anaemic == 1 %}
  <div class="section">
    <h3>Alerts</h3>
    {% if ckd_stage >= 4 %}
      <div class="alert alert-danger">
        <strong>Advanced CKD</strong><br>
        Nephrology referral recommended
      </div>
    {% endif %}

    {% if is_anaemic == 1 %}
      <div class="alert alert-warning">
        <strong>Anemia Present</strong><br>
        Hemoglobin: {{ hb_val }} g/L<br>
        {% if is_iron_deficient == 1 %}
          Consider iron supplementation
        {% endif %}
      </div>
    {% endif %}
  </div>
  {% endif %}

  {# Recommendations Section #}
  <div class="section">
    <h3>Next Steps</h3>
    <ul class="action-list">
      {% if needs_labs == 1 %}
        <li>Order routine CKD labs (Cr, eGFR, electrolytes)</li>
      {% endif %}
      {% if needs_bp_control == 1 %}
        <li>Optimize blood pressure control (target <130/80)</li>
      {% endif %}
      {% if needs_dm_control == 1 %}
        <li>Improve glycemic control (target HbA1c <7%)</li>
      {% endif %}
    </ul>
  </div>
</div>

{% include '__dashboard_footer__.txt' %}
```

## Next Topics

- [Examples & Cookbook](#examples) — Real-world template and ruleblock patterns
