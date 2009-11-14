/*
The MIT License

Copyright (c)2009 Андрій Овчаренко (Andrey Ovcharenko)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
// bi2php v0.1.113.alfa from http://code.google.com/p/bi2php/
// Base on dave@ohdave.com


// BigInt, a suite of routines for performing multiple-precision arithmetic in
// JavaScript.
//
// Copyright 1998-2005 David Shapiro.
//
// You may use, re-use, abuse,
// copy, and modify this code to your liking, but please keep this header.
// Thanks!
//
// Dave Shapiro
// dave@ohdave.com

// IMPORTANT THING: Be sure to set maxDigits according to your precision
// needs. Use the setMaxDigits() function to do this. See comments below.
//
// Tweaked by Ian Bunning
// Alterations:
// Fix bug in function biFromHex(s) to allow
// parsing of strings of length != 0 (mod 4)

// Changes made by Dave Shapiro as of 12/30/2004:
//
// The BigInt() constructor doesn't take a string anymore. If you want to
// create a BigInt from a string, use biFromDecimal() for base-10
// representations, biFromHex() for base-16 representations, or
// biFromString() for base-2-to-36 representations.
//
// biFromArray() has been removed. Use biCopy() instead, passing a BigInt
// instead of an array.
//
// The BigInt() constructor now only constructs a zeroed-out array.
// Alternatively, if you pass <true>, it won't construct any array. See the
// biCopy() method for an example of this.
//
// Be sure to set maxDigits depending on your precision needs. The default
// zeroed-out array ZERO_ARRAY is constructed inside the setMaxDigits()
// function. So use this function to set the variable. DON'T JUST SET THE
// VALUE. USE THE FUNCTION.
//
// ZERO_ARRAY exists to hopefully speed up construction of BigInts(). By
// precalculating the zero array, we can just use slice(0) to make copies of
// it. Presumably this calls faster native code, as opposed to setting the
// elements one at a time. I have not done any timing tests to verify this
// claim.

var biRadixBase = 2;
var biRadixBits = 16;
    biRadixBits = biRadixBits - biRadixBits % 4;
var bitsPerDigit = biRadixBits;
var biRadix = 1 << biRadixBits; // = 2^16 = 65536
var biHalfRadix = biRadix >>> 1;
var biRadixSquared = biRadix * biRadix;
var maxDigitVal = biRadix - 1;
var maxInteger = 4294967295; 
var biHexPerDigit = biRadixBits / 4;
var bigZero = biFromNumber(0);
var bigOne = biFromNumber(1);

// The maximum number of digits in base 10 you can convert to an
// integer without JavaScript throwing up on you.
var dpl10 = 9;
// lr10 = 10 ^ dpl10
var lr10 = biFromNumber(1000000000);

function biBigInt(i){
	var result = [];
	result.isNeg = false;
	if (!i)
		i = 1;
	while (i > 0)
		result[--i] = 0;
	return result;
}

function biIsZero(bi){
	return bi[0] == 0 && biNormalize(bi).length == 1;
}

function biIsOne(bi){
	return bi[0] == 1 && !bi.isNeg && biNormalize(bi).length == 1;
}

function biIsEqual(x, y){
	if (x.isNeg != y.isNeg)
		return false;
	if (x.length != y.length)
		return false;
	for (var i = x.length - 1; i > -1; i--)
		if (x[i] != y[i])
			return false;
	return true;
}

function biBlankZero(bi){
	bi.length = 1;
	bi[0] = 0;
	bi.isNeg = false;
}

function biBlankOne(bi){
	bi.length = 1;
	bi[0] = 1;
	bi.isNeg = false;
}

function biBlankEmpty(bi){
	bi.length = 0;
}

function biCopy(bi){
	var result =  bi.slice(0);
	result.isNeg = bi.isNeg;
	return result;
}

function biAbs(bi){
	var result = bi.slice(0);
	result.isNeg = false;
	return result;
}

function biMinus(bi){
	var result = bi.slice(0);
	result.isNeg = !bi.isNeg;
	return result;
}

function biFromNumber(i){
	if (Math.abs(i) > maxInteger)
		return (biFromFloat(i));
	var result = biBigInt();
	if (result.isNeg = i < 0)
		i = -i;
	var j = 0;
	while (i > 0){
		result[j++] = i & maxDigitVal;
		i >>>= biRadixBits;
	}
	return result;
}

function biFromFloat(i){
	var result = biBigInt();
	if (result.isNeg = i < 0)
		i = -i;
	var j = 0;
	while (i > 0){
		var c = Math.floor(i / biRadix);
		result[j++] = i - c * biRadix;
		i = c;
	}
	return result;
}

function biFromString(s, radix){
	if (radix == 16)
		return biFromHex(s);
	var isNeg = s.charAt(0) == '-';
	var first = (isNeg ? 1 : 0) - 1;
	var result = biBigInt();
	var place = biCopy(bigOne);
	for (var i = s.length - 1; i > first; i--){
		var c = s.charCodeAt(i);
		var digit = charToHex(c);
		var biDigit = biMultiplyDigit(place, digit);
		result = biAdd(result, biDigit);
		place = biMultiplyDigit(place, radix);
	}
	result.isNeg = isNeg;
	return biNormalize(result);
}

function biFromDecimal(s){
	return biFromString(s, 10);
}

function biFromHex(s){
	var result = biBigInt();
	if (s.charAt(0) == '-'){
		result.isNeg = true;
		s = s.substr(1);
	}else{
		result.isNeg = false;
	}
	var sl = s.length;
	for (var i = sl, j = 0; i > 0; i -= biHexPerDigit, j++)
		result[j] = hexToDigit(s.substr(Math.max(i - biHexPerDigit, 0), Math.min(i, biHexPerDigit)));
	return biNormalize(result);
}

function reverseStr(s){
	var result = "";
	for (var i = s.length - 1; i > -1; i--)
		result += s.charAt(i);
	return result;
}

var hexatrigesimalToChar = new Array(
 '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
 'u', 'v', 'w', 'x', 'y', 'z'
);

function biToString(x, radix){
	// 2 <= radix <= 36
	if (radix == 16)
		return biToHex(x);
	var b = biFromNumber(radix);
	var qr = biDivideModulo(biAbs(x), b);
	var result = hexatrigesimalToChar[qr[1][0]];
	while (!biIsZero(qr[0])){
		qr = biDivideModulo(qr[0], b);
		result += hexatrigesimalToChar[qr[1][0]];
	}
	return (x.isNeg ? "-" : "") + reverseStr(result);
}

function biToDecimal(x){
	return biToString(x, 10);
}

var hexToChar = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                          'a', 'b', 'c', 'd', 'e', 'f');

function digitToHex(n){
	var mask = 0xf;
	var result = "";
	for (var i = 0; i < biHexPerDigit; i++){
		result += hexToChar[n & mask];
		n >>>= 4;
	}
	return reverseStr(result);
}

function digitToHexTrunk(n){
	if (n == 0)
		return "0";
	var mask = 0xf;
	var result = "";
	for (var i = 0; i < biHexPerDigit && n > 0; i++){
		result += hexToChar[n & mask];
		n >>>= 4;
	}
	return reverseStr(result);
}

function biToHex(x){
	var result = x.isNeg ? "-" : "";
	var i = biHighIndex(x);
	result += digitToHexTrunk(x[i--]);
	while (i > -1) 
		result += digitToHex(x[i--]);
	return result;
}

function biToNumber(x){
	var result = 0;
	var faktor = 1;
	var k = biHighIndex(x) + 1;
	for (var i = 0; i < k; i++){
		result += x[i] * faktor;
		faktor *= biRadix;
	}
	return x.isNeg ? -result : result;
}

function charToHex(c){
	var ZERO = 48;
	var NINE = ZERO + 9;
	var littleA = 97;
	var littleZ = littleA + 25;
	var bigA = 65;
	var bigZ = 65 + 25;
	var result;
	if (c >= ZERO && c <= NINE)
		result = c - ZERO;
	else if (c >= bigA && c <= bigZ)
		result = 10 + c - bigA;
	else if (c >= littleA && c <= littleZ)
		result = 10 + c - littleA;
	else 
		result = 0;	
	return result;
}

function hexToDigit(s){
	var result = 0;
	var sl = Math.min(s.length, biHexPerDigit);
	for (var i = 0; i < sl; i++) {
		result <<= 4;
		result |= charToHex(s.charCodeAt(i))
	}
	return result;
}

function biDump(b){
	return (b.isNeg ? "minus " : "plus ") + b.join(" ");
}

function biNormalize(x){
	var k = x.length;
	if (x[k - 1] != 0 && !isNaN(x[k - 1]))
		return x;		
	for (var i = k - 1; i > 0; i--)
		if (x[i] == 0 || isNaN(x[i])) // todo
			x.pop();
		else
			return x;
	if (x.length == 1 && x[0] == 0)
		x.isNeg = false;
	if (isNaN(x[0])){
		throw new Error("Undefined BigInt: " + biDump(x));
	}
	return x;
}

function biHighIndex(x){
	biNormalize(x);
	return x.length - 1;
}

function biNumBits(x){
	var n = biHighIndex(x);
	var d = x[n];
	var m = (n + 1) * bitsPerDigit;
	var result;
	for (result = m; result > m - bitsPerDigit; result--){
		if ((d & biHalfRadix) != 0)
			break;
		d <<= 1;
	}
	return result;
}

function biCompareAbs(x, y){
	var nx = biHighIndex(x);
	var ny = biHighIndex(y);
	if (nx != ny)
		return 1 - 2 * ((nx < ny) ? 1 : 0);
	for (var i = x.length - 1; i > -1; i--)
		if (x[i] != y[i])
			return 1 - 2 * ((x[i] < y[i]) ? 1 : 0);
	return 0;
}

function biCompare(x, y){
	if (x.isNeg != y.isNeg)
		return 1 - 2 * (x.isNeg ? 1 : 0);
	return x.isNeg ? -biCompareAbs(x, y) : biCompareAbs(x, y);
}

function biAddNatural(x, y){
	var nx = biHighIndex(x) + 1;
	var ny = biHighIndex(y) + 1;
	var i = 0;
	var c = 0;
	if (nx > ny){
		var result = biAbs(x);
		var source = y;
		var k = ny;
	}else{
		var result = biAbs(y);
		var source = x;
		var k = nx;
	}
	while (i < k){
		result[i] += source[i] + c;
		if (result[i] < biRadix){
			c = 0;
		}else{
			result[i] &= maxDigitVal;
			c = 1;
		}
		i++;
	}
	while (c > 0){
		result[i] = (result[i] || 0) + c;
		if (result[i] < biRadix){
			c = 0;
		}else{
			result[i] &= maxDigitVal;
			c = 1;
		}
		i++;
	}
	return result;
}

function biSubtractNatural(x, y){
// require x >= y
	var nx = biHighIndex(x) + 1;
	var ny = biHighIndex(y) + 1;
	var result = biAbs(x);
	var c = 0;
	for (var i = 0; i < ny ; i++){
		if (x[i] >= y[i] - c){
			result[i] = x[i] - y[i] + c;
			c = 0;
		}else{
			result[i] = biRadix + x[i] - y[i] + c;
			c = -1;		
		}		
	}
	while (c < 0 && i < nx){
		if (x[i] >=  - c){
			result[i] = x[i] + c;
			c = 0;
		}else{
			result[i] = biRadix + x[i] + c;
			c = -1;		
		}		
		i++;
	}	
	return biNormalize(result);
}

function biAdd(x, y){
	var result;
	if (!x.isNeg && !y.isNeg)
		return biAddNatural(x, y);
	if (x.isNeg && y.isNeg){
		result = biAddNatural(x, y);
		result.isNeg = true;
		return result;
	}
	var x_y = biCompareAbs(x , y); 
	if (x_y == 0)
		return biFromNumber(0);
	if (x_y > 0){
		result = biSubtractNatural(x, y);
		result.isNeg = x.isNeg;
	}
	if (x_y < 0){
		result = biSubtractNatural(y, x);
		result.isNeg = y.isNeg;
	}
	return result;
}

function biSubtract(x, y){
	var result;
	if (!x.isNeg && y.isNeg)
		return biAddNatural(x, y);
	if (x.isNeg && !y.isNeg){
		result = biAddNatural(x, y);
		result.isNeg = true;
		return result;
	}
	var x_y = biCompareAbs(x , y);
	if (x_y == 0)
		return biCopy(bigZero);
		if (x_y > 0){
		result = biSubtractNatural(x, y);
		result.isNeg = x.isNeg;
	}
	if (x_y < 0){
		result = biSubtractNatural(y, x);
		result.isNeg = !x.isNeg;
	}
	return result;
}

function biMultiply(x, y){
	var c, u, uv, k;
	var n = biHighIndex(x) + 1;
	var t = biHighIndex(y) + 1;
	if (n == 1 && x[0] == 0 || t == 1 && y[0] == 0)
		return biBigInt();
	var result = biBigInt(n + t);
	for (var i = 0; i < t; i++) {
		c = 0;
		k = i;
		for (var j = 0; j < n; j++, k++) {
			uv = result[k] + x[j] * y[i] + c;
			result[k] = uv & maxDigitVal;
			c = uv >>> biRadixBits;
		}
		result[i + n] = c;
	}
	result.isNeg = x.isNeg != y.isNeg;
	return biNormalize(result);
}

function biMultiplyDigit(x, y){
	var n = biHighIndex(x) + 1;
	var result = biBigInt(n);
	var c = 0;
	for (var j = 0; j < n; j++){
		var uv = result[j] + x[j] * y + c;
		result[j] = uv & maxDigitVal;
		c = uv >>> biRadixBits;
	}
	result[n] = c;
	return result;
}

function arrayCopy(src, srcStart, dest, destStart, count){
	if (srcStart >= src.length){
		if (dest.length == 0)
			dest[0] = 0;
		return;
	}
	for (var i = 0; i < destStart; i++)
		// if !dest[i] ???//todo
		dest[i] = 0;
	var m = Math.min(srcStart + count, src.length);
	for (var i = srcStart, j = destStart; i < m; i++, j++)
		dest[j] = src[i];
}

function biShiftLeft(x, n){
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = biBigInt();
	arrayCopy(x, 0, result, digitCount, x.length);
	var bits = n % bitsPerDigit;
	var rightBits = bitsPerDigit - bits;
	result[result.length] = result[result.length] >>> rightBits;
	for (var i = result.length - 1; i > 0; i--)
		result[i] = ((result[i] << bits) & maxDigitVal) | (result[i - 1] >>> rightBits);
	result[0] = (result[0] << bits) & maxDigitVal;
	result.isNeg = x.isNeg;
	return biNormalize(result);
}

function biShiftRight(x, n){
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = biBigInt();
	arrayCopy(x, digitCount, result, 0, x.length - digitCount);
	var bits = n % bitsPerDigit;
	var leftBits = bitsPerDigit - bits;
	for (var i = 0; i < result.length - 1; i++)
		result[i] = (result[i] >>> bits) |  ((result[i + 1] << leftBits)  & maxDigitVal);
	result[result.length - 1] >>>= bits;
	result.isNeg = x.isNeg;
	return biNormalize(result);
}

function biMultiplyByRadixPower(x, n){
	var result = biBigInt();
	arrayCopy(x, 0, result, n, x.length);
	return result;
}

function biDivideByRadixPower(x, n){
	var result = biBigInt();
	arrayCopy(x, n, result, 0, x.length - n);
	return result;
}

function biModuloByRadixPower(x, n){
	var result = biBigInt();
	arrayCopy(x, 0, result, 0, n);
	return result;
}

function biMultiplyModByRadixPower(x, y, p){
	var c, u, uv, k;
	var n = biHighIndex(x) + 1;
	var t = biHighIndex(y) + 1;
	if (n == 1 && x[0] == 0 || t == 1 && y[0] == 0)
		return biBigInt();
	var result = biBigInt(p);
	for (var i = 0; i < t && i < p; i++) {
		c = 0;
		k = i;
		for (j = 0; j < n && k < p; j++, k++) {
			uv = result[k] + x[j] * y[i] + c;
			result[k] = uv & maxDigitVal;
			c = uv >>> biRadixBits;
		}
		result[i + n] = c;
	}
	result = biModuloByRadixPower(result, p)
	result.isNeg = x.isNeg != y.isNeg;
	return biNormalize(result);
}

function biDivideModuloNatural(x, y){
    var j0, j1, jm, qm, flag;
    var nx = biHighIndex(x);
    var ny = biHighIndex(y);
    var q = biBigInt();
    var r = biBigInt(-1);
    for (var i = nx; i > -1; i--){
        r.unshift(x[i])
		flag = biCompareAbs(y, r);
        if (flag > 0){
            q.unshift(0);
            continue;
        }
		if (flag == 0){
            q.unshift(1);
			biBlankZero(r);
            continue;
		}
		var nr = biHighIndex(r);
		if (nr == ny)
            jm = Math.floor((r[nr] * biRadix + (r[nr - 1] || 0)) / 
								(y[ny] * biRadix + (y[ny - 1] || 0) + 1));
		else
            jm = Math.floor( (r[nr] * biRadixSquared + (r[nr - 1] || 0) * biRadix + (r[nr - 2] || 0)) /
								(y[ny] * biRadix + (y[ny - 1] || 0) + 1));
		jm = Math.max(0, Math.min(jm, maxDigitVal))						
		qm = biMultiplyDigit(y, jm);
		r = biSubtract(r, qm);
		if (r.isNeg)
			while (r.isNeg){
				r = biAdd(r, y);
				jm--
			}	
		else
			while (biCompare(r, y) >= 0){
				r = biSubtract(r, y);
				jm++;
			}
        q.unshift(jm);
    }
    return [biNormalize(q), biNormalize(r)];
}

function biDivideModulo(x, y){
	var q, r;
	if (biCompareAbs(x, y) < 0) {
		// |x| < |y|
		if ((x.isNeg && y.isNeg) || (!x.isNeg && !y.isNeg)){
			q = biFromNumber(0);
			r= biCopy(x);
		}else {
			q = biFromNumber(-1);
			r = biAdd(y, x);
		}
		return [q, r];
	}
	var origXIsNeg = x.isNeg;
	var origYIsNeg = y.isNeg;
	var result = biDivideModuloNatural(biAbs(x), biAbs(y));
	q = result[0];
	r = result[1];
	if (!origXIsNeg && !origYIsNeg){
		return [q, r];
	}else if (origXIsNeg && origYIsNeg){
		r.isNeg = true;
		return [q, r];
	}else{
		q.isNeg = true;
		q = biSubtract(q, bigOne);
		r.isNeg = origXIsNeg;
		r = biAdd(r, y);
	}
	if (r[0] == 0 && biHighIndex(r) == 0) 
		r.isNeg = false;
	return [q, r];
}

function biDivide(x, y){
	return biDivideModulo(x, y)[0];
}

function biModulo(x, y){
	return biDivideModulo(x, y)[1];
}

function biMultiplyMod(x, y, m){
	return biModulo(biMultiply(x, y), m);
}

function biPow(x, y){
	var result = biCopy(bigOne);
	var a = x;
	while (true) {
		if ((y & 1) != 0) 
			result = biMultiply(result, a);
		y >>>= 1;
		if (y == 0)
			break;
		a = biMultiply(a, a);
	}
	return result;
}

function biPowMod(x, y, m){
	var result = biCopy(bigOne);
	var a = x;
	var k = y;
	while (true) {
		if ((k[0] & 1) != 0) 
			result = biMultiplyMod(result, a, m);
		k = biShiftRight(k, 1);
		if (k[0] == 0 && biHighIndex(k) == 0) 
			break;
		a = biMultiplyMod(a, a, m);
	}
	return result;
}

function biRandom(n){
	var result = biBigInt();
	while (n--)
		result[n] = Math.floor(Math.random() * maxDigitVal);
	return result;
}
