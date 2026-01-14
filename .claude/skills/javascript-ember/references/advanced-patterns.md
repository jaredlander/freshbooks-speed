# Advanced Ember.js Patterns

## Contextual Components

Create flexible, composable component APIs using the `{{yield}}` and named blocks.

### Basic Contextual Components

```javascript
// app/components/data-table.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class DataTableComponent extends Component {
  @tracked sortColumn = null;
  @tracked sortDirection = 'asc';

  get sortedData() {
    if (!this.sortColumn) return this.args.data;

    return [...this.args.data].sort((a, b) => {
      const aVal = a[this.sortColumn];
      const bVal = b[this.sortColumn];
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  @action
  sort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
}
```

```handlebars
{{! app/components/data-table.hbs }}
<table class="data-table">
  <thead>
    <tr>
      {{yield
        (hash
          Header=(component "data-table/header" onSort=this.sort)
        )
        to="header"
      }}
    </tr>
  </thead>
  <tbody>
    {{#each this.sortedData as |row|}}
      <tr>
        {{yield
          (hash
            Cell=(component "data-table/cell")
            row=row
          )
          to="body"
        }}
      </tr>
    {{/each}}
  </tbody>
</table>
```

```handlebars
{{! Usage }}
<DataTable @data={{this.users}}>
  <:header as |t|>
    <t.Header @column="name">Name</t.Header>
    <t.Header @column="email">Email</t.Header>
    <t.Header @column="createdAt">Created</t.Header>
  </:header>
  
  <:body as |t|>
    <t.Cell>{{t.row.name}}</t.Cell>
    <t.Cell>{{t.row.email}}</t.Cell>
    <t.Cell>{{format-date t.row.createdAt}}</t.Cell>
  </:body>
</DataTable>
```

### Advanced: Tabs Component

```javascript
// app/components/tabs.js
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TabsComponent extends Component {
  @tracked activeTab = this.args.defaultTab || 0;

  @action
  selectTab(index) {
    this.activeTab = index;
    this.args.onChange?.(index);
  }
}
```

```handlebars
{{! app/components/tabs.hbs }}
<div class="tabs">
  <div class="tabs-header">
    {{yield
      (hash
        Tab=(component "tabs/tab" 
          activeTab=this.activeTab 
          onSelect=this.selectTab
        )
      )
      to="tabs"
    }}
  </div>
  
  <div class="tabs-content">
    {{yield
      (hash
        Panel=(component "tabs/panel" activeTab=this.activeTab)
      )
      to="panels"
    }}
  </div>
</div>
```

```javascript
// app/components/tabs/tab.js
import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class TabsTabComponent extends Component {
  get isActive() {
    return this.args.activeTab === this.args.index;
  }

  @action
  select() {
    this.args.onSelect(this.args.index);
  }
}
```

```handlebars
{{! app/components/tabs/tab.hbs }}
<button
  class="tab {{if this.isActive 'active'}}"
  {{on "click" this.select}}
  type="button"
>
  {{yield}}
</button>
```

```javascript
// app/components/tabs/panel.js
import Component from '@glimmer/component';

export default class TabsPanelComponent extends Component {
  get isActive() {
    return this.args.activeTab === this.args.index;
  }
}
```

```handlebars
{{! app/components/tabs/panel.hbs }}
{{#if this.isActive}}
  <div class="tab-panel">
    {{yield}}
  </div>
{{/if}}
```

```handlebars
{{! Usage }}
<Tabs @defaultTab={{0}} @onChange={{this.handleTabChange}}>
  <:tabs as |t|>
    <t.Tab @index={{0}}>Profile</t.Tab>
    <t.Tab @index={{1}}>Settings</t.Tab>
    <t.Tab @index={{2}}>Security</t.Tab>
  </:tabs>
  
  <:panels as |p|>
    <p.Panel @index={{0}}>
      <ProfileContent @user={{this.user}} />
    </p.Panel>
    <p.Panel @index={{1}}>
      <SettingsContent @user={{this.user}} />
    </p.Panel>
    <p.Panel @index={{2}}>
      <SecurityContent @user={{this.user}} />
    </p.Panel>
  </:panels>
</Tabs>
```

## Advanced State Management

### Resource Pattern (ember-resources)

```bash
ember install ember-resources
```

```javascript
// app/resources/current-time.js
import { Resource } from 'ember-resources';
import { tracked } from '@glimmer/tracking';

export class CurrentTime extends Resource {
  @tracked time = new Date();
  
  interval = null;

  constructor(owner, args) {
    super(owner, args);
    
    this.interval = setInterval(() => {
      this.time = new Date();
    }, this.args.named.updateInterval || 1000);
  }

  willDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
```

```javascript
// Usage in component
import Component from '@glimmer/component';
import { use } from 'ember-resources';
import { CurrentTime } from 'my-app/resources/current-time';

export default class ClockComponent extends Component {
  @use currentTime = CurrentTime.from(() => ({ updateInterval: 1000 }));

  get formattedTime() {
    return this.currentTime.time.toLocaleTimeString();
  }
}
```

### Custom Resource for Data Fetching

```javascript
// app/resources/fetch-data.js
import { Resource } from 'ember-resources';
import { tracked } from '@glimmer/tracking';

export class FetchData extends Resource {
  @tracked data = null;
  @tracked error = null;
  @tracked isLoading = true;
  
  abortController = null;

  async setup() {
    this.abortController = new AbortController();
    
    try {
      this.isLoading = true;
      const response = await fetch(this.args.named.url, {
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.data = await response.json();
      this.error = null;
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.error = error;
      }
    } finally {
      this.isLoading = false;
    }
  }

  willDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
```

```javascript
// Usage
export default class UserListComponent extends Component {
  @use userData = FetchData.from(() => ({
    url: '/api/users'
  }));

  get users() {
    return this.userData.data || [];
  }
}
```

## Advanced Modifiers

### Intersection Observer Modifier

```javascript
// app/modifiers/intersection-observer.js
import { modifier } from 'ember-modifier';

export default modifier((element, [callback], options = {}) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry);
      });
    },
    {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0
    }
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
});
```

```handlebars
{{! Usage: Lazy load images }}
<img
  src={{if this.isVisible @src "placeholder.jpg"}}
  {{intersection-observer 
    this.handleVisibility 
    threshold=0.5
  }}
  alt={{@alt}}
/>
```

### Resize Observer Modifier

```javascript
// app/modifiers/resize-observer.js
import { modifier } from 'ember-modifier';

export default modifier((element, [callback]) => {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      callback({ width, height, entry });
    }
  });

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
});
```

```javascript
// Usage in component
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ResponsiveComponent extends Component {
  @tracked containerWidth = 0;

  @action
  handleResize({ width }) {
    this.containerWidth = width;
  }

  get columns() {
    if (this.containerWidth < 768) return 1;
    if (this.containerWidth < 1024) return 2;
    return 3;
  }
}
```

```handlebars
<div {{resize-observer this.handleResize}} class="responsive-grid">
  {{! Grid with dynamic columns based on width }}
</div>
```

## Advanced Routing Patterns

### Route Guards

```javascript
// app/routes/authenticated.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class AuthenticatedRoute extends Route {
  @service session;
  @service router;

  beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      this.session.attemptedTransition = transition;
      this.router.transitionTo('login');
    }
  }
}
```

```javascript
// app/routes/admin.js - Extends authenticated route
import AuthenticatedRoute from './authenticated';
import { inject as service } from '@ember/service';

export default class AdminRoute extends AuthenticatedRoute {
  @service currentUser;

  beforeModel(transition) {
    super.beforeModel(transition);

    if (!this.currentUser.isAdmin) {
      this.router.transitionTo('dashboard');
    }
  }
}
```

### Parallel Data Loading

```javascript
// app/routes/dashboard.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { hash } from 'rsvp';

export default class DashboardRoute extends Route {
  @service store;

  async model() {
    // Load all data in parallel
    return hash({
      user: this.store.findRecord('user', this.session.userId),
      stats: this.store.queryRecord('dashboard-stats', {}),
      recentActivity: this.store.query('activity', {
        limit: 10,
        sort: '-createdAt'
      }),
      notifications: this.store.query('notification', {
        filter: { read: false }
      })
    });
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    
    // Set individual properties for easier access
    controller.setProperties({
      user: model.user,
      stats: model.stats,
      recentActivity: model.recentActivity,
      notifications: model.notifications
    });
  }
}
```

### Query Parameter State

```javascript
// app/controllers/products.js
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProductsController extends Controller {
  queryParams = ['search', 'category', 'minPrice', 'maxPrice', 'page'];

  @tracked search = '';
  @tracked category = null;
  @tracked minPrice = null;
  @tracked maxPrice = null;
  @tracked page = 1;

  @action
  updateFilter(key, value) {
    this[key] = value;
    this.page = 1; // Reset to first page
  }

  @action
  clearFilters() {
    this.search = '';
    this.category = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.page = 1;
  }
}
```

```javascript
// app/routes/products.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ProductsRoute extends Route {
  @service store;

  queryParams = {
    search: { refreshModel: true },
    category: { refreshModel: true },
    minPrice: { refreshModel: true },
    maxPrice: { refreshModel: true },
    page: { refreshModel: true }
  };

  model(params) {
    const filter = {};
    
    if (params.search) filter.search = params.search;
    if (params.category) filter.category = params.category;
    if (params.minPrice) filter.minPrice = params.minPrice;
    if (params.maxPrice) filter.maxPrice = params.maxPrice;

    return this.store.query('product', {
      filter,
      page: { number: params.page, size: 20 }
    });
  }
}
```

## Advanced Ember Data Patterns

### Polymorphic Relationships

```javascript
// app/models/comment.js
import Model, { attr, belongsTo } from '@ember-data/model';

export default class CommentModel extends Model {
  @attr('string') text;
  @attr('date') createdAt;
  
  // Polymorphic relationship - can belong to Post or Video
  @belongsTo('commentable', { polymorphic: true, async: true }) commentable;
  
  @belongsTo('user', { async: true }) author;
}
```

```javascript
// app/models/post.js
import Model, { attr, hasMany } from '@ember-data/model';

export default class PostModel extends Model {
  @attr('string') title;
  @attr('string') body;
  
  @hasMany('comment', { polymorphic: true, inverse: 'commentable', async: true }) 
  comments;
}
```

```javascript
// app/models/video.js
import Model, { attr, hasMany } from '@ember-data/model';

export default class VideoModel extends Model {
  @attr('string') title;
  @attr('string') url;
  
  @hasMany('comment', { polymorphic: true, inverse: 'commentable', async: true }) 
  comments;
}
```

### Custom Transforms

```javascript
// app/transforms/money.js
import Transform from '@ember-data/serializer/transform';

export default class MoneyTransform extends Transform {
  deserialize(serialized) {
    // API sends cents, convert to dollars
    return serialized ? serialized / 100 : 0;
  }

  serialize(deserialized) {
    // Convert dollars to cents for API
    return Math.round(deserialized * 100);
  }
}
```

```javascript
// Usage in model
export default class ProductModel extends Model {
  @attr('string') name;
  @attr('money') price; // Uses money transform
}
```

### Embedded Records

```javascript
// app/serializers/post.js
import JSONAPISerializer from '@ember-data/serializer/json-api';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class PostSerializer extends JSONAPISerializer.extend(EmbeddedRecordsMixin) {
  attrs = {
    comments: { embedded: 'always' },
    author: { serialize: 'ids' }
  };
}
```

### Advanced Adapter Hooks

```javascript
// app/adapters/application.js
import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';

export default class ApplicationAdapter extends JSONAPIAdapter {
  @service session;
  @service metrics;

  // Add request timing
  async ajax(url, method, options) {
    const startTime = performance.now();
    
    try {
      const response = await super.ajax(url, method, options);
      
      this.metrics.track('api.request', {
        url,
        method,
        duration: performance.now() - startTime,
        status: 'success'
      });
      
      return response;
    } catch (error) {
      this.metrics.track('api.request', {
        url,
        method,
        duration: performance.now() - startTime,
        status: 'error',
        error: error.message
      });
      
      throw error;
    }
  }

  // Custom batch loading
  findMany(store, type, ids, snapshots) {
    // Implement custom batch endpoint
    return this.ajax(`${this.buildURL(type.modelName)}/batch`, 'GET', {
      data: { ids: ids.join(',') }
    });
  }

  // Optimistic updates
  createRecord(store, type, snapshot) {
    // Return immediately with temporary data
    const tempData = { id: `temp-${Date.now()}`, ...snapshot.attributes() };
    
    // Make actual API call in background
    super.createRecord(store, type, snapshot).then(realData => {
      // Update record with real data
      store.pushPayload(type.modelName, realData);
    });
    
    return Promise.resolve({ data: tempData });
  }
}
```

## TypeScript Advanced Patterns

### Strict Component Signatures

```typescript
// app/components/user-card.ts
import Component from '@glimmer/component';

interface UserCardSignature {
  Element: HTMLDivElement;
  Args: {
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
    onClick?: (userId: string) => void;
    showEmail?: boolean;
  };
  Blocks: {
    default: [user: UserCardSignature['Args']['user']];
    actions: [];
  };
}

export default class UserCardComponent extends Component<UserCardSignature> {
  get displayName(): string {
    return this.args.user.name || 'Anonymous';
  }
}
```

### Service Type Safety

```typescript
// app/services/api.ts
import Service from '@ember/service';

interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
  };
}

export default class ApiService extends Service {
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(url);
    return response.json();
  }

  async post<T = unknown, D = unknown>(
    url: string, 
    data: D
  ): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

## Performance Monitoring

### Custom Metric Tracking

```javascript
// app/services/performance.js
import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class PerformanceService extends Service {
  @tracked metrics = [];
  
  mark(name) {
    performance.mark(name);
  }
  
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name)[0];
    
    this.metrics = [...this.metrics, {
      name,
      duration: measure.duration,
      timestamp: Date.now()
    }];
    
    return measure.duration;
  }
  
  getMetrics(name) {
    return this.metrics.filter(m => m.name === name);
  }
  
  clearMetrics() {
    this.metrics = [];
    performance.clearMarks();
    performance.clearMeasures();
  }
}
```

```javascript
// Usage in route
export default class ProductsRoute extends Route {
  @service performance;

  async model() {
    this.performance.mark('products-load-start');
    
    const data = await this.store.findAll('product');
    
    this.performance.mark('products-load-end');
    this.performance.measure(
      'products-load',
      'products-load-start',
      'products-load-end'
    );
    
    return data;
  }
}
```

These advanced patterns provide powerful tools for building sophisticated Ember applications while maintaining clean, maintainable code.
