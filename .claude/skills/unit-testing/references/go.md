# Go Testing

## File Organization

```
package/
├── user.go
├── user_test.go        # Tests in same package
├── user_internal_test.go  # Internal tests (package_test)
└── testdata/           # Test fixtures
    └── sample.json
```

## Basic Test Structure

```go
// user_test.go
package user

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestAdd(t *testing.T) {
    // Arrange
    a, b := 2, 3
    
    // Act
    result := Add(a, b)
    
    // Assert
    assert.Equal(t, 5, result)
}

func TestDivide(t *testing.T) {
    t.Run("valid division", func(t *testing.T) {
        result, err := Divide(10, 2)
        require.NoError(t, err)
        assert.Equal(t, 5.0, result)
    })
    
    t.Run("division by zero", func(t *testing.T) {
        _, err := Divide(10, 0)
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "division by zero")
    })
}
```

## Table-Driven Tests

```go
func TestClassify(t *testing.T) {
    tests := []struct {
        name     string
        input    int
        expected string
    }{
        {"zero", 0, "zero"},
        {"positive", 5, "positive"},
        {"negative", -3, "negative"},
        {"large positive", 1000000, "positive"},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Classify(tt.input)
            assert.Equal(t, tt.expected, result)
        })
    }
}

// With error cases
func TestParse(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {"valid number", "42", 42, false},
        {"negative", "-5", -5, false},
        {"invalid", "abc", 0, true},
        {"empty", "", 0, true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Parse(tt.input)
            if tt.wantErr {
                assert.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

## Testify Assertions

```go
import (
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// assert continues on failure, require stops
func TestAssertions(t *testing.T) {
    // Equality
    assert.Equal(t, expected, actual)
    assert.NotEqual(t, unexpected, actual)
    assert.EqualValues(t, expected, actual)  // Type conversion
    
    // Nil checks
    assert.Nil(t, value)
    assert.NotNil(t, value)
    
    // Boolean
    assert.True(t, condition)
    assert.False(t, condition)
    
    // Collections
    assert.Len(t, slice, 5)
    assert.Empty(t, slice)
    assert.NotEmpty(t, slice)
    assert.Contains(t, slice, element)
    assert.ElementsMatch(t, expected, actual)  // Order independent
    
    // Strings
    assert.Contains(t, str, "substring")
    assert.Regexp(t, `\d+`, str)
    
    // Errors
    assert.Error(t, err)
    assert.NoError(t, err)
    assert.ErrorIs(t, err, ErrNotFound)
    assert.ErrorContains(t, err, "not found")
    
    // Type
    assert.IsType(t, &User{}, result)
    
    // Floating point
    assert.InDelta(t, expected, actual, 0.001)
    
    // JSON
    assert.JSONEq(t, `{"a": 1}`, jsonStr)
}
```

## Mocking with testify/mock

```go
import "github.com/stretchr/testify/mock"

// Define mock
type MockDatabase struct {
    mock.Mock
}

func (m *MockDatabase) Get(key string) (string, error) {
    args := m.Called(key)
    return args.String(0), args.Error(1)
}

func (m *MockDatabase) Set(key, value string) error {
    args := m.Called(key, value)
    return args.Error(0)
}

// Use in test
func TestServiceWithMock(t *testing.T) {
    mockDB := new(MockDatabase)
    
    mockDB.On("Get", "user:1").Return("John", nil)
    mockDB.On("Set", "user:1", mock.Anything).Return(nil)
    
    service := NewService(mockDB)
    result, err := service.GetUser("1")
    
    require.NoError(t, err)
    assert.Equal(t, "John", result)
    mockDB.AssertExpectations(t)
    mockDB.AssertCalled(t, "Get", "user:1")
}
```

## Test Fixtures and Setup

```go
func TestMain(m *testing.M) {
    // Global setup
    setup()
    code := m.Run()
    // Global teardown
    teardown()
    os.Exit(code)
}

func TestWithSetup(t *testing.T) {
    // Per-test setup
    db := setupTestDB(t)
    t.Cleanup(func() {
        db.Close()
    })
    
    // Test code
}

// Test helper
func setupTestDB(t *testing.T) *DB {
    t.Helper()  // Marks as helper for better error reporting
    db, err := NewTestDB()
    require.NoError(t, err)
    return db
}

// Load test fixtures
func loadFixture(t *testing.T, name string) []byte {
    t.Helper()
    data, err := os.ReadFile(filepath.Join("testdata", name))
    require.NoError(t, err)
    return data
}
```

## HTTP Testing

```go
import (
    "net/http"
    "net/http/httptest"
)

func TestHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/1", nil)
    w := httptest.NewRecorder()
    
    handler := NewUserHandler()
    handler.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "John")
}

func TestWithMockServer(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`{"id": 1, "name": "John"}`))
    }))
    defer server.Close()
    
    client := NewAPIClient(server.URL)
    user, err := client.GetUser(1)
    
    require.NoError(t, err)
    assert.Equal(t, "John", user.Name)
}
```

## Benchmarks

```go
func BenchmarkSort(b *testing.B) {
    data := generateTestData(1000)
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        Sort(data)
    }
}

func BenchmarkSortParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            data := generateTestData(1000)
            Sort(data)
        }
    })
}
```

## Running Tests

```bash
go test                     # Current package
go test ./...               # All packages
go test -v                  # Verbose
go test -run TestName       # Match test name
go test -run TestUser/valid # Run subtest
go test -count=1            # Disable cache
go test -race               # Race detector
go test -cover              # Coverage summary
go test -coverprofile=c.out # Coverage file
go tool cover -html=c.out   # HTML report
go test -bench=.            # Run benchmarks
go test -short              # Skip long tests
```
