# JavaScript Ember Skill for Claude Code

Expert-level Ember.js development skill for Claude Code with comprehensive patterns, best practices, and testing strategies.

## Overview

This skill provides Claude with deep knowledge of modern Ember.js development using Ember Octane conventions. It covers:

- **Glimmer Components** - Modern component architecture with tracked properties
- **Routing** - Advanced routing patterns, guards, and data loading
- **Ember Data** - Models, adapters, serializers, and relationships
- **Testing** - Component, route, and acceptance testing with QUnit and Mirage
- **Performance** - Optimization strategies for rendering and data loading
- **Advanced Patterns** - Contextual components, resources, modifiers, and TypeScript

## Critical: context7 MCP Integration

**This skill requires the context7 MCP to be available.** The context7 MCP provides project-specific documentation that Claude must check before writing or editing any Ember code.

### How context7 MCP Works

Context7 is a Model Context Protocol (MCP) server that provides access to your project's documentation. When Claude Code uses this skill:

1. **Before writing code** - Claude queries context7 for relevant documentation
2. **Searches project docs** - context7 returns project-specific patterns and conventions  
3. **Applies documentation** - Claude follows the returned guidelines exactly
4. **Falls back** - If no docs exist, Claude uses this skill's general patterns

### What to Store in context7

Your context7 documentation should include:

- **Component patterns** - How your team structures Ember components
- **Routing conventions** - URL patterns, route naming, data loading strategies
- **State management** - When to use services vs. controllers vs. query params
- **Testing requirements** - Coverage expectations, testing patterns
- **API integration** - How to structure adapters and serializers
- **Styling approach** - CSS methodology, utility frameworks
- **TypeScript usage** - Type patterns, strictness levels
- **Deployment conventions** - Build configurations, environment handling

### Example context7 Documentation

```markdown
# Ember Component Conventions

## Component Structure
- All components must use TypeScript
- Use colocated components (component.ts + template.hbs in same directory)
- Every interactive element needs a data-test attribute

## Component Naming
- Use PascalCase for component class names
- Use kebab-case for component folders and templates
- Prefix shared components with "ui-" (e.g., ui-button, ui-modal)

## Props and Arguments
- Use @arg syntax for all arguments
- Document all @arg with JSDoc comments
- Validate required arguments in constructor

## State Management
- Use @tracked for local component state only
- Use services for cross-component or persistent state
- Never use controllers for new features

## Lifecycle
- Always clean up subscriptions in willDestroy
- Use @cached for expensive computed properties
- Prefer custom modifiers over didInsert hooks
```

### Using context7 MCP in Practice

When you ask Claude: **"Create a user profile component"**

Claude will:
1. Query context7: "ember component patterns"
2. Query context7: "user profile" or "user components"
3. Read returned documentation
4. Generate code following your project's conventions
5. Include project-specific patterns (e.g., data-test attributes, service usage)
6. Match your TypeScript/JavaScript preferences
7. Apply your testing requirements

## Structure

```
javascript-ember/
├── SKILL.md                    # Main skill file with core patterns
└── references/
    ├── performance.md          # Performance optimization strategies
    ├── testing.md              # Comprehensive testing guide
    └── advanced-patterns.md    # Advanced Ember patterns
```

## Usage in Claude Code

When Claude Code encounters an Ember-related task, it will:

1. **Query context7 MCP** - Search for relevant project documentation
2. **Read returned docs** - Parse project-specific patterns and conventions
3. **Read SKILL.md** - Load general Ember patterns as fallback
4. **Reference detailed docs** - Check specific reference files as needed
5. **Generate code** - Follow project conventions first, then Octane best practices

### Example Workflow

**User request:** "Create a user-card component"

**Claude's process:**
1. Queries context7 MCP with: "ember component", "user component patterns"
2. Receives project docs about component structure, naming, props
3. Reads SKILL.md for Glimmer component patterns
4. Generates component matching project conventions
5. Includes project-required tests, types, and attributes

## Key Features

### Modern Ember (Octane+)
- Glimmer components with native classes
- Tracked properties for reactivity
- `@cached` decorators for performance
- Custom modifiers for DOM behavior
- Services for shared state

### Testing Strategies
- QUnit integration tests for components
- Mirage for API mocking
- Acceptance tests for full flows
- Page objects for complex interactions
- Factory helpers for test data

### Performance Optimization
- Virtual scrolling for large lists
- Request coalescing and caching
- Proper memory cleanup
- Bundle size optimization
- Ember Data query optimization

### TypeScript Support
- Full type safety for components
- Generic type utilities
- Service type definitions
- Strict tsconfig recommendations

## Installation for Claude Code

Add this skill to your Claude Code skills directory:

```bash
# Copy the entire javascript-ember directory
cp -r javascript-ember ~/.config/claude-code/skills/user/
```

## Triggers

Claude Code will use this skill when you ask for:

- "Write an Ember component"
- "Create an Ember route"
- "Add Ember Data model"
- "Test this Ember component"
- Any mention of: Glimmer, tracked properties, Ember Octane, handlebars templates

## Best Practices Enforced

1. **Always query context7 MCP first** before writing or editing code
2. **Follow project documentation** returned by context7 exactly
3. Use Glimmer components (not classic components)
4. Prefer tracked properties over computed properties
5. Use native JavaScript classes
6. Follow DDAU (Data Down, Actions Up)
7. Add data-test attributes for testing
8. Clean up resources in willDestroy
9. Use @cached for expensive computations
10. Implement proper error handling
11. Write integration tests for components

## Reference Quick Links

- **Performance**: See `references/performance.md` for optimization strategies
- **Testing**: See `references/testing.md` for testing patterns
- **Advanced**: See `references/advanced-patterns.md` for complex implementations

## Examples

### Component with context7 MCP awareness

When you ask: "Create a user profile component"

Claude will:
1. Query context7 MCP: "ember component patterns", "user profile"
2. Read returned project documentation
3. Read `SKILL.md` for Ember patterns
4. Generate a Glimmer component with:
   - Project-specific structure and naming
   - Required TypeScript types (if project uses TS)
   - Tracked properties following project patterns
   - Proper lifecycle management per project standards
   - data-test attributes matching project conventions
   - Integration test following project requirements

### Route with data loading

When you ask: "Create a dashboard route with parallel data loading"

Claude will:
1. Query context7 MCP: "ember routing", "data loading patterns"
2. Apply project-specific route structure
3. Use project's preferred data loading approach
4. Implement error handling per project standards
5. Add loading and error states as required
6. Include route tests matching project patterns

### Editing existing code

When you ask: "Update the login form to add email validation"

Claude will:
1. Query context7 MCP: "form validation", "email validation"
2. Review project's validation patterns
3. Check for existing validation utilities
4. Apply changes matching existing code style
5. Update tests according to project requirements

## Maintenance

Update this skill when:
- Ember releases new major versions
- New patterns emerge in the community
- Project-specific conventions change
- Team feedback suggests improvements

## License

MIT - Adapt this skill to your team's needs

## Contributing

Feel free to:
- Add new patterns to references/
- Update SKILL.md with better examples
- Include TypeScript-specific patterns
- Add more advanced testing strategies
