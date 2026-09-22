from src.fizzbuzz import fizzbuzz


def test_fizzbuzz_3():
    assert fizzbuzz(3) == "Fizz"


def test_fizzbuzz_1():
    assert fizzbuzz(1) == "1"
    
def test_fizzbuzz_5():
    assert fizzbuzz(5) == "Buzz"
    
def test_fizzbuzz_15():
    assert fizzbuzz(15) == "FizzBuzz"