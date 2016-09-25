//We let everyone use these.
module.exports = {
    readPrimes: readPrimes,
    test_poly: test_poly,
    print_quad: print_quad
};
//File write/read
var fs = require('fs');
//Binary convert
var atob = require('atob');

//Store a bit set of primes here
var prime_array;

//Returns the indexth bit of v
function get_bit(v, index) {
    return (v >> index) & 1;
}

function readPrimes() {
    var prime_dat = fs.readFileSync("./primes.dat");
    var i = 0;
    var b1, b2, b3, b4;
    var bitset = [];
    for (i = 0; i < prime_dat.length / 4; i += 4) {
        b1 = prime_dat[i] >>> 0;  
        b2 = prime_dat[i + 1] << 8 >>> 0;
        b3 = prime_dat[i + 2] << 16 >>> 0;
        b4 = prime_dat[i + 3] << 24 >>> 0;
        bitset.push(b1 + b2 + b3 + b4);
    }
    prime_array = bitset;
    return bitset;
}

//Tests a polynomial
function test_poly(p) {
    var cons = 0;
    var dist = 0;
    var x = 0;
    var evpx = ev(p, x);
    var evals = [];
    var alld = true;
    while (isprime(evpx)) {
        if (alld) {
            if (evals.indexOf(evpx) == -1) {
                ++dist;
            } else {
                alld = false;
            }
        }
        ++cons;
        ++x;
        evals.push(evpx);
        evpx = ev(p, x);
    }
    return {
        consecutive: cons,
        distinct: dist,
        equation: p,
    };
}
//Returns string of quadratic
function print_quad(i, j, k) {
    var res = "";
    if (k != 0) {
        if (k < 0) {
            res += "-";
        }
        if (Math.abs(k) != 1) {
            res += Math.abs(k);
        }
        res += "x^2";
    }
    if (j != 0) {
        if (j < 0) {
            res += "-";
        } else {
            res += "+";
        }
        if (Math.abs(j) != 1) {
            res += Math.abs(j);
        }
        res += "x";

    }
     if (i != 0) {
        if (i < 0) {
            res += "-";
        } else {
            res += "+";
        }
        if (Math.abs(i) != 1) {
            res += Math.abs(i);
        }
    }
    return res;
}