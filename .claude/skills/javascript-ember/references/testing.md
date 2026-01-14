# Ember.js Testing Patterns

## Testing Philosophy

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Integration over unit** - Test components with their templates
3. **Use realistic data** - Mirror production data structures
4. **Mock at boundaries** - Use Mirage for API, not internal modules

## Component Integration Tests

### Basic Component Test

```javascript
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | todo-item', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders todo text', async function (assert) {
    this.set('todo', {
      id: 1,
      text: 'Buy groceries',
      isComplete: false
    });

    await render(hbs`<TodoItem @todo={{this.todo}} />`);

    assert.dom('[data-test-todo-text]').hasText('Buy groceries');
    assert.dom('[data-test-todo-checkbox]').isNotChecked();
  });

  test('it marks todo as complete', async function (assert) {
    this.set('todo', {
      id: 1,
      text: 'Buy groceries',
      isComplete: false
    });
    
    this.set('onToggle', (todo) => {
      this.set('todo', { ...todo, isComplete: !todo.isComplete });
    });

    await render(hbs`
      <TodoItem 
        @todo={{this.todo}} 
        @onToggle={{this.onToggle}} 
      />
    `);

    await click('[data-test-todo-checkbox]');

    assert.dom('[data-test-todo-checkbox]').isChecked();
    assert.true(this.todo.isComplete);
  });
});
```

### Testing Form Components

```javascript
module('Integration | Component | login-form', function (hooks) {
  setupRenderingTest(hooks);

  test('it submits valid credentials', async function (assert) {
    assert.expect(3);

    this.set('onSubmit', (credentials) => {
      assert.strictEqual(credentials.email, 'user@example.com');
      assert.strictEqual(credentials.password, 'password123');
    });

    await render(hbs`<LoginForm @onSubmit={{this.onSubmit}} />`);

    await fillIn('[data-test-email]', 'user@example.com');
    await fillIn('[data-test-password]', 'password123');
    await click('[data-test-submit]');

    assert.dom('[data-test-error]').doesNotExist();
  });

  test('it displays validation errors', async function (assert) {
    await render(hbs`<LoginForm />`);

    await click('[data-test-submit]');

    assert.dom('[data-test-email-error]').hasText('Email is required');
    assert.dom('[data-test-password-error]').hasText('Password is required');
  });

  test('it disables submit while loading', async function (assert) {
    this.set('onSubmit', () => {
      return new Promise(resolve => setTimeout(resolve, 100));
    });

    await render(hbs`<LoginForm @onSubmit={{this.onSubmit}} />`);

    await fillIn('[data-test-email]', 'user@example.com');
    await fillIn('[data-test-password]', 'password123');
    
    const submitPromise = click('[data-test-submit]');

    assert.dom('[data-test-submit]').isDisabled();
    assert.dom('[data-test-loading]').exists();

    await submitPromise;

    assert.dom('[data-test-submit]').isNotDisabled();
  });
});
```

### Testing with Services

```javascript
module('Integration | Component | user-profile', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    // Setup service
    this.sessionService = this.owner.lookup('service:session');
    this.sessionService.currentUser = {
      id: 1,
      name: 'Test User',
      canEdit: true
    };
  });

  test('it shows edit button when user can edit', async function (assert) {
    this.set('user', {
      id: 2,
      name: 'Other User'
    });

    await render(hbs`<UserProfile @user={{this.user}} />`);

    assert.dom('[data-test-edit-button]').exists();
  });

  test('it hides edit button when user cannot edit', async function (assert) {
    this.sessionService.currentUser.canEdit = false;

    this.set('user', {
      id: 2,
      name: 'Other User'
    });

    await render(hbs`<UserProfile @user={{this.user}} />`);

    assert.dom('[data-test-edit-button]').doesNotExist();
  });
});
```

## Unit Tests

### Testing Services

```javascript
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | cart', function (hooks) {
  setupTest(hooks);

  test('it adds items to cart', function (assert) {
    const service = this.owner.lookup('service:cart');
    
    const item = { id: 1, name: 'Widget', price: 10 };
    service.addItem(item);

    assert.strictEqual(service.items.length, 1);
    assert.strictEqual(service.items[0].id, 1);
  });

  test('it calculates total price', function (assert) {
    const service = this.owner.lookup('service:cart');
    
    service.addItem({ id: 1, price: 10, quantity: 2 });
    service.addItem({ id: 2, price: 5, quantity: 3 });

    assert.strictEqual(service.totalPrice, 35);
  });

  test('it removes items from cart', function (assert) {
    const service = this.owner.lookup('service:cart');
    
    service.addItem({ id: 1, price: 10 });
    service.addItem({ id: 2, price: 5 });
    
    service.removeItem(1);

    assert.strictEqual(service.items.length, 1);
    assert.strictEqual(service.items[0].id, 2);
  });

  test('it clears cart', function (assert) {
    const service = this.owner.lookup('service:cart');
    
    service.addItem({ id: 1, price: 10 });
    service.addItem({ id: 2, price: 5 });
    service.clear();

    assert.strictEqual(service.items.length, 0);
    assert.strictEqual(service.totalPrice, 0);
  });
});
```

### Testing Models

```javascript
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | user', function (hooks) {
  setupTest(hooks);

  test('it computes display name', function (assert) {
    const store = this.owner.lookup('service:store');
    
    const user = store.createRecord('user', {
      firstName: 'Jane',
      lastName: 'Doe'
    });

    assert.strictEqual(user.displayName, 'Jane Doe');
  });

  test('it validates email format', async function (assert) {
    const store = this.owner.lookup('service:store');
    
    const user = store.createRecord('user', {
      email: 'invalid-email'
    });

    const validations = await user.validate();

    assert.false(validations.isValid);
    assert.strictEqual(
      validations.errors.email[0],
      'Email must be a valid email address'
    );
  });
});
```

### Testing Utilities/Helpers

```javascript
import { module, test } from 'qunit';
import { formatCurrency } from 'my-app/utils/format-currency';

module('Unit | Utility | format-currency', function () {
  test('it formats USD currency', function (assert) {
    assert.strictEqual(formatCurrency(1234.56, 'USD'), '$1,234.56');
    assert.strictEqual(formatCurrency(0, 'USD'), '$0.00');
    assert.strictEqual(formatCurrency(0.5, 'USD'), '$0.50');
  });

  test('it formats EUR currency', function (assert) {
    assert.strictEqual(formatCurrency(1234.56, 'EUR'), '€1,234.56');
  });

  test('it handles negative amounts', function (assert) {
    assert.strictEqual(formatCurrency(-100, 'USD'), '-$100.00');
  });
});
```

## Route Tests

```javascript
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';

module('Unit | Route | users/user', function (hooks) {
  setupTest(hooks);

  test('it loads user by ID', async function (assert) {
    const route = this.owner.lookup('route:users/user');
    const store = this.owner.lookup('service:store');

    // Mock store findRecord
    store.findRecord = (modelName, id) => {
      assert.strictEqual(modelName, 'user');
      assert.strictEqual(id, '123');
      return Promise.resolve({ id: '123', name: 'Test User' });
    };

    const model = await route.model({ user_id: '123' });

    assert.strictEqual(model.id, '123');
    assert.strictEqual(model.name, 'Test User');
  });

  test('it redirects to 404 when user not found', async function (assert) {
    assert.expect(1);

    const route = this.owner.lookup('route:users/user');
    const store = this.owner.lookup('service:store');
    const router = this.owner.lookup('service:router');

    store.findRecord = () => {
      const error = new Error('Not Found');
      error.errors = [{ status: '404' }];
      return Promise.reject(error);
    };

    router.transitionTo = (routeName) => {
      assert.strictEqual(routeName, 'not-found');
    };

    try {
      await route.model({ user_id: '999' });
    } catch (error) {
      // Expected to throw
    }
  });
});
```

## Acceptance Tests

### Full User Flow

```javascript
import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | user management', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('creating a new user', async function (assert) {
    // Setup Mirage
    this.server.post('/users', (schema, request) => {
      const attrs = JSON.parse(request.requestBody).data.attributes;
      return schema.users.create(attrs);
    });

    await visit('/users');
    assert.strictEqual(currentURL(), '/users');

    await click('[data-test-new-user]');
    assert.strictEqual(currentURL(), '/users/new');

    await fillIn('[data-test-name]', 'John Doe');
    await fillIn('[data-test-email]', 'john@example.com');
    await click('[data-test-submit]');

    assert.strictEqual(currentURL(), '/users/1');
    assert.dom('[data-test-user-name]').hasText('John Doe');
    assert.dom('[data-test-success-message]').hasText('User created successfully');
  });

  test('editing an existing user', async function (assert) {
    // Setup Mirage
    const user = this.server.create('user', {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    this.server.patch('/users/:id', (schema, request) => {
      const attrs = JSON.parse(request.requestBody).data.attributes;
      user.update(attrs);
      return user;
    });

    await visit('/users/1');
    await click('[data-test-edit]');

    assert.strictEqual(currentURL(), '/users/1/edit');
    assert.dom('[data-test-name]').hasValue('Jane Doe');

    await fillIn('[data-test-name]', 'Jane Smith');
    await click('[data-test-submit]');

    assert.strictEqual(currentURL(), '/users/1');
    assert.dom('[data-test-user-name]').hasText('Jane Smith');
  });

  test('deleting a user', async function (assert) {
    this.server.create('user', { id: 1, name: 'John Doe' });
    
    this.server.delete('/users/:id', () => {
      return new Response(204);
    });

    await visit('/users/1');
    await click('[data-test-delete]');
    
    // Confirm dialog
    await click('[data-test-confirm-delete]');

    assert.strictEqual(currentURL(), '/users');
    assert.dom('[data-test-success-message]').hasText('User deleted successfully');
  });
});
```

### Authentication Flow

```javascript
module('Acceptance | authentication', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('logging in successfully', async function (assert) {
    this.server.post('/auth/login', () => {
      return {
        token: 'fake-jwt-token',
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'Test User'
        }
      };
    });

    await visit('/login');
    
    await fillIn('[data-test-email]', 'user@example.com');
    await fillIn('[data-test-password]', 'password123');
    await click('[data-test-submit]');

    assert.strictEqual(currentURL(), '/dashboard');
    assert.dom('[data-test-username]').hasText('Test User');
  });

  test('login with invalid credentials', async function (assert) {
    this.server.post('/auth/login', () => {
      return new Response(401, {}, {
        errors: [{ detail: 'Invalid credentials' }]
      });
    });

    await visit('/login');
    
    await fillIn('[data-test-email]', 'user@example.com');
    await fillIn('[data-test-password]', 'wrongpassword');
    await click('[data-test-submit]');

    assert.strictEqual(currentURL(), '/login');
    assert.dom('[data-test-error]').hasText('Invalid credentials');
  });

  test('protected routes redirect to login', async function (assert) {
    await visit('/dashboard');

    assert.strictEqual(currentURL(), '/login');
    assert.dom('[data-test-error]').hasText('Please log in to continue');
  });
});
```

## Mirage Setup

### Mirage Models and Factories

```javascript
// mirage/models/user.js
import { Model, hasMany } from 'miragejs';

export default Model.extend({
  posts: hasMany()
});
```

```javascript
// mirage/factories/user.js
import { Factory } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  name() {
    return faker.person.fullName();
  },
  
  email() {
    return faker.internet.email();
  },
  
  createdAt() {
    return faker.date.past();
  },
  
  isActive: true
});
```

### Mirage Scenarios

```javascript
// mirage/scenarios/default.js
export default function(server) {
  // Create seed data for development
  const users = server.createList('user', 10);
  
  users.forEach(user => {
    server.createList('post', 5, { author: user });
  });
}
```

### Mirage Route Handlers

```javascript
// mirage/config.js
export default function() {
  this.namespace = '/api';
  this.timing = 400; // Simulate network delay

  // RESTful routes
  this.get('/users');
  this.get('/users/:id');
  this.post('/users');
  this.patch('/users/:id');
  this.delete('/users/:id');

  // Custom endpoint
  this.get('/users/:id/posts', (schema, request) => {
    const user = schema.users.find(request.params.id);
    return user.posts;
  });

  // Simulate errors
  this.post('/users', (schema, request) => {
    const attrs = JSON.parse(request.requestBody).data.attributes;
    
    if (!attrs.email) {
      return new Response(422, {}, {
        errors: [{
          detail: 'Email is required',
          source: { pointer: '/data/attributes/email' }
        }]
      });
    }
    
    return schema.users.create(attrs);
  });

  // Pass through to real API
  this.passthrough('https://api.realservice.com/**');
}
```

## Testing Best Practices

### Use data-test Attributes

```handlebars
{{! ✅ Good: Semantic test selectors }}
<button data-test-submit {{on "click" this.submit}}>
  Save
</button>

<div data-test-error-message>
  {{@errorMessage}}
</div>

{{! ❌ Bad: Brittle class selectors }}
<button class="btn btn-primary" {{on "click" this.submit}}>
  Save
</button>
```

### Test Factories

```javascript
// tests/helpers/factories.js
export function createUser(overrides = {}) {
  return {
    id: Math.random().toString(36).substring(7),
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    createdAt: new Date(),
    ...overrides
  };
}

export function createPost(overrides = {}) {
  return {
    id: Math.random().toString(36).substring(7),
    title: 'Test Post',
    body: 'Post content',
    author: createUser(),
    publishedAt: new Date(),
    ...overrides
  };
}
```

```javascript
// Usage in tests
import { createUser, createPost } from '../helpers/factories';

test('it displays post author', async function (assert) {
  const author = createUser({ name: 'Jane Doe' });
  const post = createPost({ author });
  
  this.set('post', post);
  await render(hbs`<PostCard @post={{this.post}} />`);
  
  assert.dom('[data-test-author]').hasText('Jane Doe');
});
```

### Page Objects

```javascript
// tests/pages/login.js
export default {
  visit() {
    return visit('/login');
  },
  
  fillEmail(email) {
    return fillIn('[data-test-email]', email);
  },
  
  fillPassword(password) {
    return fillIn('[data-test-password]', password);
  },
  
  submit() {
    return click('[data-test-submit]');
  },
  
  get errorMessage() {
    return document.querySelector('[data-test-error]')?.textContent;
  }
};
```

```javascript
// Usage
import loginPage from '../pages/login';

test('login with invalid credentials', async function (assert) {
  await loginPage.visit();
  await loginPage.fillEmail('user@example.com');
  await loginPage.fillPassword('wrong');
  await loginPage.submit();
  
  assert.strictEqual(loginPage.errorMessage, 'Invalid credentials');
});
```

## Async Testing Helpers

### waitFor and waitUntil

```javascript
import { waitFor, waitUntil } from '@ember/test-helpers';

test('it waits for element to appear', async function (assert) {
  await render(hbs`<AsyncComponent />`);
  
  // Wait for element to exist
  await waitFor('[data-test-loaded-content]');
  
  assert.dom('[data-test-loaded-content]').exists();
});

test('it waits for condition', async function (assert) {
  const service = this.owner.lookup('service:data');
  service.loadData();
  
  // Wait until data is loaded
  await waitUntil(() => service.isLoaded);
  
  assert.true(service.isLoaded);
  assert.strictEqual(service.data.length, 10);
});
```

### Testing Timeouts and Polling

```javascript
import { later } from '@ember/runloop';
import { settled } from '@ember/test-helpers';

test('it updates after timeout', async function (assert) {
  this.set('message', 'Initial');
  
  await render(hbs`<div data-test-message>{{this.message}}</div>`);
  
  later(() => {
    this.set('message', 'Updated');
  }, 100);
  
  // Wait for all async to complete
  await settled();
  
  assert.dom('[data-test-message]').hasText('Updated');
});
```

## Testing Checklist

- [ ] Use data-test attributes for selectors
- [ ] Test user behavior, not implementation
- [ ] Use Mirage for API mocking
- [ ] Create factories for test data
- [ ] Test happy path and error cases
- [ ] Test async states (loading, success, error)
- [ ] Test form validation
- [ ] Test authentication flows
- [ ] Use page objects for complex flows
- [ ] Clean up in hooks.afterEach if needed
