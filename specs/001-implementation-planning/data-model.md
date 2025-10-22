# Data Model: Implementation Planning Workflow

**Feature**: Implementation Planning Workflow  
**Phase**: 1 - Design & Contracts  
**Date**: 2025-01-27

## Core Entities

### FeatureSpecification
**Purpose**: Represents a complete feature specification with user stories and requirements

**Attributes**:
- `branch_name` (string): Feature branch name (e.g., "001-feature-name")
- `created_date` (date): Specification creation date
- `status` (enum): Draft, Review, Approved
- `user_stories` (array): List of UserStory entities
- `functional_requirements` (array): List of FunctionalRequirement entities
- `success_criteria` (array): List of SuccessCriterion entities
- `edge_cases` (array): List of EdgeCase entities

**Validation Rules**:
- Branch name must match pattern `###-feature-name`
- Must have at least one P1 priority user story
- All requirements must be testable and measurable
- Maximum 3 NEEDS CLARIFICATION markers allowed

**State Transitions**:
- Draft → Review (when all requirements complete)
- Review → Approved (when stakeholders approve)

### UserStory
**Purpose**: Represents an independently testable user journey

**Attributes**:
- `id` (string): Unique identifier (e.g., "US1", "US2")
- `title` (string): Brief descriptive title
- `priority` (enum): P1, P2, P3, P4 (P1 = highest priority)
- `description` (string): Plain language description
- `independent_test` (string): How this can be tested independently
- `acceptance_scenarios` (array): List of Given-When-Then scenarios
- `rationale` (string): Why this priority level

**Validation Rules**:
- Must be independently testable and deliverable
- Priority must be assigned
- Must have at least one acceptance scenario
- Description must be in plain language (no technical jargon)

### FunctionalRequirement
**Purpose**: Represents a specific system capability requirement

**Attributes**:
- `id` (string): Unique identifier (e.g., "FR-001")
- `description` (string): Specific capability description
- `clarity_status` (enum): Clear, NeedsClarification
- `clarification_note` (string): Details about what needs clarification

**Validation Rules**:
- Must use MUST/SHOULD/MAY directive language
- Must be testable without implementation knowledge
- NeedsClarification items must have clarification_note

### SuccessCriterion
**Purpose**: Represents a measurable outcome for the feature

**Attributes**:
- `id` (string): Unique identifier (e.g., "SC-001")
- `metric` (string): Specific measurable metric
- `target_value` (string): Target value for the metric
- `measurement_method` (string): How the metric will be measured

**Validation Rules**:
- Must be technology-agnostic
- Must include specific metrics (time, percentage, count, rate)
- Must be verifiable without implementation knowledge

### ImplementationPlan
**Purpose**: Represents the technical implementation plan for a feature

**Attributes**:
- `feature_spec_id` (string): Reference to FeatureSpecification
- `technical_context` (object): TechnicalContext entity
- `constitution_check` (object): ConstitutionCheck entity
- `project_structure` (object): ProjectStructure entity
- `complexity_tracking` (array): List of ComplexityViolation entities

**Validation Rules**:
- Must reference valid FeatureSpecification
- Constitution check must pass or violations justified
- Technical context must be complete or marked as NEEDS CLARIFICATION

### TechnicalContext
**Purpose**: Represents the technical environment and constraints

**Attributes**:
- `language_version` (string): Programming language and version
- `primary_dependencies` (array): List of main dependencies
- `storage` (string): Data storage solution
- `testing_framework` (string): Testing framework to use
- `target_platform` (string): Deployment platform
- `project_type` (enum): single, web, mobile
- `performance_goals` (string): Performance requirements
- `constraints` (string): Technical constraints
- `scale_scope` (string): Expected scale and scope
- `ai_service` (string): AI service for natural language processing (GigaChat)
- `server_infrastructure` (object): Server configuration details
- `knowledge_base_path` (string): Path to knowledge base directory

**Validation Rules**:
- All fields must be specified or marked as NEEDS CLARIFICATION
- Project type determines source structure
- Performance goals must be measurable

### ConstitutionCheck
**Purpose**: Represents compliance validation with Speckit Constitution

**Attributes**:
- `specification_first` (boolean): Has complete spec with zero implementation details
- `template_driven` (boolean): Using standard templates
- `independent_testability` (boolean): User stories are independently testable
- `clarity` (boolean): Requirements are testable and measurable
- `phased_execution` (boolean): Prior phases completed
- `violations` (array): List of ConstitutionViolation entities

**Validation Rules**:
- All gates must pass or violations must be justified
- Violations must include specific principle violated and justification

### ConstitutionViolation
**Purpose**: Represents a violation of constitutional principles

**Attributes**:
- `principle` (string): Which constitutional principle violated
- `justification` (string): Why violation is necessary
- `alternatives_rejected` (string): Simpler alternatives considered and rejected
- `rationale` (string): Why alternatives were insufficient

**Validation Rules**:
- Must include all required justification fields
- Justification must be specific to current feature
- Alternatives must be genuinely simpler

### ResearchDocument
**Purpose**: Represents resolved technical clarifications and decisions

**Attributes**:
- `feature_spec_id` (string): Reference to FeatureSpecification
- `research_tasks` (array): List of ResearchTask entities
- `technical_decisions` (array): List of TechnicalDecision entities
- `resolved_clarifications` (array): List of resolved NEEDS CLARIFICATION items

**Validation Rules**:
- Must resolve all NEEDS CLARIFICATION items from specification
- Each research task must have clear decision and rationale
- Technical decisions must be justified

### ResearchTask
**Purpose**: Represents a specific research question and its resolution

**Attributes**:
- `question` (string): Research question or unknown to resolve
- `decision` (string): What was chosen
- `rationale` (string): Why this choice was made
- `alternatives_considered` (array): Other options evaluated
- `impact` (string): Impact of this decision

### GigaChatService
**Purpose**: Represents the AI service integration for analyzing appeals and generating responses

**Attributes**:
- `client_id` (string): GigaChat Client ID (4564de21-0d1d-4524-b4e7-cc807691ea32)
- `scope` (string): API scope (GIGACHAT_API_PERS)
- `auth_key` (string): Authorization key for Basic auth
- `auth_endpoint` (string): OAuth endpoint (https://ngw.devices.sberbank.ru:9443/api/v2/oauth)
- `api_endpoint` (string): API endpoint (https://gigachat.devices.sberbank.ru/)
- `access_token` (string): Current access token
- `token_expires_at` (datetime): Token expiration time
- `model_version` (string): GigaChat model version to use
- `max_tokens` (number): Maximum tokens per request
- `temperature` (number): Response creativity level (0-1)
- `timeout` (number): Request timeout in seconds
- `certificates_installed` (boolean): Ministry certificates installation status

**Methods**:
- `getAccessToken()` - Obtain new access token using Basic auth
- `refreshTokenIfNeeded()` - Refresh token if expired
- `analyzeAppeal(text, context)` - Analyze citizen appeal for category, priority, sentiment
- `generateResponse(query, knowledgeContext)` - Generate response based on knowledge base
- `classifyCategory(text)` - Classify appeal into ЖКХ categories
- `detectSentiment(text)` - Detect emotional tone of appeal
- `validateCertificates()` - Verify Ministry certificates are installed

### UITheme
**Purpose**: Represents the user interface design system and theming

**Attributes**:
- `name` (string): Theme name (light, dark, auto)
- `primary_color` (string): Primary brand color
- `secondary_color` (string): Secondary brand color
- `accent_color` (string): Accent color for highlights
- `font_family` (string): Primary font family
- `breakpoints` (object): Responsive breakpoints (mobile, tablet, desktop)
- `spacing_scale` (array): Spacing scale for consistent margins/padding
- `border_radius` (string): Default border radius
- `shadow_levels` (array): Shadow depth levels
- `animation_duration` (number): Default animation duration in ms

**Methods**:
- `applyTheme(themeName)` - Apply specific theme
- `getResponsiveClass(breakpoint)` - Get responsive CSS class
- `getColorVariable(colorName)` - Get CSS custom property for color
- `isDarkMode()` - Check if dark mode is active
- `toggleTheme()` - Switch between light/dark themes

### ResponsiveDesign
**Purpose**: Represents responsive design configuration

**Attributes**:
- `mobile_breakpoint` (number): Mobile breakpoint in pixels (768px)
- `tablet_breakpoint` (number): Tablet breakpoint in pixels (1024px)
- `desktop_breakpoint` (number): Desktop breakpoint in pixels (1200px)
- `mobile_first` (boolean): Use mobile-first approach
- `grid_columns` (number): Number of grid columns (12)
- `container_max_width` (string): Maximum container width
- `gutter_size` (string): Grid gutter size

**Methods**:
- `getBreakpoint(width)` - Get current breakpoint for given width
- `isMobile(width)` - Check if width is mobile
- `isTablet(width)` - Check if width is tablet
- `isDesktop(width)` - Check if width is desktop
- `getGridClass(columns, breakpoint)` - Get responsive grid class

### KnowledgeBase
**Purpose**: Represents the structured knowledge base for RAG integration

**Attributes**:
- `base_path` (string): Path to knowledge base directory
- `documents_file` (string): Path to documents.jsonl
- `chunks_file` (string): Path to chunks.jsonl
- `manual_dir` (string): Path to manual/ directory
- `categories` (array): List of available categories
- `last_updated` (datetime): Last knowledge base update

**Methods**:
- `searchRelevantChunks(query, categories, limit)` - Search for relevant knowledge chunks
- `getDocumentById(doc_id)` - Retrieve specific document
- `getCategoryDocuments(category)` - Get all documents for category
- `updateKnowledgeBase()` - Refresh knowledge base from files

### ServerInfrastructure
**Purpose**: Represents the deployment server configuration

**Attributes**:
- `hostname` (string): Server hostname (pet)
- `os` (string): Operating system (Ubuntu 22.04 LTS)
- `cpu` (string): Processor (Intel N100)
- `ram` (string): Memory (16 GB)
- `storage` (string): Storage capacity (512 GB SSD)
- `ssh_port` (number): SSH access port (2222)
- `domain` (string): Primary domain (vadimevgrafov.ru)
- `docker_enabled` (boolean): Docker availability
- `nginx_proxy` (boolean): Nginx proxy configuration
- `ssl_enabled` (boolean): SSL certificate status

### TechnicalDecision
**Purpose**: Represents a specific technical choice made during research

**Attributes**:
- `decision` (string): What was decided
- `rationale` (string): Why this decision was made
- `impact` (string): Impact on the project
- `alternatives` (array): Other options considered

## Relationships

- FeatureSpecification (1) → (1) ImplementationPlan
- FeatureSpecification (1) → (1) ResearchDocument
- FeatureSpecification (1) → (*) UserStory
- FeatureSpecification (1) → (*) FunctionalRequirement
- FeatureSpecification (1) → (*) SuccessCriterion
- ImplementationPlan (1) → (1) TechnicalContext
- ImplementationPlan (1) → (1) ConstitutionCheck
- ConstitutionCheck (1) → (*) ConstitutionViolation
- ResearchDocument (1) → (*) ResearchTask
- ResearchDocument (1) → (*) TechnicalDecision

## Data Flow

1. **Input**: FeatureSpecification (from spec.md)
2. **Process**: ResearchDocument resolves all NEEDS CLARIFICATION items
3. **Generate**: ImplementationPlan with TechnicalContext and ConstitutionCheck
4. **Output**: Design artifacts (data-model.md, contracts/, quickstart.md)

## Validation Summary

All entities include appropriate validation rules to ensure:
- Data integrity and consistency
- Constitutional compliance
- Independent testability
- Measurable outcomes
- Clear decision tracking