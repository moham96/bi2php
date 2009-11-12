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
// bi2php v0.1.112.alfa from http://code.google.com/p/bi2php/
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
var biRadixBits = 24;
    biRadixBits = biRadixBits - biRadixBits % 4;
var bitsPerDigit = biRadixBits;
var biRadix = Math.pow(biRadixBase, biRadixBits); // = 2^16 = 65536
var biHalfRadix = biRadix / 2;
var biRadixSquared = biRadix * biRadix;
var maxDigitVal = biRadix - 1;
var maxInteger = 4294967295; 
var biHexPerDigit = biRadixBits / 4;
var bigZero = biFromNumber(0);
var bigOne = biFromNumber(1);
var psi = 0.0001;

// The maximum number of digits in base 10 you can convert to an
// integer without JavaScript throwing up on you.
var dpl10 = 9;
// lr10 = 10 ^ dpl10
var lr10 = biFromNumber(1000000000);

function biBigInt(i){
	var digits = [];
	digits.isNeg = false;
	i = biIF(i, 1)
	while (i > 0)
		digits[--i] = 0;
	return digits;	
}

function biRoundZero(i){
	return Math.abs(i) < psi;
}

function biRoundOne(i){
	return Math.abs(i - 1) < psi;
}

function biRoundEqual(x, y){
	return Math.abs(x - y) < psi;
}

function biRoundGEqual(x, y){
	return x >= y - psi;
}

function biRoundLEqual(x, y){
	return x <= y + psi;
}

function biIsZero(digits){
	return biRoundZero(digits[0]) && biNormalize(digits).length == 1;
}

function biIsOne(digits){
	return biRoundOne(digits[0]) && !digits.isNeg && biNormalize(digits).length == 1;
}

function biIsEqual(x, y){
	if (biIsZero(x) && biIsZero(y))
		return true;
	if (x.isNeg != y.isNeg)
		return false;
	if (x.length != y.length)
		return false;
	for (var i = x.length - 1; i > -1; i--)
		if (! biRoundEqual(x[i], y[i]))
			return false;
	return true;
}

function biBlankZero(digits){
	digits.isNeg = false;
	digits.length = 1;
	digits[0] = 0;
}

function biBlankOne(digits){
	digits.isNeg = false;
	digits.length = 1;
	digits[0] = 1;
}

function biBlankEmpty(digits){
	digits.isNeg = false;
	digits.length = 0;
}

function biCopy(bi){
	var result = bi.slice(0);
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
	return (biFromFloat(i));
}

function biFromFloat(i){
	var result = biBigInt();
	if (result.isNeg = (i < 0))
		i = -i;
	var j = 0;
	while (i > 0){
		var c = Math.floor(i / biRadix);
		result[j++] = i % biRadix;
		i = c;
	}
	return result;
}

function biFromString(s, radix){
	if (radix == 16)
		return biFromHex(s);
	var isNeg = s.charAt(0) == '-';
	var first = (isNeg ? 1 : 0);
	var result = biBigInt();
	var place = biCopy(bigOne);
	for (var i = s.length - 1; i > first - 1; i--){
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
	var result = "";
	for (var i = 0; i < biHexPerDigit; i++){
		result += hexToChar[n % 16];
		n = Math.floor(n / 16);
	}
	return reverseStr(result);
}

function digitToHexTrunk(n){
	if (n == 0)
		return "0";
	var result = "";
	for (var i = 0; i < biHexPerDigit && n > 0; i++){
		result += hexToChar[n % 16];
		n = Math.floor(n / 16);
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
		result *= 16;
		result += charToHex(s.charCodeAt(i))
	}
	return result;
}

function biDump(b){
	return (b.isNeg ? "minus " : "plus ") + b.join(" ");
}

function biNormalize(x){
	var k = x.length;
	for (var i = k - 1; i > 0; i--)
		if (biRoundZero(x[i]) || isNaN(x[i])) // todo
			x.pop();
		else
			return x;
	if (x.length == 1 && biRoundZero(x[0]))
		x.isNeg = false;
	if (isNaN(x[0]))
		throw new Error("Undefined BigInt: " + biDump(x));
	return x;
}

function biHighIndex(x){
	biNormalize(x);
	return x.length - 1;
}

function biNumBits(x){
	var n = biHighIndex(x);
	var d = x[n];
	var m = n * bitsPerDigit;
	while (d){
		m++;
		d = Math.floor(d / 2);
	}
	return m;
}

function biCompareAbs(x, y){
	var nx = biHighIndex(x);
	var ny = biHighIndex(y);
	if (! biRoundEqual(nx, ny))
		return 1 - 2 * (biRoundLEqual(nx, ny) ? 1 : 0);
	for (var i = x.length - 1; i > -1; i--)
		if (! biRoundEqual(x[i], y[i]))
			return 1 - 2 * (biRoundLEqual(x[i], y[i]) ? 1 : 0);
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
		if (result[i] < biRadix - psi){
			c = 0;
		}else{
			result[i] %= biRadix;
			c = 1;
		}
		i++;
	}
	while (c > 0){
		result[i] = biIF(result[i], 0) + c;
		if (result[i] < biRadix - psi){
			c = 0;
		}else{
			result[i] %= biRadix;
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
	for (var i = 0; i < ny; i++){
		if (biRoundGEqual(x[i], y[i] + c)){
		//if (x[i] >= y[i] + c){
			result[i] = Math.round(x[i] - y[i] - c);
			c = 0;
		}else{
			result[i] = Math.round(biRadix + x[i] - y[i] - c);
			c = 1;		
		}		
	}
	while (!biRoundZero(c) && i < nx){
		if (biRoundGEqual(x[i], c)){
		//if (x[i] >= c){
			result[i] = Math.round(x[i] - c);
			c = 0;
		}else{
			result[i] = Math.round(biRadix + x[i] - c);
			c = 1;		
		}		
		i++;
	}
	if (c)
	alert(biToHex(x)+"-\n"+biToHex(y)+"=\n"+biToHex(result))
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
		return biCopy(bigZero);
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
	if (biIsZero(x) || biIsZero(y))
		return biCopy(bigZero);
	var result = biBigInt(n + t);
	for (var i = 0; i < t; i++) {
		c = 0;
		k = i;
		for (var j = 0; j < n; j++, k++) {
			uv = (result[k] % biRadix + (x[j] % biRadix)  * (y[i] % biRadix) + c % biRadix);
			c = Math.floor((result[k] + x[j] * y[i] + c) / biRadix);
			result[k] = Math.round(uv)  % biRadix;
		}
		result[i + n] = c;
	}
	result.isNeg = x.isNeg != y.isNeg;
	return biNormalize(result);
}

function biMultiplyDigit(x, y){
	var n = biHighIndex(x) + 1;
	if (biRoundZero(y))
		return biCopy(bigZero);
	if (biRoundOne(y))
		return biCopy(x);
	var result = biBigInt(n);
	var c = 0;
	for (var j = 0; j < n; j++){
		var uv = x[j] * y + c;
		result[j] = uv % biRadix;
		c = Math.floor(uv / biRadix);
	}
	if (c)
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

function biShiftLeft0(x, n){
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = new BigInt();
	arrayCopy(x.digits, 0, result.digits, digitCount, x.digits.length);
	var bits = n % bitsPerDigit;
	var rightBits = bitsPerDigit - bits;
	result.digits[result.digits.length] = result.digits[result.digits.length] >>> rightBits;
	for (var i = result.digits.length - 1; i > 0; i--)
		result.digits[i] = ((result.digits[i] << bits) & maxDigitVal) | (result.digits[i - 1] >>> rightBits);
	result.digits[0] = (result.digits[0] << bits) & maxDigitVal;
	result.isNeg = x.isNeg;
	return biNormalize(result);
}

function biShiftRight0(x, n){
	var digitCount = Math.floor(n / bitsPerDigit);
	var result = new BigInt();
	arrayCopy(x.digits, digitCount, result.digits, 0, x.digits.length - digitCount);
	var bits = n % bitsPerDigit;
	var leftBits = bitsPerDigit - bits;
	for (var i = 0; i < result.digits.length - 1; i++)
		result.digits[i] = (result.digits[i] >>> bits) |  ((result.digits[i + 1] << leftBits)  & maxDigitVal);
	result.digits[result.digits.length - 1] >>>= bits;
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
	if (biIsZero(x) || biIsZero(y))
		return biCopy(bigZero);
	var result = biBigInt(p);
	for (var i = 0; i < t && i < p; i++) {
		c = 0;
		k = i;
		for (j = 0; j < n && k < p; j++, k++) {
			uv = result[k] + x[j] * y[i] + c;
			result[k] = uv % biRadix;
			c = Math.floor(uv / biRadix);
		}
		result[i + n] = c;
	}
	result = biModuloByRadixPower(result, p)
	result.isNeg = x.isNeg != y.isNeg;
	return biNormalize(result);
}

function biIF(x, y){
	if (x) return x; else return y;
}

function biIIF(l, x, y){
	if (l) return x; else return y;
}

function biDivideModuloNatural(x, y){
    var jm, qm, flag;
    var nx = biHighIndex(x);
    var ny = biHighIndex(y);
    var q = biBigInt(-1);
    var r = biBigInt();
    for (var i = nx; i > -1; i--){
        r.unshift(x[i]);
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
            jm = Math.floor((r[nr] * biRadix + biIF(r[nr - 1], 0)) / 
								(y[ny] * biRadix + biIF(y[ny - 1], 0)));
		else
            jm = Math.floor((r[nr] * biRadixSquared + biIF(r[nr - 1], 0) * biRadix + biIF(r[nr - 2], 0)) /
								(y[ny] * biRadix + biIF(y[ny - 1], 0)));
		jm = Math.max(0, Math.min(jm, maxDigitVal));	
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
			q = biCopy(bigZero);
			r = biCopy(x);
		}else{
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
	if (biIsZero(r)) 
		r.isNeg = false;
	if (biIsZero(q)) 
		q.isNeg = false;
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
		if (!biRoundZero(y % 2)) 
			result = biMultiply(result, a);
		y = Math.floor(y / 2);
		if (biRoundZero(y))
			break;
		a = biMultiply(a, a);
	}
	return result;
}

function biPowMod(x, y, m){
	var result = biCopy(bigOne);
	var a = x;
	var k = y;
	while (true){
		if (!biRoundZero(k[0] % 2)) 
			result = biMultiplyMod(result, a, m);
		k = biShiftRight(k, 1);
		if (biRoundZero(k[0]) && biHighIndex(k) == 0) 
			break;
		a = biMultiplyMod(a, a, m);
	}
	return result;
}

function biRandom(n){
	var result = biBigInt();
	while (n--)
		results[n] = Math.floor(Math.random() * maxDigitVal);
	return result;
}
