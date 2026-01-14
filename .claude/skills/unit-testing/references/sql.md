# PostgreSQL Testing with pgTAP

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install pgtap

# Or from source
git clone https://github.com/theory/pgtap.git
cd pgtap
make
sudo make install

# Enable in database
CREATE EXTENSION pgtap;
```

## File Organization

```
sql/
├── migrations/
│   └── 001_create_users.sql
├── functions/
│   └── calculate_total.sql
└── tests/
    ├── test_users.sql
    ├── test_calculate_total.sql
    └── run_tests.sql
```

## Basic Test Structure

```sql
-- tests/test_users.sql
BEGIN;
SELECT plan(5);  -- Number of tests

-- Test table exists
SELECT has_table('users', 'users table should exist');

-- Test columns
SELECT has_column('users', 'id', 'users should have id column');
SELECT has_column('users', 'email', 'users should have email column');
SELECT col_type_is('users', 'id', 'integer', 'id should be integer');
SELECT col_not_null('users', 'email', 'email should not be nullable');

SELECT * FROM finish();
ROLLBACK;
```

## Testing Functions

```sql
-- tests/test_calculate_total.sql
BEGIN;
SELECT plan(4);

-- Setup test data
INSERT INTO orders (id, amount) VALUES 
    (1, 100.00),
    (2, 200.00),
    (3, 150.00);

-- Test function exists
SELECT has_function('calculate_total', 'calculate_total function should exist');

-- Test function signature
SELECT function_returns('calculate_total', 'numeric', 
    'calculate_total should return numeric');

-- Test return value
SELECT is(
    calculate_total(),
    450.00::numeric,
    'calculate_total should sum all order amounts'
);

-- Test with empty table
DELETE FROM orders;
SELECT is(
    calculate_total(),
    0::numeric,
    'calculate_total should return 0 for empty table'
);

SELECT * FROM finish();
ROLLBACK;
```

## Schema Tests

```sql
BEGIN;
SELECT plan(10);

-- Table structure
SELECT has_table('orders');
SELECT has_pk('orders', 'orders should have primary key');
SELECT has_fk('orders', 'orders should have foreign key');

-- Column tests
SELECT columns_are('orders', ARRAY['id', 'user_id', 'amount', 'created_at']);
SELECT col_is_pk('orders', 'id');
SELECT col_is_fk('orders', 'user_id');
SELECT col_has_default('orders', 'created_at');
SELECT col_default_is('orders', 'created_at', 'now()');

-- Index tests
SELECT has_index('orders', 'idx_orders_user_id', 'should have user_id index');
SELECT index_is_unique('users', 'users_email_key');

SELECT * FROM finish();
ROLLBACK;
```

## Constraint Tests

```sql
BEGIN;
SELECT plan(4);

-- Test check constraints
SELECT has_check('orders', 'orders should have check constraint');
SELECT col_has_check('orders', 'amount', 'amount should have check constraint');

-- Test constraint behavior
SELECT throws_ok(
    $$INSERT INTO orders (user_id, amount) VALUES (1, -100)$$,
    23514,  -- Check violation error code
    NULL,
    'negative amount should violate constraint'
);

-- Test unique constraint
INSERT INTO users (email) VALUES ('test@example.com');
SELECT throws_ok(
    $$INSERT INTO users (email) VALUES ('test@example.com')$$,
    23505,  -- Unique violation
    NULL,
    'duplicate email should violate unique constraint'
);

SELECT * FROM finish();
ROLLBACK;
```

## Data Tests

```sql
BEGIN;
SELECT plan(6);

-- Setup
INSERT INTO users (id, email, role) VALUES
    (1, 'admin@test.com', 'admin'),
    (2, 'user@test.com', 'user');

-- Row count
SELECT is(
    (SELECT count(*) FROM users)::integer,
    2,
    'should have 2 users'
);

-- Query results
SELECT results_eq(
    'SELECT email FROM users WHERE role = ''admin''',
    ARRAY['admin@test.com'],
    'should find admin user'
);

-- Set comparison (order independent)
SELECT set_eq(
    'SELECT role FROM users',
    ARRAY['admin', 'user'],
    'should have admin and user roles'
);

-- Bag comparison (allows duplicates, order independent)
SELECT bag_eq(
    'SELECT role FROM users',
    $$VALUES ('admin'), ('user')$$,
    'roles should match'
);

-- Empty result
SELECT is_empty(
    'SELECT * FROM users WHERE role = ''superadmin''',
    'should have no superadmin users'
);

-- Row comparison
SELECT row_eq(
    'SELECT id, email FROM users WHERE id = 1',
    ROW(1, 'admin@test.com')::users,
    'user 1 should match expected row'
);

SELECT * FROM finish();
ROLLBACK;
```

## Trigger Tests

```sql
BEGIN;
SELECT plan(3);

-- Test trigger exists
SELECT has_trigger('users', 'update_timestamp_trigger');
SELECT trigger_is('users', 'update_timestamp_trigger', 'update_timestamp');

-- Test trigger behavior
INSERT INTO users (id, email) VALUES (1, 'test@test.com');
SELECT is(
    (SELECT updated_at FROM users WHERE id = 1),
    (SELECT created_at FROM users WHERE id = 1),
    'new record should have equal created_at and updated_at'
);

-- Update and verify trigger fired
UPDATE users SET email = 'new@test.com' WHERE id = 1;
SELECT isnt(
    (SELECT updated_at FROM users WHERE id = 1),
    (SELECT created_at FROM users WHERE id = 1),
    'updated_at should change after update'
);

SELECT * FROM finish();
ROLLBACK;
```

## Common Assertions

```sql
-- Equality
SELECT is(actual, expected, description);
SELECT isnt(actual, unexpected, description);

-- Boolean
SELECT ok(condition, description);

-- NULL handling
SELECT is(value, NULL, 'should be NULL');

-- Comparison
SELECT cmp_ok(a, '>', b, 'a should be greater than b');
SELECT cmp_ok(a, '<=', b, 'a should be <= b');

-- Pattern matching
SELECT matches(string, regex, description);
SELECT imatches(string, regex, 'case insensitive match');

-- Type checking
SELECT isa_ok(value, 'integer', description);
```

## Running Tests

```bash
# Using pg_prove (recommended)
pg_prove -d testdb tests/*.sql

# Verbose output
pg_prove -d testdb -v tests/*.sql

# Using psql directly
psql -d testdb -f tests/test_users.sql

# Run all tests with TAP output
psql -d testdb -c "SELECT * FROM runtests();"

# Run specific test file
psql -d testdb -f tests/test_calculate_total.sql
```

## Test Runner Script

```sql
-- tests/run_tests.sql
\i tests/test_users.sql
\i tests/test_orders.sql
\i tests/test_calculate_total.sql
```

## Best Practices

1. **Always wrap in transaction**: `BEGIN; ... ROLLBACK;` to not pollute test database
2. **Use `plan(n)`**: Declare expected number of tests upfront
3. **End with `finish()`**: Ensures all planned tests ran
4. **Descriptive messages**: Every assertion should have a clear description
5. **Test isolation**: Each test file should be independent
6. **Setup/teardown**: Create test data at start, rollback cleans it up
