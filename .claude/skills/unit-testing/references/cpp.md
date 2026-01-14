# C++ Testing with Google Test

## File Organization

```
project/
├── src/
│   ├── calculator.cpp
│   └── calculator.h
├── tests/
│   ├── CMakeLists.txt
│   ├── calculator_test.cpp
│   └── test_main.cpp
└── CMakeLists.txt
```

## CMake Setup

```cmake
# tests/CMakeLists.txt
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG release-1.12.1
)
FetchContent_MakeAvailable(googletest)

enable_testing()

add_executable(tests
  test_main.cpp
  calculator_test.cpp
)

target_link_libraries(tests
  GTest::gtest_main
  GTest::gmock
  calculator_lib
)

include(GoogleTest)
gtest_discover_tests(tests)
```

## Basic Test Structure

```cpp
// calculator_test.cpp
#include <gtest/gtest.h>
#include "calculator.h"

TEST(CalculatorTest, AddPositiveNumbers) {
    Calculator calc;
    EXPECT_EQ(calc.add(2, 3), 5);
}

TEST(CalculatorTest, AddNegativeNumbers) {
    Calculator calc;
    EXPECT_EQ(calc.add(-2, -3), -5);
}

TEST(CalculatorTest, DivideByZeroThrows) {
    Calculator calc;
    EXPECT_THROW(calc.divide(10, 0), std::invalid_argument);
}

TEST(CalculatorTest, DivideReturnsCorrectResult) {
    Calculator calc;
    EXPECT_DOUBLE_EQ(calc.divide(10.0, 2.0), 5.0);
}
```

## Test Fixtures

```cpp
class DatabaseTest : public ::testing::Test {
protected:
    void SetUp() override {
        db = std::make_unique<TestDatabase>();
        db->connect("test_db");
    }
    
    void TearDown() override {
        db->disconnect();
    }
    
    std::unique_ptr<TestDatabase> db;
};

TEST_F(DatabaseTest, InsertAndRetrieve) {
    db->insert("key", "value");
    EXPECT_EQ(db->get("key"), "value");
}

TEST_F(DatabaseTest, GetNonexistentKeyReturnsEmpty) {
    EXPECT_TRUE(db->get("nonexistent").empty());
}
```

## Parametrized Tests

```cpp
class ClassifyTest : public ::testing::TestWithParam<std::tuple<int, std::string>> {};

TEST_P(ClassifyTest, ReturnsCorrectCategory) {
    auto [input, expected] = GetParam();
    EXPECT_EQ(classify(input), expected);
}

INSTANTIATE_TEST_SUITE_P(
    ClassifyTests,
    ClassifyTest,
    ::testing::Values(
        std::make_tuple(0, "zero"),
        std::make_tuple(1, "positive"),
        std::make_tuple(-1, "negative"),
        std::make_tuple(100, "positive")
    )
);

// Type-parametrized tests
template <typename T>
class ContainerTest : public ::testing::Test {
protected:
    T container;
};

using ContainerTypes = ::testing::Types<std::vector<int>, std::list<int>>;
TYPED_TEST_SUITE(ContainerTest, ContainerTypes);

TYPED_TEST(ContainerTest, StartsEmpty) {
    EXPECT_TRUE(this->container.empty());
}
```

## Assertions

```cpp
// Boolean
EXPECT_TRUE(condition);
EXPECT_FALSE(condition);

// Comparison
EXPECT_EQ(actual, expected);    // ==
EXPECT_NE(actual, unexpected);  // !=
EXPECT_LT(a, b);                // <
EXPECT_LE(a, b);                // <=
EXPECT_GT(a, b);                // >
EXPECT_GE(a, b);                // >=

// String comparison
EXPECT_STREQ(actual, expected);      // C-strings equal
EXPECT_STRNE(actual, unexpected);    // C-strings not equal
EXPECT_STRCASEEQ(actual, expected);  // Case-insensitive

// Floating point
EXPECT_FLOAT_EQ(actual, expected);   // ~4 ULP tolerance
EXPECT_DOUBLE_EQ(actual, expected);
EXPECT_NEAR(actual, expected, abs_error);

// Exceptions
EXPECT_THROW(statement, exception_type);
EXPECT_ANY_THROW(statement);
EXPECT_NO_THROW(statement);

// Death tests
EXPECT_DEATH(statement, regex);
EXPECT_EXIT(statement, predicate, regex);

// Use ASSERT_* for fatal failures (stops test)
ASSERT_EQ(ptr, nullptr) << "Pointer should be null";
```

## Mocking with Google Mock

```cpp
#include <gmock/gmock.h>

class MockDatabase : public DatabaseInterface {
public:
    MOCK_METHOD(std::string, get, (const std::string& key), (override));
    MOCK_METHOD(void, set, (const std::string& key, const std::string& value), (override));
    MOCK_METHOD(bool, connect, (const std::string& url), (override));
};

using ::testing::_;
using ::testing::Return;
using ::testing::Throw;
using ::testing::AtLeast;

TEST(ServiceTest, CallsDatabase) {
    MockDatabase mockDb;
    
    EXPECT_CALL(mockDb, connect(_))
        .Times(1)
        .WillOnce(Return(true));
    
    EXPECT_CALL(mockDb, get("user:1"))
        .Times(AtLeast(1))
        .WillOnce(Return("John"));
    
    Service service(&mockDb);
    EXPECT_EQ(service.getUser("1"), "John");
}

TEST(ServiceTest, HandlesDbFailure) {
    MockDatabase mockDb;
    
    EXPECT_CALL(mockDb, get(_))
        .WillOnce(Throw(std::runtime_error("connection lost")));
    
    Service service(&mockDb);
    EXPECT_THROW(service.getUser("1"), std::runtime_error);
}
```

## Matchers

```cpp
using namespace ::testing;

// Value matchers
EXPECT_THAT(value, Eq(expected));
EXPECT_THAT(value, Ne(unexpected));
EXPECT_THAT(value, Gt(0));
EXPECT_THAT(ptr, IsNull());
EXPECT_THAT(ptr, NotNull());

// String matchers
EXPECT_THAT(str, StartsWith("Hello"));
EXPECT_THAT(str, EndsWith("world"));
EXPECT_THAT(str, HasSubstr("lo wo"));
EXPECT_THAT(str, MatchesRegex("H.*d"));

// Container matchers
EXPECT_THAT(vec, IsEmpty());
EXPECT_THAT(vec, SizeIs(3));
EXPECT_THAT(vec, Contains(42));
EXPECT_THAT(vec, ElementsAre(1, 2, 3));
EXPECT_THAT(vec, UnorderedElementsAre(3, 1, 2));
EXPECT_THAT(vec, Each(Gt(0)));

// Composite matchers
EXPECT_THAT(value, AllOf(Gt(0), Lt(100)));
EXPECT_THAT(value, AnyOf(Eq(1), Eq(2)));
EXPECT_THAT(value, Not(Eq(0)));
```

## Running Tests

```bash
# Build and run
mkdir build && cd build
cmake ..
make
./tests

# Run specific tests
./tests --gtest_filter=CalculatorTest.*
./tests --gtest_filter=*Add*
./tests --gtest_filter=-*Slow*  # Exclude

# Other options
./tests --gtest_repeat=10       # Run multiple times
./tests --gtest_shuffle         # Randomize order
./tests --gtest_output=xml:report.xml
./tests --gtest_list_tests      # List without running
```
