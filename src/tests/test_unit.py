import pytest
from src.review import calculate_next_review


# Test 1: Lower boundary
def test_score_zero_returns_one_day():
    # Arrange
    score = 0

    # Act
    result = calculate_next_review(score)

    # Assert
    assert result == 1


# Test 2: Upper boundary of "forgot" partition
def test_score_one_returns_one_day():
    # Arrange
    score = 1

    # Act
    result = calculate_next_review(score)

    # Assert
    assert result == 1


# Test 3: Middle valid partition
def test_score_three_returns_seven_days():
    # Arrange
    score = 3

    # Act
    result = calculate_next_review(score)

    # Assert
    assert result == 7


# Test 4: Maximum valid boundary
def test_score_five_returns_thirty_days():
    # Arrange
    score = 5

    # Act
    result = calculate_next_review(score)

    # Assert
    assert result == 30


# Test 5: Invalid partition
def test_score_above_five_raises_error():
    # Arrange
    score = 6

    # Act & Assert
    with pytest.raises(ValueError):
        calculate_next_review(score)