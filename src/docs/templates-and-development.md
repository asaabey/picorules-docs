# Templates & Development Notes

Picorules outputs are surfaced through template packs that live alongside the ruleblocks. Understanding how templates reference clinical logic helps keep UI assets synchronized with backend data.

## Template Pack Structure

Templates live in `picodomain_template_pack/template_blocks/` and come in pairs:

- A `.json` file that declares metadata such as `name`, `description`, `related_ruleblock`, activity flags, and other dashboard properties.
- A `.txt` file that holds the HTML/CSS snippet rendered inside TKC dashboards.

Reusable frame templates provide consistent chrome:

- `__dashboard_header__.*` and `__dashboard_footer__.*` wrap dashboards with shared styles.
- `__frame_begin__.*` / `__frame_end__.*` wrap logical sections.
- `__graph_frame_begin__.*` / `__graph_frame_end__.*` define visualization containers.

Each template declares a `related_ruleblock` so the UI knows which `rout_*` table powers the view.

## Development Principles

1. **Active status** – `is_active: 2` is the standard flag for both ruleblocks and templates. Keep it aligned with deployment status.
2. **File extensions** – `.prb` for ruleblocks, `.json` + `.txt` for template pairs. The `deprecated ruleblock scripts/` directory only serves as historical reference.
3. **Git workflow** – The repository mirrors production rules/templates, with commits frequently labeled “Update repo with rules and templates as @YYYY-MM-DD”. Treat it as the source of truth when introducing new clinical logic.
4. **Change pattern** – When adding a template, create both files, follow the header/footer conventions, and double-check that `related_ruleblock` matches the `.prb` file you just touched.
5. **Documentation proximity** – Pair every new attribute with `#define_attribute()` and `#doc()` entries so metadata, cohort logic, and justifications remain in sync.

## Tooling Tie-In

The `extract_variables.py` script and the Picorule Sentry UI both read every `.prb` file, capturing:

- Ruleblock metadata, statement types, and counts.
- Variable dependencies (including cross-ruleblock `rout_*` bindings).
- Coverage of documented attributes vs intermediate calculations.

Maintaining consistent templates and directives means these tools always have accurate information for documentation sites like this one.
