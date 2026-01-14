# Ember.js Performance Optimization

## Rendering Performance

### Use @cached for Expensive Getters

```javascript
import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { tracked } from '@glimmer/tracking';

export default class DataTableComponent extends Component {
  @tracked searchQuery = '';
  @tracked sortKey = 'name';
  
  // ❌ Bad: Recomputes on every render
  get filteredData() {
    return this.args.data.filter(item => 
      item.name.includes(this.searchQuery)
    );
  }
  
  // ✅ Good: Only recomputes when dependencies change
  @cached
  get filteredData() {
    return this.args.data.filter(item => 
      item.name.includes(this.searchQuery)
    );
  }
}
```

### Avoid Creating Objects in Templates

```handlebars
{{! ❌ Bad: Creates new object on every render }}
<UserCard @style={{hash color="red" fontSize=14}} />

{{! ✅ Good: Define in component }}
<UserCard @style={{this.cardStyle}} />
```

```javascript
export default class MyComponent extends Component {
  cardStyle = { color: 'red', fontSize: 14 };
}
```

### Optimize Component Arguments

```javascript
// ❌ Bad: Passes entire object, component re-renders on any change
<UserProfile @user={{this.user}} />

// ✅ Good: Pass only needed properties
<UserProfile 
  @name={{this.user.name}} 
  @email={{this.user.email}} 
/>
```

### Use `{{#in-element}}` for Portals

```handlebars
{{! Render modal content into body without re-rendering entire component }}
{{#in-element this.modalContainer insertBefore=null}}
  <div class="modal">
    {{yield}}
  </div>
{{/in-element}}
```

```javascript
export default class ModalComponent extends Component {
  modalContainer = document.getElementById('modal-root');
}
```

## Ember Data Performance

### Optimize Includes

```javascript
// ❌ Bad: Makes N+1 queries
this.store.findAll('post'); // Then accessing post.author triggers query for each

// ✅ Good: Single query with includes
this.store.findAll('post', { include: 'author,comments' });
```

### Use Adapters for Bulk Operations

```javascript
// app/adapters/post.js
export default class PostAdapter extends JSONAPIAdapter {
  // Bulk delete
  deleteMany(ids) {
    return this.ajax(`${this.buildURL('post')}/bulk-delete`, 'DELETE', {
      data: { ids }
    });
  }
}
```

### Peek Instead of Find When Possible

```javascript
// ❌ Bad: Triggers API call
const user = await this.store.findRecord('user', id);

// ✅ Good: Check store first
const user = this.store.peekRecord('user', id) || 
             await this.store.findRecord('user', id);
```

### Unload Unused Records

```javascript
export default class DashboardRoute extends Route {
  async model() {
    // Unload old data to free memory
    this.store.peekAll('temporary-data').forEach(record => {
      record.unloadRecord();
    });
    
    return this.store.query('dashboard-data', {});
  }
}
```

## List Rendering

### Virtual Scrolling for Large Lists

```bash
ember install @html-next/vertical-collection
```

```handlebars
<VerticalCollection 
  @items={{this.items}}
  @estimateHeight={{50}}
  as |item|
>
  <div class="list-item">{{item.name}}</div>
</VerticalCollection>
```

### Key Items Properly

```handlebars
{{! ❌ Bad: Uses index, causes unnecessary re-renders }}
{{#each this.items as |item index|}}
  <div data-index={{index}}>{{item.name}}</div>
{{/each}}

{{! ✅ Good: Uses stable ID }}
{{#each this.items key="id" as |item|}}
  <div data-id={{item.id}}>{{item.name}}</div>
{{/each}}
```

### Batch DOM Updates

```javascript
import { action } from '@ember/object';
import { later, scheduleOnce } from '@ember/runloop';

export default class BatchUpdateComponent extends Component {
  @tracked items = [];
  
  @action
  addItems(newItems) {
    // ❌ Bad: Updates tracked property multiple times
    newItems.forEach(item => {
      this.items = [...this.items, item];
    });
    
    // ✅ Good: Single update
    this.items = [...this.items, ...newItems];
  }
  
  @action
  deferredUpdate(data) {
    // Schedule update for next render cycle
    scheduleOnce('afterRender', this, () => {
      this.processData(data);
    });
  }
}
```

## Memory Management

### Clean Up in willDestroy

```javascript
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { cancel, later } from '@ember/runloop';

export default class PollingComponent extends Component {
  @service api;
  
  pollTimer = null;
  abortController = null;
  
  constructor(owner, args) {
    super(owner, args);
    this.startPolling();
  }
  
  startPolling() {
    this.abortController = new AbortController();
    
    this.pollTimer = later(this, () => {
      this.fetchData();
      this.startPolling(); // Recursively schedule
    }, 5000);
  }
  
  async fetchData() {
    try {
      await this.api.getData({ signal: this.abortController.signal });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    }
  }
  
  willDestroy() {
    super.willDestroy();
    
    // Cancel scheduled work
    if (this.pollTimer) {
      cancel(this.pollTimer);
    }
    
    // Abort in-flight requests
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
```

### Use WeakMap for Component-Scoped Data

```javascript
import Component from '@glimmer/component';

const componentData = new WeakMap();

export default class DataCacheComponent extends Component {
  constructor(owner, args) {
    super(owner, args);
    
    // Data automatically garbage collected when component destroyed
    componentData.set(this, {
      cache: new Map(),
      timestamp: Date.now()
    });
  }
  
  get cachedData() {
    return componentData.get(this).cache;
  }
}
```

## Bundle Size Optimization

### Route-Based Code Splitting

```javascript
// app/router.js
Router.map(function() {
  // Admin routes loaded lazily
  this.route('admin', function() {
    this.route('users');
    this.route('settings');
  });
});

// app/routes/admin.js
import Route from '@ember/routing/route';

export default class AdminRoute extends Route {
  // Lazy load admin-specific dependencies
  async beforeModel() {
    await import('admin-specific-library');
  }
}
```

### Lazy Engines

```bash
ember install ember-engines
```

```javascript
// lib/admin/addon/engine.js
import Engine from '@ember/engine';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

export default class AdminEngine extends Engine {
  modulePrefix = 'admin';
  Resolver = Resolver;
  dependencies = {
    services: ['store', 'session', 'router']
  };
}
```

### Tree Shaking Utilities

```javascript
// ❌ Bad: Imports entire lodash
import _ from 'lodash';
_.chunk(array, 10);

// ✅ Good: Only imports chunk function
import chunk from 'lodash/chunk';
chunk(array, 10);
```

## Network Performance

### Request Debouncing

```javascript
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { debounce } from '@ember/runloop';

export default class SearchComponent extends Component {
  @tracked query = '';
  @tracked results = [];
  
  @action
  updateQuery(event) {
    this.query = event.target.value;
    debounce(this, this.performSearch, 300);
  }
  
  async performSearch() {
    if (!this.query) {
      this.results = [];
      return;
    }
    
    this.results = await fetch(`/api/search?q=${this.query}`)
      .then(r => r.json());
  }
}
```

### Request Coalescing

```javascript
// app/adapters/application.js
export default class ApplicationAdapter extends JSONAPIAdapter {
  // Coalese findRecord calls within 50ms
  coalesceFindRequests = true;
  
  // Group multiple IDs into single request
  findMany(store, type, ids) {
    return this.ajax(`${this.buildURL(type.modelName)}/batch`, 'GET', {
      data: { ids: ids.join(',') }
    });
  }
}
```

### Response Caching

```javascript
// app/services/api-cache.js
import Service from '@ember/service';

export default class ApiCacheService extends Service {
  cache = new Map();
  ttl = 5 * 60 * 1000; // 5 minutes
  
  async fetch(url, options = {}) {
    const cacheKey = `${url}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await fetch(url, options).then(r => r.json());
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Measurement and Profiling

### Ember Inspector

Use the Ember Inspector browser extension to:
- View component tree and render times
- Inspect tracked properties
- Monitor route transitions
- Profile render performance

### Custom Performance Marks

```javascript
export default class PerformantRoute extends Route {
  async model() {
    performance.mark('model-start');
    
    const data = await this.store.query('item', {});
    
    performance.mark('model-end');
    performance.measure('model-load', 'model-start', 'model-end');
    
    const measure = performance.getEntriesByName('model-load')[0];
    console.log(`Model load took ${measure.duration}ms`);
    
    return data;
  }
}
```

### Memory Leak Detection

```javascript
// tests/helpers/memory-leak-detector.js
export function detectLeaks(assert, fn) {
  if (typeof gc !== 'function') {
    assert.ok(true, 'Skip: gc() not available');
    return;
  }
  
  const initialHeap = performance.memory.usedJSHeapSize;
  
  // Run test multiple times
  for (let i = 0; i < 100; i++) {
    fn();
  }
  
  // Force garbage collection
  gc();
  
  const finalHeap = performance.memory.usedJSHeapSize;
  const growth = finalHeap - initialHeap;
  
  assert.ok(growth < 1000000, `Memory growth: ${growth} bytes`);
}
```

## Production Optimizations

### Enable Production Build

```bash
ember build --environment=production
```

### Fingerprinting

```javascript
// ember-cli-build.js
module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    fingerprint: {
      enabled: true,
      extensions: ['js', 'css', 'png', 'jpg', 'gif', 'map', 'svg']
    }
  });
  
  return app.toTree();
};
```

### Minification

```javascript
// ember-cli-build.js
module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    minifyCSS: { enabled: true },
    minifyJS: { enabled: true },
    sourcemaps: { enabled: false } // Disable for production
  });
  
  return app.toTree();
};
```

## Quick Performance Checklist

- [ ] Use `@cached` for expensive getters
- [ ] Avoid object/array creation in templates
- [ ] Key lists with stable IDs
- [ ] Use virtual scrolling for 100+ items
- [ ] Optimize Ember Data includes
- [ ] Unload unused records
- [ ] Clean up timers/listeners in willDestroy
- [ ] Use AbortController for requests
- [ ] Debounce search inputs
- [ ] Enable fingerprinting in production
- [ ] Lazy load admin/uncommon routes
- [ ] Profile with Ember Inspector
