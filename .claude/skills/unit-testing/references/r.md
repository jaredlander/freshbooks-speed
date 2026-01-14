# R Testing with testthat

## File Organization

```
package/
├── R/
│   └── functions.R
├── tests/
│   ├── testthat.R           # Test runner
│   └── testthat/
│       ├── setup.R          # Shared setup
│       ├── helper-utils.R   # Helper functions
│       └── test-functions.R # Tests (must start with test-)
└── DESCRIPTION
```

## Test Runner (tests/testthat.R)

```r
library(testthat)
library(yourpackage)

test_check("yourpackage")
```

## Test Structure

```r
# tests/testthat/test-functions.R

test_that("function returns expected value for valid input", {
  # Arrange
  input_data <- list(key = "value")
  
  # Act
  result <- function_under_test(input_data)
  
  # Assert
  expect_equal(result, expected_value)
})

test_that("function throws error for empty input", {
  expect_error(
    function_under_test(list()),
    "cannot be empty"
  )
})

test_that("function handles NULL gracefully", {
  result <- function_under_test(NULL)
  expect_null(result)
})
```

## Grouping Tests with describe()

```r
describe("calculate_stats()", {
  it("computes mean correctly", {
    result <- calculate_stats(c(1, 2, 3))
    expect_equal(result$mean, 2)
  })
  
  it("handles empty vector", {
    expect_warning(calculate_stats(numeric(0)))
  })
  
  describe("with missing values", {
    it("excludes NA by default", {
      result <- calculate_stats(c(1, NA, 3))
      expect_equal(result$mean, 2)
    })
  })
})
```

## Common Expectations

```r
# Equality
expect_equal(result, expected)              # Uses all.equal()
expect_identical(result, expected)          # Exact match
expect_equivalent(result, expected)         # Ignores attributes

# Type checks
expect_type(result, "double")
expect_s3_class(result, "data.frame")
expect_s4_class(result, "MyS4Class")

# Logical
expect_true(condition)
expect_false(condition)
expect_null(result)

# Comparisons
expect_lt(x, y)   # less than
expect_lte(x, y)  # less than or equal
expect_gt(x, y)   # greater than
expect_gte(x, y)  # greater than or equal

# String matching
expect_match(string, "pattern")

# Length and names
expect_length(result, 5)
expect_named(result, c("a", "b", "c"))

# Errors and warnings
expect_error(expr, "error message pattern")
expect_warning(expr, "warning pattern")
expect_message(expr, "message pattern")
expect_condition(expr, class = "custom_condition")

# Silent execution
expect_silent(expr)

# Output
expect_output(print(x), "expected output")
```

## Fixtures and Setup

```r
# tests/testthat/setup.R - runs before all tests
library(dplyr)

# tests/testthat/helper-utils.R - helper functions available to all tests
create_test_data <- function(n = 10) {
  data.frame(
    id = seq_len(n),
    value = rnorm(n)
  )
}

# Local setup within test file
local_setup <- function(env = parent.frame()) {
  # Setup code
  withr::defer(cleanup_code(), envir = env)
}
```

## Mocking with mockery

```r
library(mockery)

test_that("function calls external API", {
  # Create mock
  mock_fetch <- mock(list(data = "test"))
  
  # Stub the function
  stub(my_function, "fetch_from_api", mock_fetch)
  
  # Act
  result <- my_function()
  
  # Assert mock was called
  expect_called(mock_fetch, 1)
  expect_args(mock_fetch, 1, "https://api.example.com")
})
```

## Snapshot Testing

```r
test_that("output matches snapshot", {
  result <- generate_report(test_data)
  expect_snapshot(result)
})

test_that("plot matches snapshot", {
  expect_snapshot_file(
    save_png(my_plot()),
    "expected_plot.png"
  )
})
```

## Skipping Tests

```r
test_that("requires database", {
  skip_if_not(db_available(), "Database not available")
  # Test code
})

test_that("slow test", {
  skip_on_cran()
  skip_on_ci()
  # Expensive test
})

skip_if_offline()
skip_on_os("windows")
```

## Running Tests

```r
# Run all tests
devtools::test()

# Run specific file
testthat::test_file("tests/testthat/test-functions.R")

# Run with filter
devtools::test(filter = "calculate")

# Coverage
covr::package_coverage()
covr::report()
```
