# Quickstart: Implementation Planning Workflow

**Feature**: Implementation Planning Workflow  
**Version**: 1.0.0  
**Date**: 2025-01-27

## Overview

The Implementation Planning Workflow automates the generation of design artifacts from feature specifications, following the Speckit Constitution principles. It processes feature specifications through Phase 0 (research and clarification) and Phase 1 (design and contracts) with constitution compliance validation.

## Prerequisites

- Git repository with feature branch (naming pattern: `###-feature-name`)
- Existing `.specify/` directory structure
- Bash 5.0+ and standard Unix tools
- Feature specification at `/specs/[###-feature-name]/spec.md`
- GigaChat API access and credentials
- Ubuntu 22.04 server with Docker Compose
- Knowledge base at `/knowledge_base/` directory
- Ministry of Digital Development certificates installed
- Modern CSS framework (Tailwind CSS recommended)

## Quick Start

### 1. Initialize the Workflow

```bash
# Ensure you're on a feature branch
git checkout -b 001-my-feature

# Run the setup script
.specify/scripts/bash/setup-plan.sh --json
```

**Expected Output**:
```json
{
  "FEATURE_SPEC": "/path/to/specs/001-my-feature/spec.md",
  "IMPL_PLAN": "/path/to/specs/001-my-feature/plan.md",
  "SPECS_DIR": "/path/to/specs/001-my-feature",
  "BRANCH": "001-my-feature",
  "HAS_GIT": "true"
}
```

### 2. Execute Phase 0: Research

The workflow automatically:
- Identifies NEEDS CLARIFICATION items in the feature specification
- Generates research tasks for each unknown
- Creates `research.md` with resolved clarifications

**Manual Step**: Review and validate `research.md` to ensure all clarifications are resolved.

### 3. Execute Phase 1: Design

The workflow automatically generates:
- `data-model.md` - Entity definitions and relationships
- `contracts/` - API specifications (OpenAPI/GraphQL)
- `quickstart.md` - Usage documentation

**Manual Step**: Review generated artifacts for completeness and accuracy.

### 4. Update Agent Context

```bash
# Update AI agent context with new technology choices
.specify/scripts/bash/update-agent-context.sh cursor-agent
```

## Workflow Phases

### Phase 0: Research & Clarification

**Purpose**: Resolve all technical uncertainties before design decisions

**Inputs**:
- Feature specification (`spec.md`)
- Constitution compliance requirements

**Process**:
1. Extract NEEDS CLARIFICATION items from specification
2. Generate research tasks for each unknown
3. Research technology choices and best practices
4. Document decisions and rationale

**Outputs**:
- `research.md` - Resolved clarifications and technical decisions

**Validation**:
- All NEEDS CLARIFICATION items resolved
- Clear rationale for each decision
- Alternatives considered and documented

### Phase 1: Design & Contracts

**Purpose**: Generate concrete design artifacts based on research

**Inputs**:
- Feature specification (`spec.md`)
- Research document (`research.md`)

**Process**:
1. Extract entities and relationships → `data-model.md`
2. Generate API contracts from requirements → `contracts/`
3. Create usage documentation → `quickstart.md`
4. Update agent context with technology choices

**Outputs**:
- `data-model.md` - Entity definitions and validation rules
- `contracts/` - API specifications and schemas
- `quickstart.md` - Usage documentation
- Updated agent context files

**Validation**:
- Data model covers all entities from specification
- API contracts match functional requirements
- Quickstart provides clear usage instructions

## Constitution Compliance

The workflow enforces Speckit Constitution v1.0.0 compliance:

### Gates Checked

- **Specification-First**: Complete spec with zero implementation details
- **Template-Driven**: Using standard templates
- **Independent Testability**: User stories independently testable
- **Clarity**: Requirements testable and measurable
- **Phased Execution**: Prior phases completed

### Violation Handling

If constitution violations are detected:
1. Document in Complexity Tracking section
2. Provide specific justification for each violation
3. List simpler alternatives considered and rejected
4. Explain why alternatives were insufficient

## File Structure

```
specs/[###-feature-name]/
├── spec.md              # Input: Feature specification
├── plan.md              # Generated: Implementation plan
├── research.md          # Generated: Phase 0 output
├── data-model.md        # Generated: Phase 1 output
├── quickstart.md        # Generated: Phase 1 output
└── contracts/           # Generated: Phase 1 output
    └── workflow-api.yaml # API specification
```

## Error Handling

### Common Issues

**Issue**: "Not on a feature branch"
```bash
# Solution: Create feature branch with proper naming
git checkout -b 001-feature-name
```

**Issue**: "Feature specification not found"
```bash
# Solution: Ensure spec.md exists in specs/[###-feature-name]/
ls specs/001-feature-name/spec.md
```

**Issue**: "Constitution violations detected"
- Review violations in plan.md
- Add justifications to Complexity Tracking section
- Ensure all gates pass or violations are properly documented

### Validation Steps

1. **Pre-execution**:
   - Verify feature branch naming
   - Confirm spec.md exists and is complete
   - Check constitution compliance

2. **Post Phase 0**:
   - Review research.md for completeness
   - Ensure all NEEDS CLARIFICATION resolved
   - Validate technical decisions

3. **Post Phase 1**:
   - Verify all artifacts generated
   - Check data model completeness
   - Validate API contract accuracy
   - Confirm agent context updated

## Advanced Usage

### GigaChat Integration

The system integrates with GigaChat for AI-powered appeal analysis and response generation:

**GigaChat Configuration**:
```javascript
const gigaChatConfig = {
  clientId: '4564de21-0d1d-4524-b4e7-cc807691ea32',
  scope: 'GIGACHAT_API_PERS',
  authKey: 'NDU2NGRlMjEtMGQxZC00NTI0LWI0ZTctY2M4MDc2OTFlYTMyOmU4YmVhZGUwLWEzY2MtNDIzZS05N2Q3LWQxOGY4ODcyMmQzMw==',
  authEndpoint: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
  apiEndpoint: 'https://gigachat.devices.sberbank.ru/',
  tokenValidity: 30 * 60 * 1000 // 30 minutes
};
```

**Authentication Flow**:
```javascript
const gigaChatService = {
  async getAccessToken() {
    const response = await fetch(gigaChatConfig.authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': crypto.randomUUID(),
        'Authorization': `Basic ${gigaChatConfig.authKey}`
      },
      body: new URLSearchParams({
        scope: gigaChatConfig.scope
      })
    });
    const data = await response.json();
    return data.access_token;
  },

  async analyzeAppeal(text) {
    const token = await this.getAccessToken();
    const response = await fetch('/api/gigachat/analyze', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text, language: 'ru' })
    });
    return response.json();
  },
  
  async generateResponse(query, knowledgeContext) {
    const token = await this.getAccessToken();
    const response = await fetch('/api/gigachat/generate-response', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        query, 
        knowledge_context: knowledgeContext,
        tone: 'официальный'
      })
    });
    return response.json();
  }
};
```

**Important**: Install Ministry of Digital Development certificates before using GigaChat API!

### Knowledge Base Integration

The system uses RAG (Retrieval-Augmented Generation) with the existing knowledge base:

```javascript
// Example knowledge base search
const searchKnowledge = async (query, categories = []) => {
  const response = await fetch('/api/knowledge-base/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query, 
      categories,
      limit: 10 
    })
  });
  return response.json();
};
```

### Modern Responsive UI Design

All web interfaces must implement modern responsive design:

**Design Requirements**:
- **Mobile-first approach** with responsive breakpoints
- **Modern CSS framework** (Tailwind CSS recommended)
- **Accessibility compliance** (WCAG 2.1 AA)
- **Dark/light theme support** with system preference detection
- **Progressive Web App** (PWA) capabilities
- **Fast loading** with optimized assets and lazy loading
- **Smooth animations** using CSS transitions and transforms

**Responsive Breakpoints**:
```css
/* Mobile First Approach */
.container {
  @apply px-4 mx-auto;
  max-width: 100%;
}

@media (min-width: 768px) {
  .container { @apply px-6; }
}

@media (min-width: 1024px) {
  .container { @apply px-8; max-width: 1200px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1400px; }
}
```

**Theme System**:
```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --border-radius: 0.5rem;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  --color-background: #0f172a;
  --color-text: #f1f5f9;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
}
```

### Server Deployment

The system is designed for deployment on the existing Ubuntu server:

**Server Specifications**:
- OS: Ubuntu Server 22.04 LTS
- CPU: Intel N100
- RAM: 16 GB
- Storage: 512 GB SSD
- Access: SSH port 2222, domain vadimevgrafov.ru

**Docker Compose Stack**:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - GIGACHAT_CLIENT_ID=4564de21-0d1d-4524-b4e7-cc807691ea32
      - GIGACHAT_AUTH_KEY=NDU2NGRlMjEtMGQxZC00NTI0LWI0ZTctY2M4MDc2OTFlYTMyOmU4YmVhZGUwLWEzY2MtNDIzZS05N2Q3LWQxOGY4ODcyMmQzMw==
      - GIGACHAT_SCOPE=GIGACHAT_API_PERS
      - KNOWLEDGE_BASE_PATH=/app/knowledge_base
    volumes:
      - ./knowledge_base:/app/knowledge_base:ro
      - ./certs:/app/certs:ro  # Ministry certificates
    networks:
      - nginx-net
  
  frontend-user:
    build: ./frontend/user
    environment:
      - VITE_API_URL=https://api.vadimevgrafov.ru
      - VITE_APP_NAME=Smart Assistant for Citizen Appeals
    networks:
      - nginx-net
  
  frontend-operator:
    build: ./frontend/operator
    environment:
      - VITE_API_URL=https://api.vadimevgrafov.ru
      - VITE_APP_NAME=Operator Dashboard
    networks:
      - nginx-net
```

**Certificate Installation**:
```bash
# Install Ministry of Digital Development certificates
sudo mkdir -p /usr/local/share/ca-certificates/mindigital
sudo cp mindigital-certs/*.crt /usr/local/share/ca-certificates/mindigital/
sudo update-ca-certificates
```

### Custom Technology Choices

To specify custom technology choices, modify the Technical Context section in `plan.md`:

```markdown
**Language/Version**: Node.js 18, TypeScript 5.0
**Primary Dependencies**: Express, GigaChat API, PostgreSQL, Redis, Tailwind CSS
**Storage**: PostgreSQL 15 + Redis 7
**AI Service**: GigaChat (российская AI-модель)
**Knowledge Base**: RAG with existing knowledge_base/ directory
**UI Framework**: React 18 + Tailwind CSS + Headless UI
**Design System**: Modern responsive design with mobile-first approach
**Testing**: Jest, Supertest, Testing Library
**Target Platform**: Ubuntu 22.04 server (vadimevgrafov.ru)
**Security**: Ministry of Digital Development certificates required
```

### UI/UX Implementation Guidelines

**Component Structure**:
```typescript
// Example responsive component
interface ResponsiveComponentProps {
  children: React.ReactNode;
  className?: string;
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

const ResponsiveComponent: React.FC<ResponsiveComponentProps> = ({
  children,
  className = '',
  breakpoint = 'mobile'
}) => {
  const baseClasses = 'w-full';
  const responsiveClasses = {
    mobile: 'px-4 py-2 text-sm',
    tablet: 'px-6 py-3 text-base',
    desktop: 'px-8 py-4 text-lg'
  };
  
  return (
    <div className={`${baseClasses} ${responsiveClasses[breakpoint]} ${className}`}>
      {children}
    </div>
  );
};
```

**Theme Provider**:
```typescript
// Theme context for dark/light mode
const ThemeContext = createContext<{
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}>({
  theme: 'auto',
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') {
      root.setAttribute('data-theme', 
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Multiple Agent Support

The workflow automatically detects and updates the appropriate agent context:

- Cursor: Updates `.cursor/` configuration
- VS Code: Updates `.vscode/` settings
- Other: Updates generic context files

### Batch Processing

To process multiple features:

```bash
for branch in $(git branch | grep '^[[:space:]]*[0-9]' | sed 's/^[[:space:]]*//'); do
  git checkout "$branch"
  .specify/scripts/bash/setup-plan.sh --json
  # Execute workflow phases...
done
```

## Troubleshooting

### Debug Mode

Enable verbose output for debugging:

```bash
set -x  # Enable bash debug mode
.specify/scripts/bash/setup-plan.sh --json
set +x  # Disable debug mode
```

### Log Files

Check for error logs in:
- Git output (for branch validation)
- Script stderr (for execution errors)
- Generated artifacts (for validation errors)

### Recovery

If workflow fails mid-execution:
1. Check error messages and fix issues
2. Re-run from the failed phase
3. Validate all artifacts before proceeding
4. Update agent context if needed

## Support

For issues or questions:
1. Check this quickstart guide
2. Review constitution compliance
3. Validate file structure and naming
4. Check error messages and logs