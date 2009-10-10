/*
The MIT License

Copyright (c) <year> <copyright holders>

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

if (typeof bi != "object")
	bi = {};

//void function(){//emulate local context

// Max number = 10^16 - 2 = 9999999999999998;
//               2^53     = 9007199254740992;

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

function BigInt(i){
	this.isNeg = false;
	if (i == -1)
		return;
	if (i){
		this.digits = new Array(i);
		while (i)
			this.digits[--i] = 0;
	}else{
		this.digits = [0];
	}
}

function biFromDecimal(s){
	return biFromString(s, 10);
}

function biCopy(bi){
	var result = new BigInt(-1);
	result.digits = bi.digits.slice(0);
	result.isNeg = bi.isNeg;
	return biNormalize(result);
}

function biAbs(bi){
	var result = new BigInt(-1);
	result.digits = bi.digits.slice(0);
	result.isNeg = false;
	return biNormalize(result);
}

function biFromNumber(i){
	if (Math.abs(i) > maxInteger)
		return (biFromFloat(i));
	var result = new BigInt();
	if (result.isNeg = i < 0)
		i = -i;
	var j = 0;
	while (i > 0){
		result.digits[j++] = i & maxDigitVal;
		i >>>= biRadixBits;
	}
	return biNormalize(result);
}

function biFromFloat(i){
	var result = new BigInt();
	if (result.isNeg = i < 0)
		i = -i;
	var j = 0;
	while (i > 0){
		var c = Math.floor(i / biRadix);
		result.digits[j++] = i - c * biRadix;
		i = c;
	}
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
	var result = hexatrigesimalToChar[qr[1].digits[0]];
	while (biCompare(qr[0], bigZero) == 1){
		qr = biDivideModulo(qr[0], b);
		result += hexatrigesimalToChar[qr[1].digits[0]];
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
	for (i = 0; i < biHexPerDigit; i++){
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
	for (i = 0; i < biHexPerDigit && n > 0; i++){
		result += hexToChar[n & mask];
		n >>>= 4;
	}
	return reverseStr(result);
}

function biToHex(x){
	var result = x.isNeg ? "-" : "";
	var i = biHighIndex(x);
	result += digitToHexTrunk(x.digits[i--]);
	while (i > -1) 
		result += digitToHex(x.digits[i--]);
	return result;
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

function biFromHex(s){
	var result = new BigInt();
	var isNeg = s.charAt(0) == '-';
	var top = isNeg ? 1 : 0;
	result.isNeg = isNeg;
	var sl = s.length;
	for (var i = sl, j = 0; i > top; i -= biHexPerDigit, j++)
		result.digits[j] = hexToDigit(s.substr(Math.max(i - biHexPerDigit, 0), Math.min(i, biHexPerDigit)));
	return biNormalize(result);
}

function biFromString(s, radix){
	if (radix = 16)
		return biFromHex(s);
	var isNeg = s.charAt(0) == '-';
	var istop = isNeg ? 1 : 0;
	var result = new BigInt();
	var place = biCopy(bigOne);
	for (var i = s.length - 1; i >= istop; i--){
		var c = s.charCodeAt(i);
		var digit = charToHex(c);
		var biDigit = biMultiplyDigit(place, digit);
		result = biAdd(result, biDigit);
		place = biMultiplyDigit(place, radix);
	}
	result.isNeg = isNeg;
	return biNormalize(result);
}

function biDump(b){
	return (b.isNeg ? "minus " : "plus ") + b.digits.join(" ");
}

function biNormalize(x){
	var k = x.digits.length;
	if (x.digits[k - 1] != 0 && !isNaN(x.digits[k - 1]))
		return x;		
	for (var i = k - 1; i > 0; i--)
		if (x.digits[i] == 0 || isNaN(x.digits[i])) // todo
			x.digits.pop();
		else
			return x;
	if (x.digits.length == 1 && x.digits[0] == 0)
		x.isNeg = false;
	if (isNaN(x.digits[0]))
		throw new Error("Undefined BigInt: " + biDump(x));
	return x;
}

function biRecreate(x, b){//todo
	var n = biHighIndex(x) + 1;
	var c = 0;
	var i = 0;
	if (b)
		i = b;
	for (; i < n || c > 0; i++){
		if (!x.digits[i])
			x.digits[i] = 0;
		if (c != 0)
				x.digits[i] += c;
		c = x.digits[i] >>> biRadixBits;
		if (c > 0)
			x.digits[i] &= maxDigitVal;
	}
	return biNormalize(x);
}

function biRecreateUnsafe(xdigits, b){//todo
	if (xdigits[b] < biRadix)
		return;
	var c = xdigits[b] >>> biRadixBits;
	xdigits[b] &= maxDigitVal;
	xdigits[b + 1] += c;
	return;
	var n = xdigits.length;
	var i = 0;
	if (b)
		i = b;
	var c = xdigits[i] >>> biRadixBits;
	if (c > 0)
		xdigits[i] &= maxDigitVal;
	while(++i < n && c > 0){
		xdigits[i] += c;
		c = xdigits[i] >>> biRadixBits;
		if (c > 0)
			xdigits[i] &= maxDigitVal;
	}
	if (c > 0)
		throw new Error("Overfloow in biRecreateUnsafe: " + x.join(" "));
	return;
}

function biHighIndex(x){
	biNormalize(x);
	return x.digits.length - 1;
}

function biNumBits(x){
	var n = biHighIndex(x);
	var d = x.digits[n];
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
	for (var i = x.digits.length - 1; i > -1; i--)
		if (x.digits[i] != y.digits[i])
			return 1 - 2 * ((x.digits[i] < y.digits[i]) ? 1 : 0);
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
	var result = new BigInt();
	var resuldigits = result.digits;
	var xdigits = x.digits;
	var ydigits = y.digits;
	while (i < nx && i < ny){
		var s = xdigits[i] + ydigits[i] + c;
		if (s < biRadix){
			resultdigits[i] = s;
			c = 0;
		}else{
			resultdigits[i] = s & maxDigitVal;
			c = 1;
		}
		i++;
	}
	if (nx = ny){
		if (c > 0)
			resultdigits[i] = c;
	}else if (nx > ny){
		if (c > 0)
			resultdigits[i] = xdigits[i++] + c;
		while (i < nx)
			resultdigits[i] = xdigits[i++];
	}else if (nx < ny){
		if (c > 0)
			resultdigits[i] = ydigits[i++] + c;
		while (i < nx)
			resultdigits[i] = ydigits[i++];
	}
	//return biNormalize(result)
	return result;
}

function biSubtractNatural(x, y){
// require x >= y
	var k = biHighIndex(y) + 1;
	var result = biAbs(x);
	var resultdigits = result.digits;
	var xdigits = x.digits;
	var ydigits = y.digits;	
	var c = 0;
	for (var i = 0; i < k ; i++){
		if (xdigits[i] >= ydigits[i] - c){
			resultdigits[i] = xdigits[i] - ydigits[i] + c;
			c = 0;
		}else{
			resultdigits[i] = biRadix + xdigits[i] - ydigits[i] + c;
			c = -1;		
		}		
	}
	if (c < 0)
		resultdigits[k] += c;
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
	var c;
	var n = biHighIndex(x) + 1;
	var t = biHighIndex(y) + 1;
	if (n == 1 && x.digits[0] == 0 || t == 1 && y.digits[0] == 0){
		return new BigInt();
	}
	var u, uv, k;
	var result = new BigInt(n + t);
	var resultdigits = result.digits;
	var xdigits = x.digits;
	var ydigits = y.digits;
	for (var i = 0; i < t; ++i) {
		c = 0;
		k = i;
		for (j = 0; j < n; ++j, ++k) {
			uv = resultdigits[k] + xdigits[j] * ydigits[i] + c;
			resultdigits[k] = uv & maxDigitVal;
			c = uv >>> biRadixBits;
		}
		resultdigits[i + n] = c;
	}
	// Someone give me a logical xor, please.
	result.isNeg = x.isNeg != y.isNeg;
	return biNormalize(result);
}

function biMultiplyDigit(x, y){
	var n = biHighIndex(x) + 1;
	var result = new BigInt(n);
	var c = 0;
	for (var j = 0; j < n; ++j) {
		var uv = result.digits[j] + x.digits[j] * y + c;
		result.digits[j] = uv & maxDigitVal;
		c = uv >>> biRadixBits;
	}
	result.digits[n] = c;
	return result;
}

function arrayCopy(src, srcStart, dest, destStart, count){
	if (srcStart >= src.length){
		if (dest.length == 0)
			dest[0] = 0
		return;
	}
	for (var i = 0; i < destStart; i++)
		// if !dest[i] ???//todo
		dest[i] = 0;
	var m = Math.min(srcStart + count, src.length);
	for (var i = srcStart, j = destStart; i < m; i++, j++)
		dest[j] = src[i];
}

//var highBitMasks = new Array(0x0000, 0x8000, 0xC000, 0xE000, 0xF000, 0xF800,
//                             0xFC00, 0xFE00, 0xFF00, 0xFF80, 0xFFC0, 0xFFE0,
//                             0xFFF0, 0xFFF8, 0xFFFC, 0xFFFE, 0xFFFF);

function biShiftLeft(x, n){
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

//var lowBitMasks = new Array(0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
//                            0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
//                            0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF);

function biShiftRight(x, n){
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
	var result = new BigInt();
	arrayCopy(x.digits, 0, result.digits, n, x.digits.length);
	return result;
}

function biDivideByRadixPower(x, n){
	var result = new BigInt();
	arrayCopy(x.digits, n, result.digits, 0, x.digits.length - n);
	return result;
}

function biModuloByRadixPower(x, n){
	var result = new BigInt();
	arrayCopy(x.digits, 0, result.digits, 0, n);
	return result;
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

	var nb = biNumBits(x);
	var nh = biHighIndex(x);
	var tb = biNumBits(y);
	var th = biHighIndex(y);
	var origXIsNeg = x.isNeg;
	var origYIsNeg = y.isNeg;
	var origX = x;
	var origY = y;



	q = biFromNumber(0);
	r = biAbs(x);
	y = biAbs(y);

	// Normalize Y.
	var t = Math.ceil(tb / bitsPerDigit) - 1;
	var lambda = 0;
	while (y.digits[t] < biHalfRadix) {
		y = biShiftLeft(y, 1);
		++lambda;
		++tb;
		t = Math.ceil(tb / bitsPerDigit) - 1;
	}
	// Shift r over to keep the quotient constant. We'll shift the
	// remainder back at the end.
	r = biShiftLeft(r, lambda);
	nb += lambda; // Update the bit count for x.
	var n = Math.ceil(nb / bitsPerDigit) - 1;

	var b = biMultiplyByRadixPower(y, n - t);

	while (biCompare(r, b) != -1) {
		if (!q.digits[n - t])
			q.digits[n - t] = 1
		else
			++q.digits[n - t];
		r = biSubtract(r, b);
	}
	for (var i = n; i > t; --i) {
    var ri = (i >= r.digits.length) ? 0 : r.digits[i];
    var ri1 = (i - 1 >= r.digits.length) ? 0 : r.digits[i - 1];
    var ri2 = (i - 2 >= r.digits.length) ? 0 : r.digits[i - 2];
    var yt = (t >= y.digits.length) ? 0 : y.digits[t];
    var yt1 = (t - 1 >= y.digits.length) ? 0 : y.digits[t - 1];
		if (ri == yt) {
			q.digits[i - t - 1] = maxDigitVal;
		} else {
			q.digits[i - t - 1] = Math.floor((ri * biRadix + ri1) / yt);
		}

		var c1 = q.digits[i - t - 1] * ((yt * biRadix) + yt1);
		var c2 = (ri * biRadixSquared) + ((ri1 * biRadix) + ri2);
		while (c1 > c2) {
			--q.digits[i - t - 1];
			c1 = q.digits[i - t - 1] * ((yt * biRadix) | yt1);
			c2 = (ri * biRadix * biRadix) + ((ri1 * biRadix) + ri2);
		}

		b = biMultiplyByRadixPower(y, i - t - 1);
		r = biSubtract(r, biMultiplyDigit(b, q.digits[i - t - 1]));
		if (r.isNeg) {
			r = biAdd(r, b);
			--q.digits[i - t - 1];
		}
	biNormalize(q);
	biNormalize(r);
	}
	r = biShiftRight(r, lambda);
	biNormalize(q);
	biNormalize(r);
	// Fiddle with the signs and stuff to make sure that 0 <= r < y.
	//q.isNeg = x.isNeg != origYIsNeg;
	//if (x.isNeg) {
	//	if (origYIsNeg) {
	//		q = biAdd(q, bigOne);
	//	} else {
	//		q = biSubtract(q, bigOne);
	//	}
	//	y = biShiftRight(y, lambda);
	//	r = biSubtract(y, r);
	//}
	if (!origXIsNeg && !origYIsNeg){
		return [q, r];
	}else if (origXIsNeg && origYIsNeg){
		r.isNeg = true;
		return [q, r];
	}else{
		q.isNeg = true;
		q = biSubtract(q, bigOne);
		r.isNeg = origXIsNeg;
		r = biAdd(r, origY);
	}
	
	// Check for the unbelievably stupid degenerate case of r == -0.
	if (r.digits[0] == 0 && biHighIndex(r) == 0) r.isNeg = false;

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
		y >>= 1;
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
		if ((k.digits[0] & 1) != 0) 
			result = biMultiplyMod(result, a, m);
		k = biShiftRight(k, 1);
		if (k.digits[0] == 0 && biHighIndex(k) == 0) 
			break;
		a = biMultiplyMod(a, a, m);
	}
	return result;
}