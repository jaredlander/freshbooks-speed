# Rust Testing

## File Organization

```
src/
├── lib.rs           # Unit tests in same file or tests module
├── module.rs
└── module/
    └── tests.rs     # Submodule tests
tests/               # Integration tests (separate crate)
    └── integration_test.rs
```

## Unit Tests (same file)

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn divide(a: f64, b: f64) -> Result<f64, &'static str> {
    if b == 0.0 {
        Err("division by zero")
    } else {
        Ok(a / b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_positive_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_add_negative_numbers() {
        assert_eq!(add(-2, -3), -5);
    }

    #[test]
    fn test_add_zero() {
        assert_eq!(add(0, 5), 5);
    }

    #[test]
    fn test_divide_success() {
        let result = divide(10.0, 2.0).unwrap();
        assert!((result - 5.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_divide_by_zero_returns_error() {
        let result = divide(10.0, 0.0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "division by zero");
    }

    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn test_panics_on_invalid_index() {
        let v = vec![1, 2, 3];
        let _ = v[10];
    }
}
```

## Common Assertions

```rust
// Equality
assert_eq!(actual, expected);
assert_ne!(actual, unexpected);

// Boolean
assert!(condition);
assert!(result.is_some());
assert!(result.is_ok());
assert!(result.is_err());

// With custom message
assert_eq!(actual, expected, "Failed for input: {}", input);

// Pattern matching
assert!(matches!(result, Ok(_)));
assert!(matches!(result, Err(MyError::NotFound)));

// Floating point comparison
assert!((actual - expected).abs() < 1e-10);

// Option/Result unwrapping in tests
let value = result.expect("should return Ok");
```

## Test Organization

```rust
#[cfg(test)]
mod tests {
    use super::*;

    mod add_tests {
        use super::*;

        #[test]
        fn handles_positive_numbers() { /* ... */ }

        #[test]
        fn handles_negative_numbers() { /* ... */ }
    }

    mod divide_tests {
        use super::*;

        #[test]
        fn returns_correct_quotient() { /* ... */ }

        #[test]
        fn returns_error_for_zero_divisor() { /* ... */ }
    }
}
```

## Integration Tests (tests/ directory)

```rust
// tests/integration_test.rs
use my_crate::{Config, process};

#[test]
fn test_full_workflow() {
    let config = Config::default();
    let result = process(&config, "input data");
    assert!(result.is_ok());
}

// Shared test utilities
// tests/common/mod.rs
pub fn setup() -> TestContext {
    TestContext::new()
}

// tests/another_test.rs
mod common;

#[test]
fn test_with_setup() {
    let ctx = common::setup();
    // ...
}
```

## Test Fixtures with rstest

```toml
# Cargo.toml
[dev-dependencies]
rstest = "0.18"
```

```rust
use rstest::*;

#[fixture]
fn database() -> TestDb {
    TestDb::new()
}

#[rstest]
fn test_with_fixture(database: TestDb) {
    database.insert("key", "value");
    assert_eq!(database.get("key"), Some("value"));
}

// Parametrized tests
#[rstest]
#[case(0, "zero")]
#[case(1, "positive")]
#[case(-1, "negative")]
fn test_classify(#[case] input: i32, #[case] expected: &str) {
    assert_eq!(classify(input), expected);
}

// Matrix testing
#[rstest]
fn test_combinations(
    #[values(1, 2, 3)] a: i32,
    #[values("x", "y")] b: &str,
) {
    // Runs 6 times (3 * 2)
}
```

## Mocking with mockall

```toml
# Cargo.toml
[dev-dependencies]
mockall = "0.12"
```

```rust
use mockall::*;

#[automock]
trait Database {
    fn get(&self, key: &str) -> Option<String>;
    fn set(&mut self, key: &str, value: &str);
}

#[test]
fn test_with_mock_database() {
    let mut mock = MockDatabase::new();
    
    mock.expect_get()
        .with(eq("key"))
        .times(1)
        .returning(|_| Some("value".to_string()));
    
    let result = function_using_database(&mock);
    assert!(result.is_ok());
}
```

## Async Tests

```toml
# Cargo.toml
[dev-dependencies]
tokio = { version = "1", features = ["rt", "macros"] }
```

```rust
#[tokio::test]
async fn test_async_function() {
    let result = fetch_data().await;
    assert!(result.is_ok());
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn test_concurrent_operations() {
    // ...
}
```

## Running Tests

```bash
cargo test                        # Run all tests
cargo test test_name              # Run matching tests
cargo test -- --nocapture         # Show println! output
cargo test -- --test-threads=1    # Single threaded
cargo test --release              # Test with optimizations
cargo test -p my_crate            # Specific package in workspace
cargo test --doc                  # Run doc tests
```

## Doc Tests

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// use my_crate::add;
/// assert_eq!(add(2, 3), 5);
/// ```
///
/// ```should_panic
/// use my_crate::divide;
/// divide(1, 0).unwrap(); // panics!
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```
