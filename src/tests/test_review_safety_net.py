import pytest

from src.review import calculate_next_review


def test_score_two_returns_three_days():
    score = 2

    days = calculate_next_review(score)

    assert days == 3
    
def test_score_four_returns_fourteen_days():
    score = 3

    days = calculate_next_review(score)

    assert days == 14

def test_minimum_score_returns_one_day():
    score = 0

    days = calculate_next_review(score)

    assert days == 1

def test_maximum_score_returns_thirty_days():
    score = 5

    days = calculate_next_review(score)

    assert days == 30
    
def test_negative_score_raises_error():
    with pytest.raises(ValueError):
        calculate_next_review(-1)
        
def test_score_above_five_raises_error():
    with pytest.raises(ValueError):
        calculate_next_review(6)