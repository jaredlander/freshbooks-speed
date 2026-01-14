# JavaScript Code Review Reference

## Priority Focus
- Modern ES6+ syntax
- Type safety (TypeScript or JSDoc)
- Security (XSS, injection, prototype pollution)
- Async patterns and error handling

## Style and Idioms

### Prefer
```javascript
// Arrow functions for callbacks
const doubled = items.map(x => x * 2);
const filtered = items.filter(item => item.active);

// Destructuring
const { name, age } = user;
const [first, ...rest] = items;

// Template literals
const message = `Hello, ${name}!`;

// Spread operator
const combined = [...array1, ...array2];
const merged = { ...defaults, ...options };

// Optional chaining and nullish coalescing
const value = obj?.nested?.property ?? 'default';

// Array methods over loops
const sum = numbers.reduce((acc, n) => acc + n, 0);
const hasActive = items.some(item => item.active);

// const/let, never var
const PI = 3.14159;
let counter = 0;
```

### Avoid
```javascript
// var declarations
var x = 1;  // Use const or let

// Manual loops for simple transforms
const doubled = [];
for (let i = 0; i < items.length; i++) {
  doubled.push(items[i] * 2);
}
// Use: const doubled = items.map(x => x * 2);

// String concatenation
const message = 'Hello, ' + name + '!';
// Use: const message = `Hello, ${name}!`;

// Unnecessary function keyword
items.forEach(function(item) { ... });
// Use: items.forEach(item => { ... });

// Manual null checks when optional chaining works
const value = obj && obj.nested && obj.nested.property;
// Use: const value = obj?.nested?.property;
```

## Type Safety

### TypeScript (Preferred)
```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// Generics
function identity<T>(value: T): T {
  return value;
}

// Type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### JSDoc (Fallback)
```javascript
/**
 * @param {number} id
 * @param {Object} options
 * @param {string} options.name
 * @param {boolean} [options.active=true]
 * @returns {Promise<User|null>}
 */
async function getUser(id, options) {
  // ...
}

/** @type {string[]} */
const names = [];
```

### Flag Missing Types
- Function parameters and return types
- Exported functions and classes
- Complex data structures

## Security Checks

### Critical Vulnerabilities

**XSS (Cross-Site Scripting)**
```javascript
// BAD - vulnerable to XSS
element.innerHTML = userInput;
document.write(userInput);
eval(userInput);

// GOOD - sanitize or use safe methods
element.textContent = userInput;
element.innerText = userInput;
// Or use DOMPurify for HTML
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Injection Vulnerabilities**
```javascript
// BAD - SQL injection (if using template strings with DB)
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD - use parameterized queries
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);

// BAD - Command injection
const { exec } = require('child_process');
exec(`ls ${userInput}`);

// GOOD - use array syntax
const { execFile } = require('child_process');
execFile('ls', [userInput]);
```

**Prototype Pollution**
```javascript
// BAD - can modify Object.prototype
function merge(target, source) {
  for (let key in source) {
    target[key] = source[key];
  }
}

// GOOD - check for __proto__, constructor, prototype
function merge(target, source) {
  for (let key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key) &&
        !['__proto__', 'constructor', 'prototype'].includes(key)) {
      target[key] = source[key];
    }
  }
}
// Or use: Object.assign({}, target, source)
```

**RegEx Denial of Service (ReDoS)**
```javascript
// BAD - catastrophic backtracking
const regex = /^(a+)+$/;
regex.test(userInput);  // Can hang on 'aaaaaaaaaaaaaaaaaaaaaa!'

// GOOD - avoid nested quantifiers
const regex = /^a+$/;
```

**Insecure Randomness**
```javascript
// BAD - not cryptographically secure
const token = Math.random().toString(36);

// GOOD - use crypto
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
```

**Hardcoded Secrets**
```javascript
// BAD
const API_KEY = 'sk-abc123...';
const password = 'admin123';

// GOOD
const API_KEY = process.env.API_KEY;
```

## Async Patterns

### Prefer async/await
```javascript
// GOOD - clear error handling
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Parallel operations
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);
```

### Avoid callback hell
```javascript
// BAD - nested callbacks
getData(id, (err, data) => {
  if (err) return handleError(err);
  processData(data, (err, result) => {
    if (err) return handleError(err);
    saveResult(result, (err) => {
      if (err) return handleError(err);
    });
  });
});

// GOOD - async/await
try {
  const data = await getData(id);
  const result = await processData(data);
  await saveResult(result);
} catch (error) {
  handleError(error);
}
```

### Error Handling
```javascript
// Always handle promise rejections
async function main() {
  try {
    await riskyOperation();
  } catch (error) {
    console.error('Error:', error);
    // Don't swallow errors silently
  }
}

// Global handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});
```

## Performance Patterns

### Avoid Memory Leaks
```javascript
// BAD - leaked event listeners
element.addEventListener('click', handler);
// Need: element.removeEventListener('click', handler);

// GOOD - cleanup
function setupComponent(element) {
  const handler = () => { /* ... */ };
  element.addEventListener('click', handler);

  return () => {
    element.removeEventListener('click', handler);
  };
}
const cleanup = setupComponent(element);
// Later: cleanup();
```

### Debounce/Throttle Expensive Operations
```javascript
// BAD - runs on every keystroke
input.addEventListener('input', (e) => {
  expensiveSearchOperation(e.target.value);
});

// GOOD - debounce
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

input.addEventListener('input', debounce((e) => {
  expensiveSearchOperation(e.target.value);
}, 300));
```

### Use Efficient Data Structures
```javascript
// BAD - O(n) lookup
const items = ['a', 'b', 'c'];
if (items.includes(value)) { /* ... */ }

// GOOD - O(1) lookup for large datasets
const items = new Set(['a', 'b', 'c']);
if (items.has(value)) { /* ... */ }

// Use Map for key-value pairs
const cache = new Map();
cache.set(key, value);
```

### Avoid Unnecessary Re-renders (React)
```javascript
// BAD - new object on every render
<Component style={{ margin: 10 }} />

// GOOD - memoize
const style = { margin: 10 };
<Component style={style} />

// Use React.memo for expensive components
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{expensiveOperation(data)}</div>;
});
```

## Common Pitfalls

- **== vs ===**: Always use `===` and `!==` for comparisons
- **Truthy/Falsy confusion**: `0`, `''`, `null`, `undefined`, `NaN`, `false` are all falsy
- **Array.sort() mutates**: Use `[...array].sort()` to avoid mutation
- **parseInt without radix**: Always use `parseInt(str, 10)`
- **Floating point math**: `0.1 + 0.2 !== 0.3` - use libraries for precision
- **this binding**: Use arrow functions or explicit binding
- **Async forEach**: `array.forEach(async ...)` doesn't wait - use `for...of` or `Promise.all`

## Module Patterns

### ES6 Modules (Preferred)
```javascript
// exports.js
export const API_URL = 'https://api.example.com';
export function fetchData() { /* ... */ }
export default class Service { /* ... */ }

// imports.js
import Service, { API_URL, fetchData } from './exports.js';
```

### CommonJS (Node.js)
```javascript
// exports.js
const API_URL = 'https://api.example.com';
function fetchData() { /* ... */ }
module.exports = { API_URL, fetchData };

// imports.js
const { API_URL, fetchData } = require('./exports');
```

## Documentation Standards

```javascript
/**
 * Calculate the weighted average of values.
 *
 * @param {number[]} values - The array of numbers to average.
 * @param {number[]} weights - The corresponding weights.
 * @returns {number} The weighted average.
 * @throws {Error} If arrays have different lengths.
 *
 * @example
 * weightedAverage([1, 2, 3], [0.5, 0.3, 0.2]);
 * // Returns: 1.7
 */
function weightedAverage(values, weights) {
  if (values.length !== weights.length) {
    throw new Error('Arrays must have equal length');
  }
  // ...
}
```

## Testing Patterns

### Jest/Vitest
```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  it('should add two numbers', () => {
    expect(calculator.add(1, 2)).toBe(3);
  });

  it('should handle edge cases', () => {
    expect(calculator.divide(1, 0)).toBeNull();
  });

  it('should mock dependencies', () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
    // ...
  });
});
```

### Test Coverage Priorities
- Critical paths and business logic
- Error handling and edge cases
- Async operations
- Security-sensitive code
- Public API functions

## React-Specific Patterns

```javascript
// Use hooks properly
function Component() {
  // Hooks must be at top level
  const [state, setState] = useState(initial);
  const memoized = useMemo(() => expensive(data), [data]);

  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // Avoid: conditional hooks, hooks in loops
}

// Proper key usage
items.map(item => <Item key={item.id} {...item} />);
// Avoid: key={index}
```

## Node.js Security

```javascript
// Validate environment
if (!process.env.REQUIRED_VAR) {
  throw new Error('Missing required environment variable');
}

// Limit request size
app.use(express.json({ limit: '1mb' }));

// Use security headers (helmet)
const helmet = require('helmet');
app.use(helmet());

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```
