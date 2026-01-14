# Performance Optimization

## Table of Contents
- Rendering Optimization
- Bundle Size Optimization
- Runtime Performance
- Memory Management
- Measuring Performance

## Rendering Optimization

### React.memo Guidelines

```tsx
// ✅ Good candidates for memo:
// - Components receiving complex objects that rarely change
// - Components in lists with stable data
// - Expensive components (complex calculations, many children)

const ExpensiveList = memo(function ExpensiveList({ items, onSelect }: Props) {
  return (
    <ul>
      {items.map(item => (
        <ExpensiveItem key={item.id} item={item} onSelect={onSelect} />
      ))}
    </ul>
  );
});

// ❌ Don't memo:
// - Components that receive children (breaks often)
// - Components that render differently on every pass
// - Simple components (memo overhead exceeds benefit)
```

### Custom Comparison Function

```tsx
const UserCard = memo(
  function UserCard({ user, settings }: Props) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific fields change
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.user.name === nextProps.user.name &&
      prevProps.settings.theme === nextProps.settings.theme
    );
  }
);
```

### Preventing Context Re-renders

```tsx
// Split contexts by update frequency
const UserDataContext = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Stable reference for actions
  const actions = useMemo(() => ({
    login: async (creds: Credentials) => { /* ... */ },
    logout: () => setUser(null),
    updateProfile: (data: Partial<User>) => setUser(u => ({ ...u!, ...data })),
  }), []);

  return (
    <UserDataContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserDataContext.Provider>
  );
}
```

### Optimizing Lists

```tsx
// Use virtualization for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            <Item data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Bundle Size Optimization

### Dynamic Imports

```tsx
// Route-level splitting
const routes = {
  '/dashboard': () => import('./pages/Dashboard'),
  '/settings': () => import('./pages/Settings'),
};

// Component-level splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// Conditional feature loading
async function loadAnalytics() {
  if (process.env.NODE_ENV === 'production') {
    const { init } = await import('./analytics');
    init();
  }
}
```

### Tree Shaking Best Practices

```javascript
// ❌ Imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ Import specific function
import debounce from 'lodash/debounce';
debounce(fn, 300);

// ✅ Or use lodash-es with named imports
import { debounce } from 'lodash-es';
```

### Analyzing Bundle

```bash
# Vite
npx vite-bundle-visualizer

# Webpack
npx webpack-bundle-analyzer stats.json

# Generic
npx source-map-explorer 'dist/**/*.js'
```

## Runtime Performance

### Debouncing and Throttling

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}
```

### Web Workers for Heavy Computation

```typescript
// worker.ts
self.onmessage = (e: MessageEvent<{ data: number[] }>) => {
  const result = e.data.data.reduce((sum, n) => sum + n, 0);
  self.postMessage({ result });
};

// useWorker.ts
function useWorker<T, R>(workerFactory: () => Worker) {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = workerFactory();
    return () => workerRef.current?.terminate();
  }, []);

  const postMessage = useCallback((data: T): Promise<R> => {
    return new Promise((resolve) => {
      const worker = workerRef.current!;
      worker.onmessage = (e) => resolve(e.data);
      worker.postMessage(data);
    });
  }, []);

  return postMessage;
}
```

### Batching DOM Updates

```tsx
// React 18+ batches automatically, but for manual DOM:
function useBatchedUpdates() {
  const pending = useRef<(() => void)[]>([]);
  const scheduled = useRef(false);

  const flush = useCallback(() => {
    const callbacks = pending.current;
    pending.current = [];
    scheduled.current = false;
    
    // Read phase
    const reads = callbacks.map(cb => cb);
    
    // Write phase (batched)
    requestAnimationFrame(() => {
      reads.forEach(cb => cb());
    });
  }, []);

  const schedule = useCallback((callback: () => void) => {
    pending.current.push(callback);
    if (!scheduled.current) {
      scheduled.current = true;
      queueMicrotask(flush);
    }
  }, [flush]);

  return schedule;
}
```

## Memory Management

### Cleanup Patterns

```tsx
function useAsyncEffect(effect: () => Promise<void>, deps: DependencyList) {
  useEffect(() => {
    const controller = new AbortController();
    
    effect().catch((error) => {
      if (error.name !== 'AbortError') throw error;
    });
    
    return () => controller.abort();
  }, deps);
}

// Subscription cleanup
function useSubscription<T>(subscribe: (callback: (value: T) => void) => () => void) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(setValue);
    return unsubscribe;
  }, [subscribe]);

  return value;
}
```

### Preventing Memory Leaks

```tsx
// ❌ Memory leak: callback captures stale closure
function BadComponent() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetchData().then(setData); // No cleanup!
  }, []);
}

// ✅ Proper cleanup with abort
function GoodComponent() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    fetchData({ signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      });
    
    return () => controller.abort();
  }, []);
}

// ✅ Or with mounted check
function AlsoGoodComponent() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let mounted = true;
    
    fetchData().then((result) => {
      if (mounted) setData(result);
    });
    
    return () => { mounted = false; };
  }, []);
}
```

## Measuring Performance

### React DevTools Profiler

```tsx
// Wrap components to measure
<Profiler id="Navigation" onRender={onRenderCallback}>
  <Navigation />
</Profiler>

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  // Log to analytics
  analytics.track('component_render', {
    id,
    phase,
    actualDuration,
    baseDuration,
  });
}
```

### Performance Marks

```typescript
function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  
  performance.mark(startMark);
  
  return fn().finally(() => {
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
  });
}
```

### Web Vitals

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function reportWebVitals(metric: Metric) {
  analytics.track('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
  });
}

onCLS(reportWebVitals);  // Cumulative Layout Shift
onFID(reportWebVitals);  // First Input Delay
onLCP(reportWebVitals);  // Largest Contentful Paint
onFCP(reportWebVitals);  // First Contentful Paint
onTTFB(reportWebVitals); // Time to First Byte
```
