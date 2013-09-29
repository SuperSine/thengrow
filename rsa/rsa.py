#!/usr/bin/env Python
 
import random
import mr_test as mra
import mod
 
class RSAEncrypt():
    def __init__(self):
        self.val_d = 0
        self.mod_n = 0
        self.int_e = 0
        self.phi_n = 0
        self.prime_p = 0
        self.prime_q = 0
        self.val_c = 0
        self.lowrange = 0
        self.highrange = 0
         
    def get_prime(self, lowrange, highrange):
        val = random.randint(lowrange, highrange)
        if mra.is_prime(val):
            return val
        else:
            return self.get_prime(lowrange, highrange)
             
    def distinct_prime(self, a, b, lowrange, highrange):
        while a == b:
            b = self.get_prime(lowrange, highrange)
            if b == a:
                continue
            else:
                break
                 
        return b
         
    def generate(self, string):
        self.lowrange = int(string)/2
        self.highrange = int(string)*2
        self.string = string
         
        prime_p = self.get_prime(self.lowrange, self.highrange)
        prime_q = self.get_prime(self.lowrange, self.highrange)
        prime_q = self.distinct_prime(prime_p, prime_q, self.lowrange, self.highrange)
         
        self.prime_p = prime_p
        self.prime_q = prime_q
         
        mod_n = (prime_p)*(prime_q)
        phi_n = (prime_p-1)*(prime_q-1)
        int_e = 65537
         
        self.mod_n = mod_n
        self.int_e = int_e
        self.phi_n = phi_n
         
        val_d = mra.modInv(int_e, phi_n)
        self.val_d = val_d
         
        return val_d, mod_n
         
    def encrypt(self, string):
        message = string
        val_c = (int(message)**self.int_e)%self.mod_n
        return val_c
         
    def decrypt(self, message, key, modu):
        val_m = (message**key)%modu
        return val_m
         
 
if __name__ == "__main__":
    string = mod.replace_string("hello, world!")
    message = mra.splitter(string)
    counter = 0
    rsa = RSAEncrypt()
     
    decrypted = ""
    key = []
    msg = []
    modval = []
     
    # encryption
    for x in message:
        kval = rsa.generate(x)
        mval = rsa.encrypt(x)
        modval.append(kval[1])
        key.append(kval[0])
        msg.append(mval)
         
    # decryption
    for y in msg:
        decrypted += str(rsa.decrypt(y, key[counter], modval[counter]))
        counter += 1
         
    print decrypted
    print mod.revert_string(decrypted)