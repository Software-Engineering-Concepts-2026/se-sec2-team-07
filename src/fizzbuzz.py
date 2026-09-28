def is_multiple(n, divisor):
    return n % divisor == 0


def fizzbuzz(n):
    if is_multiple(n, 15):
        return "FizzBuzz"
    if is_multiple(n, 3):
        return "Fizz"
    if is_multiple(n, 5):
        return "Buzz"
    return str(n)