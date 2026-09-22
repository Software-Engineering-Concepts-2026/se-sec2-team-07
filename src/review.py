def calculate_next_review(score):
    if score < 0 or score > 5:
        raise ValueError("Score must be between 0 and 5")

    if score < 1:
        return 1
    elif score == 2:
        return 3
    elif score == 3:
        return 7
    elif score == 4:
        return 14
    else:
        return 30