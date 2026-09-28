# Saboteur Testing Journal

## Bug

Changed the condition in `calculate_next_review()` from:

`score <= 1`

to:

`score < 1`

This intentionally caused incorrect behavior when `score = 1`.

## Test Result

The unit test `test_score_one_returns_one_day` detected the bug.

GitHub Actions also failed after the sabotage commit was pushed.

## Recovery

The condition was changed back to:

`score <= 1`

After fixing the code, all tests passed again.

## Result

Saboteur detected: Yes
