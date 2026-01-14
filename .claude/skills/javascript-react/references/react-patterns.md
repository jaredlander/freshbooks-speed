# React Advanced Patterns

## Table of Contents
- Compound Components
- Render Props and HOCs
- Controlled vs Uncontrolled
- Error Boundaries
- Suspense and Lazy Loading
- Server Components (React 19+)
- Advanced Hooks Patterns

## Compound Components

### Flexible API with Context

```tsx
interface SelectContextValue {
  value: string;
  onChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) throw new Error('Select components must be used within Select');
  return context;
}

function Select({ value, onChange, children }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <div role="listbox">{children}</div>
    </SelectContext.Provider>
  );
}

function Option({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: selected, onChange } = useSelectContext();
  const isSelected = selected === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => onChange(value)}
      className={isSelected ? 'selected' : ''}
    >
      {children}
    </div>
  );
}

Select.Option = Option;

// Usage
<Select value={selected} onChange={setSelected}>
  <Select.Option value="a">Option A</Select.Option>
  <Select.Option value="b">Option B</Select.Option>
</Select>
```

### Slot Pattern

```tsx
interface SlotProps {
  children: React.ReactNode;
}

function Card({ children }: { children: React.ReactNode }) {
  const slots = {
    header: null as React.ReactNode,
    body: null as React.ReactNode,
    footer: null as React.ReactNode,
  };

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === Card.Header) slots.header = child;
      else if (child.type === Card.Body) slots.body = child;
      else if (child.type === Card.Footer) slots.footer = child;
    }
  });

  return (
    <div className="card">
      {slots.header && <div className="card-header">{slots.header}</div>}
      {slots.body && <div className="card-body">{slots.body}</div>}
      {slots.footer && <div className="card-footer">{slots.footer}</div>}
    </div>
  );
}

Card.Header = ({ children }: SlotProps) => <>{children}</>;
Card.Body = ({ children }: SlotProps) => <>{children}</>;
Card.Footer = ({ children }: SlotProps) => <>{children}</>;
```

## Render Props and HOCs

### Render Props for Reusable Logic

```tsx
interface MousePosition { x: number; y: number; }

function MouseTracker({ children }: {
  children: (position: MousePosition) => React.ReactNode;
}) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return <>{children(position)}</>;
}

// Usage
<MouseTracker>
  {({ x, y }) => <div>Mouse: {x}, {y}</div>}
</MouseTracker>
```

### Type-Safe HOC

```tsx
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { isLoading?: boolean }> {
  return function WithLoading({ isLoading, ...props }) {
    if (isLoading) return <Spinner />;
    return <Component {...(props as P)} />;
  };
}

// Preserves ref forwarding
function withLoadingAndRef<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<unknown, P & { isLoading?: boolean }>(
    ({ isLoading, ...props }, ref) => {
      if (isLoading) return <Spinner />;
      return <Component {...(props as P)} ref={ref} />;
    }
  );
}
```

## Controlled vs Uncontrolled

### Hybrid Component Pattern

```tsx
interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

function Input({ value: controlledValue, defaultValue = '', onChange }: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Determine if controlled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  };

  return <input value={value} onChange={handleChange} />;
}
```

### useControllableState Hook

```tsx
function useControllableState<T>(
  controlledValue: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, (value: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = useCallback((newValue: T) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  }, [isControlled, onChange]);

  return [value, setValue];
}
```

## Error Boundaries

### Comprehensive Error Boundary

```tsx
interface ErrorBoundaryProps {
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      return fallback ?? <div>Something went wrong</div>;
    }

    return children;
  }
}

// Usage with function fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )}
  onError={(error) => logToService(error)}
>
  <App />
</ErrorBoundary>
```

## Suspense and Lazy Loading

### Route-Based Code Splitting

```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### Data Fetching with Suspense (React 19+)

```tsx
// Using the `use` hook
function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUser(userId)); // Suspends until resolved
  return <div>{user.name}</div>;
}

// Resource pattern for pre-React 19
function createResource<T>(promise: Promise<T>) {
  let status: 'pending' | 'success' | 'error' = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (r) => { status = 'success'; result = r; },
    (e) => { status = 'error'; error = e; }
  );

  return {
    read(): T {
      switch (status) {
        case 'pending': throw suspender;
        case 'error': throw error;
        case 'success': return result;
      }
    },
  };
}
```

## Server Components (React 19+)

### Server Component Pattern

```tsx
// UserList.tsx (Server Component - no 'use client')
async function UserList() {
  const users = await db.query('SELECT * FROM users');
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <UserCard user={user} />
        </li>
      ))}
    </ul>
  );
}

// UserCard.tsx (Client Component)
'use client';

function UserCard({ user }: { user: User }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div onClick={() => setExpanded(!expanded)}>
      <h3>{user.name}</h3>
      {expanded && <p>{user.bio}</p>}
    </div>
  );
}
```

### Server Actions

```tsx
// actions.ts
'use server';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  await db.insert({ name, email });
  revalidatePath('/users');
}

// Form component
'use client';

import { createUser } from './actions';

function CreateUserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Advanced Hooks Patterns

### usePrevious

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}
```

### useLatestCallback

```tsx
function useLatestCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef(callback);
  
  useLayoutEffect(() => {
    ref.current = callback;
  });
  
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}
```

### useMediaQuery

```tsx
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

### useIntersectionObserver

```tsx
function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options?.threshold, options?.root, options?.rootMargin]);

  return entry;
}
```
