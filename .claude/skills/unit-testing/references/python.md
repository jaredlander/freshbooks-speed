# Python Testing with pytest

## File Organization

```
project/
├── src/
│   └── mypackage/
│       └── module.py
└── tests/
    ├── conftest.py          # Shared fixtures
    ├── test_module.py       # Tests mirror source structure
    └── integration/
        └── test_api.py      # Integration tests separate
```

## Test Structure

```python
import pytest
from mypackage.module import function_under_test

class TestFunctionUnderTest:
    """Group related tests in classes."""
    
    def test_returns_expected_value_for_valid_input(self):
        # Arrange
        input_data = {"key": "value"}
        
        # Act
        result = function_under_test(input_data)
        
        # Assert
        assert result == expected_value
    
    def test_raises_value_error_for_empty_input(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            function_under_test({})
    
    def test_handles_none_input_gracefully(self):
        result = function_under_test(None)
        assert result is None
```

## Fixtures

```python
# conftest.py
import pytest

@pytest.fixture
def sample_user():
    """Reusable test data."""
    return {"id": 1, "name": "Test User"}

@pytest.fixture
def db_session(tmp_path):
    """Database session with cleanup."""
    db = create_test_db(tmp_path / "test.db")
    yield db
    db.close()

@pytest.fixture(autouse=True)
def reset_environment(monkeypatch):
    """Auto-applied fixture for all tests."""
    monkeypatch.setenv("ENV", "test")
```

## Parametrized Tests

```python
@pytest.mark.parametrize("input_val,expected", [
    (0, "zero"),
    (1, "positive"),
    (-1, "negative"),
    (100, "positive"),
])
def test_classify_number(input_val, expected):
    assert classify_number(input_val) == expected

@pytest.mark.parametrize("invalid_input", [None, "", [], {}])
def test_rejects_invalid_inputs(invalid_input):
    with pytest.raises(ValueError):
        process_input(invalid_input)
```

## Mocking

```python
from unittest.mock import Mock, patch, MagicMock

def test_calls_external_api(mocker):
    # Using pytest-mock
    mock_response = mocker.patch("mypackage.module.requests.get")
    mock_response.return_value.json.return_value = {"data": "test"}
    
    result = fetch_data()
    
    mock_response.assert_called_once_with("https://api.example.com")
    assert result == {"data": "test"}

def test_with_context_manager():
    with patch("mypackage.module.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2024, 1, 1)
        result = get_current_date()
        assert result == "2024-01-01"
```

## Async Testing

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_fetch_data()
    assert result is not None

@pytest.fixture
async def async_client():
    async with AsyncClient() as client:
        yield client
```

## Running Tests

```bash
pytest                          # Run all tests
pytest tests/test_module.py     # Specific file
pytest -k "test_valid"          # Match test names
pytest -x                       # Stop on first failure
pytest --cov=src                # Coverage report
pytest -v                       # Verbose output
pytest --tb=short               # Shorter tracebacks
```

## Common Assertions

```python
assert result == expected
assert result != unexpected
assert result is None
assert result is not None
assert isinstance(result, ExpectedType)
assert "substring" in result
assert len(result) == expected_length
assert result == pytest.approx(3.14, rel=1e-2)  # Floating point
assert all(item > 0 for item in result)
```
