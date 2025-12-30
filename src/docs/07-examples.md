# Examples & Cookbook

This section provides real-world examples of Picorules ruleblocks and templates for common clinical scenarios.

## Example 1: CKD Staging

A complete ruleblock that stages chronic kidney disease per KDIGO guidelines.

### Ruleblock: `ckd_staging.prb`

```javascript
#define_ruleblock(ckd_staging, {
    description: "CKD staging per KDIGO 2024 guidelines",
    is_active: 2,
    version: "2.0",
    target_table: "rout_ckd_staging",
    environment: "PROD"
});

// ==================
// Functional Statements: Retrieve data
// ==================

// Latest kidney function tests
egfr => eadv.lab_bld_egfr._.lastdv();
cr => eadv.lab_bld_creatinine._.lastdv();
acr => eadv.lab_ua_acr._.lastdv();

// Diagnosis codes
ckd_dx => eadv.icd_N18%.dt.max();
structural_dx => eadv.[icd_Q61%,icd_N03%].dt.max();  // PKD, glomerulonephritis

// Demographics for context
age => rout_global.age.val.bind();

// ==================
// Conditional Statements: Apply staging logic
// ==================

// CKD Stage based on eGFR
ckd_stage_egfr :
    { egfr_val >= 90 => 1 },
    { egfr_val >= 60 => 2 },
    { egfr_val >= 45 => 3a },
    { egfr_val >= 30 => 3b },
    { egfr_val >= 15 => 4 },
    { egfr_val < 15 => 5 },
    { => 0 };

// Albuminuria category
acr_category :
    { acr_val < 3 => 1 },      // A1: Normal/mild increase
    { acr_val < 30 => 2 },     // A2: Moderate increase
    { acr_val >= 30 => 3 },    // A3: Severe increase
    { => 0 };

// CKD Stages 1-2 require additional evidence
has_kidney_damage :
    { ckd_dx!? => 1 },                    // ICD diagnosis
    { structural_dx!? => 1 },             // Structural disease
    { acr_category >= 2 => 1 },           // Albuminuria
    { => 0 };

// Final CKD stage (accounting for stages 1-2 requirements)
ckd_stage :
    { ckd_stage_egfr >= 3 => ckd_stage_egfr },  // Stages 3-5: eGFR alone
    { ckd_stage_egfr <= 2 and has_kidney_damage = 1 => ckd_stage_egfr },  // Stages 1-2: need evidence
    { => 0 };  // No CKD

// Time since last eGFR test (for monitoring recommendations)
egfr_age_days :
    { egfr_dt!? => sysdate - egfr_dt },
    { => 9999 };

// Monitoring frequency needed
needs_repeat_labs :
    { ckd_stage >= 4 and egfr_age_days > 90 => 1 },   // Stage 4-5: every 3 months
    { ckd_stage == 3 and egfr_age_days > 180 => 1 },  // Stage 3: every 6 months
    { => 0 };

// ==================
// Attribute Definitions
// ==================

#define_attribute(ckd_stage, {
    label: "CKD Stage (0-5)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(acr_category, {
    label: "Albuminuria Category (A1-A3)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(needs_repeat_labs, {
    label: "Labs overdue for CKD monitoring",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

// ==================
// Documentation
// ==================

#doc(, {
    txt: "CKD staging per KDIGO 2024 guidelines. Stages 1-2 require evidence of kidney damage (albuminuria, structural abnormality, or biopsy-proven disease).",
    cite: "kdigo_ckd_2024"
});

#doc(ckd_stage, {
    txt: "CKD stages: 1-2 require eGFR with kidney damage evidence; 3a (45-59), 3b (30-44), 4 (15-29), 5 (<15 or dialysis)",
    cite: "kdigo_ckd_2024"
});

#doc(acr_category, {
    txt: "Albuminuria categories: A1 (<3 mg/mmol), A2 (3-30 mg/mmol), A3 (>30 mg/mmol)",
    cite: "kdigo_ckd_2024"
});
```

### Template: `ckd_staging.txt`

```html
<div class="ckd-staging-dashboard">
  <h2>CKD Status</h2>

  <div class="status-grid">
    <div class="status-card">
      <div class="card-header">Kidney Function</div>
      <div class="metric-large">
        eGFR: {{ egfr_val | default('N/A') }} mL/min/1.73m²
      </div>
      <div class="metric-date">{{ egfr_dt }}</div>
    </div>

    <div class="status-card">
      <div class="card-header">CKD Stage</div>
      <div class="stage-display">
        {% if ckd_stage == 0 %}
          <span class="stage-none">No CKD</span>
        {% elif ckd_stage <= 2 %}
          <span class="stage-mild">Stage {{ ckd_stage }}</span>
        {% elif ckd_stage == "3a" or ckd_stage == "3b" %}
          <span class="stage-moderate">Stage {{ ckd_stage }}</span>
        {% elif ckd_stage == 4 %}
          <span class="stage-severe">Stage 4</span>
        {% elif ckd_stage == 5 %}
          <span class="stage-critical">Stage 5</span>
        {% endif %}
      </div>
    </div>

    <div class="status-card">
      <div class="card-header">Albuminuria</div>
      <div class="metric-medium">
        ACR: {{ acr_val | default('N/A') }} mg/mmol
      </div>
      <div class="category">
        {% if acr_category == 3 %}
          Category A3 (Severe)
        {% elif acr_category == 2 %}
          Category A2 (Moderate)
        {% elif acr_category == 1 %}
          Category A1 (Normal)
        {% else %}
          Not tested
        {% endif %}
      </div>
    </div>
  </div>

  {% if needs_repeat_labs == 1 %}
  <div class="alert alert-warning">
    <strong>Labs Overdue</strong><br>
    Repeat kidney function tests recommended per KDIGO monitoring guidelines
  </div>
  {% endif %}
</div>
```

---

## Example 2: Anemia in CKD

Detecting and classifying anemia in CKD patients with treatment recommendations.

### Ruleblock: `ckd_anemia.prb`

```javascript
#define_ruleblock(ckd_anemia, {
    description: "Anemia assessment in CKD per KDIGO guidelines",
    is_active: 2,
    version: "1.5",
    target_table: "rout_ckd_anemia",
    environment: "PROD"
});

// ==================
// Bind from other ruleblocks
// ==================
ckd_stage => rout_ckd_staging.ckd_stage.val.bind();
egfr_last => rout_ckd_staging.egfr_val.val.bind();

// ==================
// Functional Statements
// ==================

// Complete blood count
hb => eadv.lab_bld_haemoglobin._.lastdv();
mcv => eadv.lab_bld_mcv.val.last();

// Iron studies
ferritin => eadv.lab_bld_ferritin._.lastdv();
tsat => eadv.lab_bld_tsat._.lastdv();
iron_last => eadv.lab_bld_iron.val.last();
tibc_last => eadv.lab_bld_tibc.val.last();

// Other workup
b12 => eadv.lab_bld_vitamin_b12.val.last();
folate => eadv.lab_bld_folate.val.last();

// Medications
epo_rx => eadv.rx_[erythropoietin,darbepoetin].dt.max();
iron_rx => eadv.rx_[iron_sucrose,ferric_carboxymaltose].dt.max();

// ==================
// Conditional Statements
// ==================

// Anemia definition (varies by CKD stage)
is_anaemic :
    { ckd_stage == 5 and hb_val < 100 => 1 },      // Dialysis
    { ckd_stage >= 3 and hb_val < 115 => 1 },      // CKD 3-4
    { hb_val < 120 => 1 },                         // General
    { => 0 };

// Anemia severity
anemia_severity :
    { hb_val >= 120 => 0 },      // Normal
    { hb_val >= 100 => 1 },      // Mild
    { hb_val >= 80 => 2 },       // Moderate
    { hb_val < 80 => 3 },        // Severe
    { => 0 };

// Iron deficiency
is_iron_deficient :
    { ferritin_val < 100 => 1 },
    { ferritin_val < 300 and tsat_val < 20 => 1 },
    { => 0 };

// B12/folate deficiency
is_b12_deficient : { b12 < 150 => 1 }, { => 0 };
is_folate_deficient : { folate < 7 => 1 }, { => 0 };

// MCV classification
mcv_category :
    { mcv < 80 => 1 },     // Microcytic
    { mcv > 100 => 3 },    // Macrocytic
    { => 2 };              // Normocytic

// Treatment status
on_epo : { epo_rx!? and epo_rx > sysdate-90 => 1 }, { => 0 };
on_iv_iron : { iron_rx!? and iron_rx > sysdate-180 => 1 }, { => 0 };

// Needs workup?
needs_anemia_workup :
    { is_anaemic = 1 and ferritin_dt? => 1 },                    // Anemic but no iron studies
    { is_anaemic = 1 and ferritin_dt < sysdate-180 => 1 },      // Iron studies old
    { => 0 };

// ESA eligibility
esa_eligible :
    { is_anaemic = 1 and ckd_stage >= 3 and is_iron_deficient = 0 and hb_val < 100 => 1 },
    { => 0 };

// Iron supplementation needed
needs_iron :
    { is_anaemic = 1 and is_iron_deficient = 1 => 1 },
    { => 0 };

// ==================
// Attributes
// ==================

#define_attribute(is_anaemic, {
    label: "Has anemia",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(anemia_severity, {
    label: "Anemia severity (0-3)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(is_iron_deficient, {
    label: "Has iron deficiency",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(esa_eligible, {
    label: "Eligible for ESA therapy",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

// ==================
// Documentation
// ==================

#doc(is_iron_deficient, {
    txt: "Iron deficiency defined as ferritin <100 ng/mL, or ferritin 100-300 ng/mL with TSAT <20% per KDIGO 2012",
    cite: "kdigo_anemia_2012"
});

#doc(esa_eligible, {
    txt: "ESA therapy consideration requires: CKD 3-5, anemia (Hb <100 g/L), and adequate iron stores. Shared decision-making essential.",
    cite: "kdigo_anemia_2012"
});
```

### Template: `ckd_anemia.txt`

```html
<div class="anemia-dashboard">
  <h2>Anemia Management</h2>

  <div class="lab-section">
    <h3>Current Status</h3>
    <div class="lab-grid">
      <div class="lab-result">
        <span class="lab-name">Hemoglobin</span>
        <span class="lab-value {{ 'abnormal' if is_anaemic == 1 }}">
          {{ hb_val | default('N/A') }} g/L
        </span>
        <span class="lab-date">{{ hb_dt }}</span>
      </div>

      <div class="lab-result">
        <span class="lab-name">Ferritin</span>
        <span class="lab-value {{ 'abnormal' if is_iron_deficient == 1 }}">
          {{ ferritin_val | default('N/A') }} ng/mL
        </span>
        <span class="lab-date">{{ ferritin_dt }}</span>
      </div>

      <div class="lab-result">
        <span class="lab-name">TSAT</span>
        <span class="lab-value">
          {{ tsat_val | default('N/A') }}%
        </span>
        <span class="lab-date">{{ tsat_dt }}</span>
      </div>
    </div>
  </div>

  {% if is_anaemic == 1 %}
  <div class="alert-section">
    <div class="alert alert-{{ 'danger' if anemia_severity >= 3 else 'warning' }}">
      <strong>
        {% if anemia_severity == 3 %}Severe Anemia
        {% elif anemia_severity == 2 %}Moderate Anemia
        {% else %}Mild Anemia{% endif %}
      </strong>
      <p>Hemoglobin: {{ hb_val }} g/L</p>
    </div>
  </div>

  <div class="recommendations">
    <h3>Recommendations</h3>

    {% if needs_anemia_workup == 1 %}
    <div class="recommendation priority-high">
      <strong>Workup Needed</strong>
      <p>Order or update iron studies (ferritin, TSAT, iron, TIBC)</p>
    </div>
    {% endif %}

    {% if needs_iron == 1 %}
    <div class="recommendation priority-high">
      <strong>Iron Supplementation</strong>
      <p>Iron deficiency present. Consider:</p>
      <ul>
        <li>CKD 3-4: Oral iron supplementation</li>
        <li>CKD 5/Dialysis: IV iron preferred</li>
      </ul>
    </div>
    {% endif %}

    {% if esa_eligible == 1 %}
    <div class="recommendation priority-medium">
      <strong>ESA Therapy Consideration</strong>
      <p>Patient meets criteria for ESA therapy:</p>
      <ul>
        <li>CKD Stage {{ ckd_stage }}</li>
        <li>Hb {{ hb_val }} g/L (target 100-115 g/L)</li>
        <li>Iron replete</li>
      </ul>
      <p><em>Requires shared decision-making discussion</em></p>
    </div>
    {% endif %}

    {% if is_b12_deficient == 1 or is_folate_deficient == 1 %}
    <div class="recommendation priority-medium">
      <strong>Nutritional Deficiency</strong>
      <p>
        {% if is_b12_deficient == 1 %}Vitamin B12 deficiency - supplement<br>{% endif %}
        {% if is_folate_deficient == 1 %}Folate deficiency - supplement{% endif %}
      </p>
    </div>
    {% endif %}
  </div>
  {% else %}
  <div class="status-ok">
    <p>✓ No anemia detected</p>
  </div>
  {% endif %}

  <div class="current-treatment">
    <h3>Current Treatment</h3>
    {% if on_epo == 1 %}
      <p>✓ On ESA therapy (last dose: {{ epo_rx }})</p>
    {% endif %}
    {% if on_iv_iron == 1 %}
      <p>✓ Receiving IV iron (last dose: {{ iron_rx }})</p>
    {% endif %}
    {% if on_epo == 0 and on_iv_iron == 0 %}
      <p>Not currently on anemia-specific therapy</p>
    {% endif %}
  </div>
</div>
```

---

## Example 3: Diabetes Risk Assessment

Identifying patients at risk for diabetes.

### Ruleblock: `diabetes_risk.prb`

```javascript
#define_ruleblock(diabetes_risk, {
    description: "Pre-diabetes and diabetes risk assessment",
    is_active: 2,
    version: "1.0",
    target_table: "rout_diabetes_risk",
    environment: "PROD"
});

// ==================
// Functional Statements
// ==================

// Labs
hba1c => eadv.lab_bld_hba1c._.lastdv();
glucose_fasting => eadv.lab_bld_glucose_fasting._.lastdv();
glucose_random => eadv.lab_bld_glucose._.lastdv();
ogtt_2h => eadv.lab_bld_ogtt_2h.val.last();

// Diagnoses
dm_dx => eadv.icd_E11%.dt.max();        // Type 2 DM
prediabetes_dx => eadv.icd_R73%.dt.max();  // Prediabetes codes

// Medications
dm_meds => eadv.rx_[metformin,gliclazide,insulin%,sglt2%,glp1%].dt.max();

// Risk factors (from other ruleblocks)
bmi => rout_vitals.bmi.val.bind();
age => rout_demo.age.val.bind();
htn => rout_htn.is_hypertensive.val.bind();
ckd => rout_ckd.ckd_stage.val.bind();

// Family history (if captured)
fhx_dm => eadv.fhx_diabetes.dt.max();

// ==================
// Conditional Statements
// ==================

// Established diabetes
has_diabetes :
    { dm_dx!? => 1 },
    { dm_meds!? => 1 },
    { hba1c_val >= 6.5 => 1 },
    { glucose_fasting_val >= 7.0 => 1 },
    { ogtt_2h >= 11.1 => 1 },
    { => 0 };

// Pre-diabetes
has_prediabetes :
    { has_diabetes = 1 => 0 },                            // Not prediabetes if already diabetic
    { prediabetes_dx!? => 1 },
    { hba1c_val >= 5.7 and hba1c_val < 6.5 => 1 },
    { glucose_fasting_val >= 5.6 and glucose_fasting_val < 7.0 => 1 },
    { ogtt_2h >= 7.8 and ogtt_2h < 11.1 => 1 },
    { => 0 };

// Risk score (0-10 scale)
risk_score :
    { has_diabetes = 1 => 0 },          // Already diabetic, not "at risk"
    { has_prediabetes = 1 => 5 },       // Base risk for prediabetes
    { => 0 };

// Add risk factors
risk_score_adjusted :
    { risk_score = 0 => 0 },
    { risk_score > 0 and bmi >= 30 => risk_score + 2 },              // Obesity
    { risk_score > 0 and bmi >= 25 and bmi < 30 => risk_score + 1 }, // Overweight
    { risk_score > 0 and age >= 45 => risk_score + 1 },
    { risk_score > 0 and htn = 1 => risk_score + 1 },
    { risk_score > 0 and fhx_dm!? => risk_score + 1 },
    { => risk_score };

// Needs screening
needs_screening :
    { has_diabetes = 1 or has_prediabetes = 1 => 0 },    // Already diagnosed
    { hba1c_dt? and age >= 45 => 1 },                    // No recent screen, age >45
    { hba1c_dt < sysdate-1095 and age >= 45 => 1 },      // Screen >3 years old
    { bmi >= 25 and (htn = 1 or fhx_dm!?) => 1 },        // Risk factors present
    { => 0 };

// Monitoring frequency
monitoring_interval_days :
    { has_diabetes = 1 => 90 },          // Quarterly
    { has_prediabetes = 1 => 365 },      // Annually
    { => 1095 };                         // Every 3 years

// Labs overdue
labs_overdue :
    { hba1c_dt? => 1 },
    { sysdate - hba1c_dt > monitoring_interval_days => 1 },
    { => 0 };

// ==================
// Attributes
// ==================

#define_attribute(has_diabetes, {
    label: "Has diabetes mellitus",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(has_prediabetes, {
    label: "Has pre-diabetes",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(risk_score_adjusted, {
    label: "Diabetes risk score (0-10)",
    type: 1001,
    is_reportable: 1,
    is_bi_obj: 1
});

#doc(has_diabetes, {
    txt: "Diabetes defined by: ICD diagnosis, diabetes medication, HbA1c ≥6.5%, fasting glucose ≥7.0 mmol/L, or 2h-OGTT ≥11.1 mmol/L",
    cite: "ada_diabetes_2024"
});

#doc(has_prediabetes, {
    txt: "Pre-diabetes: HbA1c 5.7-6.4%, fasting glucose 5.6-6.9 mmol/L, or 2h-OGTT 7.8-11.0 mmol/L",
    cite: "ada_diabetes_2024"
});
```

---

## Example 4: Medication Reconciliation

Tracking medication adherence and interactions.

### Ruleblock: `med_recon.prb`

```javascript
#define_ruleblock(med_recon, {
    description: "Medication reconciliation for CKD patients",
    is_active: 2,
    version: "1.0",
    target_table: "rout_med_recon",
    environment: "PROD"
});

// ==================
// Bind Context
// ==================
ckd_stage => rout_ckd.ckd_stage.val.bind();
egfr => rout_ckd.egfr_last.val.bind();
is_diabetic => rout_dm.has_diabetes.val.bind();

// ==================
// Functional Statements
// ==================

// Renoprotective medications
acei => eadv.rx_[enalapril,ramipril,perindopril].dt.max();
arb => eadv.rx_[irbesartan,candesartan,telmisartan].dt.max();
sglt2i => eadv.rx_[empagliflozin,dapagliflozin,canagliflozin].dt.max();

// Potentially nephrotoxic
nsaid => eadv.rx_[ibuprofen,diclofenac,naproxen].dt.max();
metformin => eadv.rx_metformin.dt.max();

// Other key meds
statin => eadv.rx_[atorvastatin,rosuvastatin,simvastatin].dt.max();
aspirin => eadv.rx_aspirin.dt.max();

// ==================
// Conditional Statements
// ==================

// On RAAS blockade
on_raas_blockade :
    { acei!? and acei > sysdate-90 => 1 },
    { arb!? and arb > sysdate-90 => 1 },
    { => 0 };

// On SGLT2i
on_sglt2i : { sglt2i!? and sglt2i > sysdate-90 => 1 }, { => 0 };

// Needs RAAS blockade?
needs_raas :
    { ckd_stage >= 1 and is_diabetic = 1 and on_raas_blockade = 0 => 1 },  // DM+CKD
    { ckd_stage >= 3 and on_raas_blockade = 0 => 1 },                      // CKD 3+
    { => 0 };

// Needs SGLT2i?
needs_sglt2i :
    { ckd_stage >= 2 and is_diabetic = 1 and on_sglt2i = 0 and egfr >= 20 => 1 },
    { => 0 };

// Medication concerns
nsaid_concern :
    { ckd_stage >= 3 and nsaid!? and nsaid > sysdate-180 => 1 },
    { => 0 };

metformin_concern :
    { egfr < 30 and metformin!? and metformin > sysdate-90 => 1 },
    { => 0 };

// Statin indicated
needs_statin :
    { ckd_stage >= 3 and statin? => 1 },
    { => 0 };

// ==================
// Attributes
// ==================

#define_attribute(on_raas_blockade, {
    label: "On ACEi or ARB",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(needs_raas, {
    label: "RAAS blockade indicated",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});

#define_attribute(nsaid_concern, {
    label: "NSAID use in CKD (caution)",
    type: 1004,
    is_reportable: 1,
    is_bi_obj: 1
});
```

---

## Common Patterns Reference

### Pattern: Binding Multiple Variables

```javascript
// Get entire patient context from global ruleblock
age => rout_global.age.val.bind();
sex => rout_global.sex.val.bind();
location => rout_global.location.val.bind();
active_patient => rout_global.is_active.val.bind();
```

### Pattern: Time-Windowed Aggregates

```javascript
// Minimum creatinine in last year (baseline)
cr_min_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).min();

// Maximum creatinine in last year (peak)
cr_max_1yr => eadv.lab_bld_creatinine.val.where(dt > sysdate-365).max();

// AKI detection (creatinine doubled in past year)
aki_last_year : { cr_max_1yr >= cr_min_1yr * 2 => 1 }, { => 0 };
```

### Pattern: Multi-Source Data Fusion

```javascript
// Get blood pressure from either device or manual entry
sbp => eadv.[bp_device_systolic,bp_manual_systolic]._.lastdv();
dbp => eadv.[bp_device_diastolic,bp_manual_diastolic]._.lastdv();
```

### Pattern: Risk Score Accumulation

```javascript
// Base score
risk_base : { condition => 1 }, { => 0 };

// Add factors
risk_with_age : { risk_base = 1 and age >= 65 => risk_base + 1 }, { => risk_base };
risk_with_dm : { risk_with_age >= 1 and is_diabetic = 1 => risk_with_age + 2 }, { => risk_with_age };
risk_with_ckd : { risk_with_dm >= 1 and ckd_stage >= 3 => risk_with_dm + 2 }, { => risk_with_dm };

// Final score
risk_total : { risk_with_ckd => risk_with_ckd };
```

### Pattern: Date Comparison for Freshness

```javascript
// Get test date
hb_dt => eadv.lab_bld_haemoglobin.dt.max();

// Categorize by freshness
hb_freshness :
    { hb_dt > sysdate-90 => 1 },       // Recent (< 3 months)
    { hb_dt > sysdate-180 => 2 },      // Moderate (3-6 months)
    { hb_dt > sysdate-365 => 3 },      // Old (6-12 months)
    { hb_dt!? => 4 },                  // Very old (>1 year)
    { => 5 };                          // Never tested
```

### Pattern: Presence of Any in a Group

```javascript
// Has ANY cardiovascular disease diagnosis
has_cvd : { eadv.[icd_I21%,icd_I25%,icd_I63%,icd_I50%].dt.max()!? => 1 }, { => 0 };
```

### Pattern: Conditional Function Application

```javascript
aki_icd_dt => eadv.icd_N17%.dt.max();
cr_peak_dt => eadv.lab_bld_creatinine.dt.max();

// Get earliest AKI indicator (if both exist)
aki_first :
    { aki_icd_dt!? and cr_peak_dt!? => least_date(aki_icd_dt, cr_peak_dt) },
    { aki_icd_dt!? => aki_icd_dt },
    { cr_peak_dt!? => cr_peak_dt };
```

---

## Cookbook: Quick Recipes

### Recipe: "Get last 3 values of a lab"

```javascript
// Method: Use row_number windowing (implementation-specific)
// Typically requires separate statements for each position

hb_1 => eadv.lab_bld_haemoglobin.val.last();      // Most recent
hb_dt_1 => eadv.lab_bld_haemoglobin.dt.max();

// For 2nd and 3rd most recent, need database-specific functions
// Consult your Picorules compiler documentation
```

### Recipe: "Detect value trending up/down"

```javascript
cr_current => eadv.lab_bld_creatinine.val.last();
cr_6mo_ago => eadv.lab_bld_creatinine.val.where(dt between sysdate-210 and sysdate-150).last();

cr_trending_up : { cr_current > cr_6mo_ago * 1.2 => 1 }, { => 0 };
```

### Recipe: "Check if any test in group is abnormal"

```javascript
hb_last => eadv.lab_bld_haemoglobin.val.last();
cr_last => eadv.lab_bld_creatinine.val.last();
k_last => eadv.lab_bld_potassium.val.last();

any_abnormal :
    { hb_last < 120 => 1 },
    { cr_last > 120 => 1 },
    { k_last < 3.5 or k_last > 5.5 => 1 },
    { => 0 };
```

### Recipe: "Create urgency flag based on multiple criteria"

```javascript
priority :
    { egfr < 15 => 4 },                                    // Critical
    { egfr < 30 or hb < 80 => 3 },                        // Urgent
    { egfr < 45 or (hb < 100 and ckd >= 3) => 2 },       // Soon
    { egfr < 60 or needs_workup = 1 => 1 },               // Routine
    { => 0 };                                              // None
```

### Recipe: "Calculate days since last visit"

```javascript
last_visit_dt => eadv.enc_outpatient.dt.max();

days_since_visit :
    { last_visit_dt!? => sysdate - last_visit_dt },
    { => 9999 };  // Never visited

is_lost_to_followup : { days_since_visit > 365 => 1 }, { => 0 };
```

---

## Next Steps

With these examples, you should be able to:
- ✅ Create complete ruleblocks for clinical scenarios
- ✅ Chain ruleblocks together
- ✅ Build comprehensive dashboards with Jinja2
- ✅ Apply common patterns to new problems

**Continue exploring:**
- Review existing ruleblocks in your repository
- Adapt these patterns to your clinical needs
- Build incrementally—start simple, add complexity
