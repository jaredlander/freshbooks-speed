# JavaScript Testing with Jest/Vitest

## File Organization

```
project/
├── src/
│   ├── components/
│   │   └── Button.jsx
│   ├── utils/
│   │   └── format.js
│   └── services/
│       └── api.js
└── tests/  (or __tests__)
    ├── setup.js              # Test configuration
    ├── utils/
    │   └── format.test.js    # Tests mirror source structure
    ├── components/
    │   └── Button.test.jsx
    └── integration/
        └── api.integration.test.js
```

Alternative (co-located tests):
```
src/
├── components/
│   ├── Button.jsx
│   └── Button.test.jsx       # Tests next to source
└── utils/
    ├── format.js
    └── format.test.js
```

## Test Structure

### Jest/Vitest Basics

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'; // or '@jest/globals'
import { functionUnderTest } from '../src/module.js';

describe('functionUnderTest', () => {
  // Arrange - setup shared across tests
  let testData;

  beforeEach(() => {
    testData = { key: 'value' };
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it('should return expected value for valid input', () => {
    // Arrange
    const input = { data: 'test' };

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should throw error for invalid input', () => {
    // Assert throws
    expect(() => {
      functionUnderTest(null);
    }).toThrow('Input cannot be null');
  });

  it('should handle edge cases', () => {
    expect(functionUnderTest({})).toBeNull();
    expect(functionUnderTest(undefined)).toBeUndefined();
  });
});
```

## Common Assertions

```javascript
// Equality
expect(result).toBe(expected);              // Strict equality (===)
expect(result).toEqual(expected);           // Deep equality for objects/arrays
expect(result).not.toBe(unexpected);

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeNull();
expect(result).toBeUndefined();
expect(result).toBeDefined();

// Numbers
expect(result).toBeGreaterThan(3);
expect(result).toBeLessThanOrEqual(5);
expect(result).toBeCloseTo(0.3, 5);         // Floating point (0.1 + 0.2)

// Strings
expect(result).toMatch(/pattern/);
expect(result).toContain('substring');

// Arrays/Iterables
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
expect(obj).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow(Error);
```

## Mocking

### Function Mocks

```javascript
import { vi } from 'vitest'; // or jest.fn() for Jest

describe('mocking examples', () => {
  it('should mock a function', () => {
    const mockFn = vi.fn();
    mockFn.mockReturnValue(42);

    const result = mockFn('arg');

    expect(result).toBe(42);
    expect(mockFn).toHaveBeenCalledWith('arg');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should mock implementation', () => {
    const mockFn = vi.fn((x) => x * 2);

    expect(mockFn(5)).toBe(10);
  });

  it('should mock resolved values', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

    const result = await mockFn();
    expect(result).toEqual({ data: 'test' });
  });

  it('should mock rejected values', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

    await expect(mockFn()).rejects.toThrow('Failed');
  });
});
```

### Module Mocks

```javascript
import { vi } from 'vitest';
import { fetchData } from '../src/api.js';
import axios from 'axios';

// Mock entire module
vi.mock('axios');

describe('fetchData', () => {
  it('should call axios and return data', async () => {
    const mockData = { id: 1, name: 'Test' };
    axios.get.mockResolvedValue({ data: mockData });

    const result = await fetchData('/users/1');

    expect(axios.get).toHaveBeenCalledWith('/users/1');
    expect(result).toEqual(mockData);
  });
});
```

### Partial Module Mocks

```javascript
import { vi } from 'vitest';

vi.mock('../src/utils.js', async () => {
  const actual = await vi.importActual('../src/utils.js');
  return {
    ...actual,
    expensiveFunction: vi.fn(() => 'mocked'),
  };
});
```

### Spy on Methods

```javascript
import { vi } from 'vitest';

describe('spying', () => {
  it('should spy on object method', () => {
    const obj = {
      method: () => 'real',
    };

    const spy = vi.spyOn(obj, 'method');
    spy.mockReturnValue('mocked');

    expect(obj.method()).toBe('mocked');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore(); // Restore original implementation
  });

  it('should spy on console methods', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

    console.log('test');

    expect(consoleSpy).toHaveBeenCalledWith('test');
    consoleSpy.mockRestore();
  });
});
```

## Async Testing

```javascript
describe('async operations', () => {
  it('should test promises', async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it('should test with then/catch', () => {
    return fetchData().then(data => {
      expect(data).toBeDefined();
    });
  });

  it('should test rejected promises', async () => {
    await expect(failingFunction()).rejects.toThrow();
  });

  it('should test async/await with try/catch', async () => {
    try {
      await failingFunction();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error.message).toBe('Expected error');
    }
  });
});
```

## Parametrized Tests

```javascript
describe.each([
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
])('doubleNumber with $input', ({ input, expected }) => {
  it(`should return ${expected}`, () => {
    expect(doubleNumber(input)).toBe(expected);
  });
});

// Alternative syntax
it.each([
  [0, 'zero'],
  [1, 'positive'],
  [-1, 'negative'],
])('should classify %i as %s', (input, expected) => {
  expect(classify(input)).toBe(expected);
});
```

## Setup and Teardown

```javascript
describe('database tests', () => {
  let db;

  // Runs once before all tests
  beforeAll(async () => {
    db = await setupDatabase();
  });

  // Runs before each test
  beforeEach(async () => {
    await db.clear();
  });

  // Runs after each test
  afterEach(async () => {
    await db.rollback();
  });

  // Runs once after all tests
  afterAll(async () => {
    await db.close();
  });

  it('should insert record', async () => {
    await db.insert({ id: 1, name: 'Test' });
    const result = await db.find(1);
    expect(result.name).toBe('Test');
  });
});
```

## React Component Testing

### With React Testing Library

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/Button';

describe('Button component', () => {
  it('should render button text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByText('Click'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when prop is set', () => {
    render(<Button disabled>Click</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Testing Hooks

```javascript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../src/hooks/useCounter';

describe('useCounter hook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });
});
```

## Testing DOM Manipulation

```javascript
describe('DOM tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should update DOM element', () => {
    const element = document.getElementById('app');
    updateElement(element, 'New content');

    expect(element.textContent).toBe('New content');
  });
});
```

## Timer Mocking

```javascript
import { vi } from 'vitest';

describe('timer tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay execution', () => {
    const callback = vi.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle intervals', () => {
    const callback = vi.fn();

    setInterval(callback, 100);

    vi.advanceTimersByTime(350);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should run all timers', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    vi.runAllTimers();

    expect(callback).toHaveBeenCalled();
  });
});
```

## Snapshot Testing

```javascript
describe('snapshot tests', () => {
  it('should match snapshot', () => {
    const component = <Button>Click me</Button>;
    const { container } = render(component);

    expect(container).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const result = formatData({ name: 'Test', id: 1 });

    expect(result).toMatchInlineSnapshot(`
      {
        "id": 1,
        "name": "Test",
      }
    `);
  });
});
```

## Coverage and Running Tests

### Running Tests

```bash
# Vitest
vitest                          # Run in watch mode
vitest run                      # Run once
vitest --coverage               # Generate coverage
vitest --ui                     # Visual UI

# Jest
jest                            # Run all tests
jest --watch                    # Watch mode
jest --coverage                 # Coverage report
jest path/to/test.js            # Specific file
jest -t "pattern"               # Match test names
```

### Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',           // For DOM testing
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Test Doubles Strategy

- **Mock**: Replace entire module/function (external APIs, complex dependencies)
- **Spy**: Watch real implementation while tracking calls (logging, analytics)
- **Stub**: Replace with simple implementation (timers, randomness)
- **Fake**: Working implementation with shortcuts (in-memory database)

## Best Practices

1. **Test user-facing behavior**, not implementation details
2. **Avoid testing libraries** - trust they work correctly
3. **Keep tests simple** - if test is complex, simplify code under test
4. **Use descriptive test names** - describe scenario and expected outcome
5. **Test one thing per test** - easier to debug failures
6. **Mock external dependencies** - network, file system, databases
7. **Avoid snapshot testing for complex components** - brittle and hard to review
8. **Clean up after tests** - prevent test pollution
9. **Use beforeEach for shared setup** - keep tests independent
10. **Test error cases** - not just happy paths
