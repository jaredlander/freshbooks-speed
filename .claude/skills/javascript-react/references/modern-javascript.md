# Modern JavaScript Advanced Patterns

## Table of Contents
- Closures and Module Patterns
- Proxy and Reflect
- Generators and Async Iterators
- WeakMap/WeakSet
- Custom Iterables
- Advanced Error Handling

## Closures and Module Patterns

### Private State with Closures

```javascript
function createCounter(initial = 0) {
  let count = initial;
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    get: () => count,
    reset: () => (count = initial),
  };
}

const counter = createCounter(10);
counter.increment(); // 11
counter.get();       // 11
// count is inaccessible directly
```

### Factory Functions with Private Methods

```javascript
function createUser(name, email) {
  // Private
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  let _email = validateEmail(email) ? email : null;

  // Public interface
  return {
    name,
    get email() { return _email; },
    set email(value) {
      if (validateEmail(value)) _email = value;
      else throw new Error('Invalid email');
    },
    toJSON() { return { name, email: _email }; },
  };
}
```

## Proxy and Reflect

### Reactive Objects

```javascript
function reactive(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      const result = Reflect.set(obj, prop, value);
      if (oldValue !== value) onChange(prop, value, oldValue);
      return result;
    },
    deleteProperty(obj, prop) {
      const result = Reflect.deleteProperty(obj, prop);
      onChange(prop, undefined, obj[prop]);
      return result;
    },
  });
}

const state = reactive({ count: 0 }, (prop, newVal, oldVal) => {
  console.log(`${prop}: ${oldVal} → ${newVal}`);
});
state.count++; // logs "count: 0 → 1"
```

### Validation Proxy

```javascript
const schema = {
  name: (v) => typeof v === 'string' && v.length > 0,
  age: (v) => Number.isInteger(v) && v >= 0,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};

function createValidated(schema) {
  return new Proxy({}, {
    set(obj, prop, value) {
      if (schema[prop] && !schema[prop](value)) {
        throw new TypeError(`Invalid value for ${prop}: ${value}`);
      }
      return Reflect.set(obj, prop, value);
    },
  });
}
```

### Lazy Property Initialization

```javascript
function lazy(target, prop, initializer) {
  let initialized = false;
  let value;
  
  Object.defineProperty(target, prop, {
    get() {
      if (!initialized) {
        value = initializer();
        initialized = true;
      }
      return value;
    },
    configurable: true,
  });
}
```

## Generators and Async Iterators

### Generators for Pagination

```javascript
async function* fetchPaginated(url, pageSize = 10) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}&limit=${pageSize}`);
    const data = await response.json();
    
    yield* data.items;
    
    hasMore = data.items.length === pageSize;
    page++;
  }
}

// Usage
for await (const item of fetchPaginated('/api/users')) {
  console.log(item);
  if (shouldStop) break; // Can break early
}
```

### Async Queue Processing

```javascript
async function* processQueue(queue, concurrency = 3) {
  const executing = new Set();

  for (const task of queue) {
    const promise = task().then((result) => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);

    if (executing.size >= concurrency) {
      yield await Promise.race(executing);
    }
  }

  while (executing.size > 0) {
    yield await Promise.race(executing);
  }
}
```

### Cancellable Async Operations

```javascript
function cancellable(asyncGenerator) {
  let cancelled = false;
  
  const wrapper = async function* () {
    for await (const value of asyncGenerator) {
      if (cancelled) return;
      yield value;
    }
  };

  return {
    [Symbol.asyncIterator]: () => wrapper(),
    cancel: () => { cancelled = true; },
  };
}
```

## WeakMap/WeakSet

### Private Class Fields (Pre-ES2022 Pattern)

```javascript
const privateData = new WeakMap();

class User {
  constructor(name, password) {
    privateData.set(this, { password, loginAttempts: 0 });
    this.name = name;
  }

  authenticate(password) {
    const data = privateData.get(this);
    if (data.password === password) {
      data.loginAttempts = 0;
      return true;
    }
    data.loginAttempts++;
    return false;
  }

  get locked() {
    return privateData.get(this).loginAttempts >= 3;
  }
}
```

### Caching with Automatic Cleanup

```javascript
const cache = new WeakMap();

function memoizeMethod(obj, methodName) {
  const original = obj[methodName];
  
  obj[methodName] = function(...args) {
    const key = JSON.stringify(args);
    let objCache = cache.get(this);
    
    if (!objCache) {
      objCache = new Map();
      cache.set(this, objCache);
    }
    
    if (!objCache.has(key)) {
      objCache.set(key, original.apply(this, args));
    }
    
    return objCache.get(key);
  };
}
```

## Custom Iterables

### Range Iterator

```javascript
function range(start, end, step = 1) {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if ((step > 0 && current < end) || (step < 0 && current > end)) {
            const value = current;
            current += step;
            return { value, done: false };
          }
          return { done: true };
        },
      };
    },
  };
}

[...range(0, 5)];      // [0, 1, 2, 3, 4]
[...range(5, 0, -1)];  // [5, 4, 3, 2, 1]
```

### Bidirectional Iterator

```javascript
class BidirectionalList {
  constructor(items) {
    this.items = [...items];
    this.cursor = 0;
  }

  [Symbol.iterator]() {
    return this.forward();
  }

  *forward() {
    for (let i = 0; i < this.items.length; i++) {
      yield this.items[i];
    }
  }

  *backward() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      yield this.items[i];
    }
  }
}
```

## Advanced Error Handling

### Result Type Pattern

```javascript
class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  static ok(value) { return new Result(true, value, null); }
  static err(error) { return new Result(false, null, error); }

  map(fn) {
    return this.ok ? Result.ok(fn(this.value)) : this;
  }

  flatMap(fn) {
    return this.ok ? fn(this.value) : this;
  }

  unwrapOr(defaultValue) {
    return this.ok ? this.value : defaultValue;
  }
}

// Usage
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return Result.err(new Error(`HTTP ${response.status}`));
    return Result.ok(await response.json());
  } catch (error) {
    return Result.err(error);
  }
}
```

### Retry with Exponential Backoff

```javascript
async function retry(fn, { maxAttempts = 3, baseDelay = 1000, maxDelay = 30000 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) break;
      
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }

  throw lastError;
}
```
