import random
  
_mrpt_num_trials = 5 # number of bases to test
  
def is_prime(n):
    assert n >= 2
     
    if n == 2:
        return True
         
    if n % 2 == 0:
        return False
         
    s = 0
    d = n-1
    while True:
        quotient, remainder = divmod(d, 2)
        if remainder == 1:
            break
        s += 1
        d = quotient
    assert(2**s * d == n-1)
     
    def try_composite(a):
        if pow(a, d, n) == 1:
            return False
        for i in range(s):
            if pow(a, 2**i * d, n) == n-1:
                return False
        return True
  
    for i in range(_mrpt_num_trials):
        a = random.randrange(2, n)
        if try_composite(a):
            return False
  
    return True
         
def extEuclideanAlg(a, b) :
  if b == 0 :
      return 1,0,a
  else :
      x, y, gcd = extEuclideanAlg(b, a % b)
      return y, x - y * (a // b),gcd
 
def modInv(a,m) :
  x,y,gcd = extEuclideanAlg(a,m)
  if gcd == 1 :
      return x % m
  else :
      return None
       
def splitter(string):
    length = len(str(string))
    parts = []
    if (length % 2) != 0:
        return 0
    else:
        count = 0
        while count < length:
            parts.append(str(string)[count:(count+2)])
            count += 2
             
    return parts