<!--
SYNC IMPACT REPORT
==================
Version Change: NONE → 1.0.0
Change Type: Initial constitution establishment
Rationale: First formalization of Speckit governance principles derived from existing templates and workflows

Modified Principles: N/A (initial creation)
Added Sections:
  - All core principles (I-V)
  - Development Workflow section
  - Quality Standards section
  - Governance section

Removed Sections: N/A

Templates Status:
  ✅ .specify/templates/plan-template.md - Updated: Added concrete Constitution Check gates with v1.0.0 compliance checklist
  ✅ .specify/templates/spec-template.md - Reviewed, aligns with principles (no changes needed)
  ✅ .specify/templates/tasks-template.md - Reviewed, aligns with principles (no changes needed)
  ✅ .cursor/commands/*.md - Reviewed, no agent-specific references requiring updates

Follow-up TODOs:
  - RATIFICATION_DATE marked as TODO - needs to be set to actual project start date or constitution adoption date
  - Consider adding explicit versioning requirements for artifacts in future amendments
-->

# Speckit Constitution

## Core Principles

### I. Specification-First

Every feature MUST begin with a complete specification before any planning or implementation work begins. Specifications MUST focus exclusively on WHAT users need and WHY, never HOW to implement. Specifications MUST be written for business stakeholders, not developers, and contain zero implementation details (no languages, frameworks, APIs, code structure, or technical architecture).

**Rationale**: Clear requirements prevent costly rework and ensure all stakeholders understand the feature before resources are committed. Technology-agnostic specs enable better design decisions and prevent premature optimization.

### II. Template-Driven Workflow

All feature artifacts (specifications, plans, tasks, checklists) MUST follow standardized templates. Templates MUST be versioned and maintained in `.specify/templates/`. Deviations from templates require explicit justification and constitutional amendment if pattern becomes recurring.

**Rationale**: Standardization ensures consistency across features, reduces cognitive load, enables automation, and makes artifacts easier to review and maintain. Templates capture accumulated best practices and prevent repeated mistakes.

### III. Independent Testability (NON-NEGOTIABLE)

User stories MUST be independently testable and deliverable as viable MVP increments. Each story MUST be implementable, testable, and deployable without dependencies on other stories in the same feature. Stories MUST be prioritized (P1, P2, P3, etc.) with P1 representing the minimal viable product.

**Rationale**: Independent stories enable iterative delivery, reduce risk, allow parallel development, and ensure that partial feature completion still delivers user value. This is the foundation of agile delivery and risk mitigation.

### IV. Clarity and Measurability

All requirements MUST be testable, unambiguous, and measurable. Success criteria MUST include specific metrics (time, percentage, count, rate) and be verifiable without implementation knowledge. Vague language ("should", "might", "probably") MUST be replaced with clear MUST/SHOULD/MAY directives with explicit rationale.

**Rationale**: Ambiguous requirements lead to misaligned implementations and failed acceptance. Measurable criteria enable objective validation and prevent scope creep.

### V. Phased Execution Discipline

Feature development MUST follow the mandatory phase sequence:

1. **Specify** (`/speckit.specify`): Create technology-agnostic specification
2. **Clarify** (`/speckit.clarify`, optional): Resolve ambiguities with stakeholders
3. **Plan** (`/speckit.plan`): Generate technical design and architecture
4. **Tasks** (`/speckit.tasks`): Break down into executable task list
5. **Implement**: Execute tasks with test-first approach

Phases MUST NOT be skipped. Each phase MUST be complete and validated before proceeding to the next. Research (Phase 0 of planning) MUST resolve all technical uncertainties before design decisions are made.

**Rationale**: The phase sequence ensures progressively refined understanding and prevents implementation details from contaminating requirements. Enforced gates prevent premature work and ensure proper foundation.

## Development Workflow

### Workflow Requirements

- Feature branches MUST follow naming convention: `###-feature-name` (three-digit sequential number)
- All feature artifacts MUST be stored in `specs/###-feature-name/` directory structure
- Constitution compliance MUST be verified at Phase 0 (outline) and re-verified after Phase 1 (design)
- Complexity violations (e.g., exceeding simplicity limits) MUST be explicitly justified in plan.md with documented alternatives rejected
- Scripts in `.specify/scripts/bash/` MUST be used for workflow automation (feature creation, planning setup, context updates)

### Quality Gates

- **Specification Gate**: No [NEEDS CLARIFICATION] markers beyond maximum of 3 (prioritized by scope > security > UX); all must be testable
- **Planning Gate**: All NEEDS CLARIFICATION resolved; constitution check passed or violations justified
- **Design Gate**: Data models defined; API contracts generated; quickstart.md validated
- **Task Gate**: Tasks organized by user story; dependencies explicit; parallel opportunities marked

## Quality Standards

### Specification Quality

Specifications MUST:
- Contain zero implementation details (no tech stack, frameworks, libraries, architecture)
- Define user scenarios with Given-When-Then acceptance criteria
- List functional requirements in testable FR-### format
- Define measurable, technology-agnostic success criteria
- Identify edge cases and error scenarios
- Limit to maximum 3 [NEEDS CLARIFICATION] markers (resolved via `/speckit.clarify`)

### Plan Quality

Implementation plans MUST:
- Document technical context (language, dependencies, platform, constraints)
- Include constitution compliance check with gate evaluation
- Provide Phase 0 research.md resolving all technical uncertainties
- Provide Phase 1 design artifacts: data-model.md, contracts/, quickstart.md
- Select and justify project structure (single/web/mobile) with concrete paths
- Track complexity violations in explicit justification table

### Task Quality

Task lists MUST:
- Organize tasks by user story (US1, US2, US3) to enable independent implementation
- Mark parallel-safe tasks with [P] prefix
- Include exact file paths in task descriptions
- Define blocking foundational phase before any user story work
- Provide execution strategy: MVP-first, incremental delivery, or parallel team
- When tests are included: mark test tasks as OPTIONAL and enforce test-first (write tests, verify failure, then implement)

## Governance

This constitution supersedes all other practices, templates, and documentation. Amendments require:

1. Documented rationale for change
2. Impact analysis on existing templates, commands, and workflows
3. Migration plan for in-flight features
4. Version increment following semantic versioning:
   - **MAJOR**: Backward-incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

All feature specifications, plans, and tasks MUST verify compliance with current constitution version. Constitution violations MUST be justified in writing with:
- Specific principle violated
- Why violation is necessary for current feature
- Simpler alternatives considered and rejected with rationale

Templates in `.specify/templates/` MUST remain synchronized with constitutional principles. Template updates MUST reference constitution version they comply with.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Set to project start or constitution adoption date | **Last Amended**: 2025-10-22
