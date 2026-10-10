import pytest
from hypothesis import given, strategies as st

from src.review import calculate_next_review


# Property 1:
# Valid scores must always produce a positive review interval.
@given(st.integers(min_value=0, max_value=5))
def test_review_interval_is_always_positive(score):
    result = calculate_next_review(score)

    assert result > 0


# Property 2:
# A higher score must never result in a shorter review interval.
@given(
    st.integers(min_value=0, max_value=5),
    st.integers(min_value=0, max_value=5)
)
def test_higher_score_never_reduces_interval(score1, score2):
    if score1 <= score2:
        interval1 = calculate_next_review(score1)
        interval2 = calculate_next_review(score2)

        assert interval1 <= interval2


# Property 3:
# Every score outside the valid range must be rejected.
@given(
    st.one_of(
        st.integers(max_value=-1),
        st.integers(min_value=6)
    )
)
def test_invalid_score_always_raises_error(score):
    with pytest.raises(ValueError):
        calculate_next_review(score)