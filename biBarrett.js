// BarrettMu, a class for performing Barrett modular reduction computations in
// JavaScript.
//
// Requires BigInt.js.
//
// Copyright 2004-2005 David Shapiro.
//
// You may use, re-use, abuse, copy, and modify this code to your liking, but
// please keep this header.
//
// Thanks!
// 
// Dave Shapiro
// dave@ohdave.com 
// BarrettMu, a class for performing Barrett modular reduction computations in
// JavaScript.
//
// Requires BigInt.js.
//
// Copyright 2004-2005 David Shapiro.
//
// You may use, re-use, abuse, copy, and modify this code to your liking, but
// please keep this header.
//
// Thanks!
// 
// Dave Shapiro
// dave@ohdave.com 

/*
function BarrettMu(m)
{
	this.modulus = biCopy(m);
	this.k = biHighIndex(this.modulus) + 1;
	var b2k = new BigInt();
	for (var i = 0; i < 2 * this.k; i++)
		b2k.digits[i] = 0;
	b2k.digits[2 * this.k] = 1; // b2k = b^(2k)
	this.mu = biDivide(b2k, this.modulus);
	this.bkplus1 = new BigInt();
	for (var i = 0; i < this.k + 1; i++)
		this.bkplus1.digits[i] = 0;
	this.bkplus1.digits[this.k + 1] = 1; // bkplus1 = b^(k+1)
	this.modulo = BarrettMu_modulo;
	this.multiplyMod = BarrettMu_multiplyMod;
	this.powMod = BarrettMu_powMod;
}

function BarrettMu_modulo(x)
{
	var q1 = biDivideByRadixPower(x, this.k - 1);
	var q2 = biMultiply(q1, this.mu);
	var q3 = biDivideByRadixPower(q2, this.k + 1);
	var r1 = biModuloByRadixPower(x, this.k + 1);
	var r2term = biMultiply(q3, this.modulus);
	var r2 = biModuloByRadixPower(r2term, this.k + 1);
	var r = biSubtract(r1, r2);
	if (r.isNeg) {
		r = biAdd(r, this.bkplus1);
	}
	var rgtem = biCompare(r, this.modulus) >= 0;
	while (rgtem) {
		r = biSubtract(r, this.modulus);
		rgtem = biCompare(r, this.modulus) >= 0;
	}
	return r;
}

function BarrettMu_multiplyMod(x, y)
{
	
	//x = this.modulo(x);
	//y = this.modulo(y);
	
	var xy = biMultiply(x, y);
	return this.modulo(xy);
}

function BarrettMu_powMod(x, y)
{
	var result = new BigInt();
	result.digits[0] = 1;
	var a = x;
	var k = y;
	while (true) {
		if ((k.digits[0] & 1) != 0) result = this.multiplyMod(result, a);
		k = biShiftRight(k, 1);
		if (k.digits[0] == 0 && biHighIndex(k) == 0) break;
		a = this.multiplyMod(a, a);
	}
	return result;
}

*/
/*Require: positive integers a = (a2n?1, ..., a0)b, m = (mn?1,mn?2...,m0)b and
mu = b**2n div m, where m(n-1) != 0 and b > 3.
Ensure: r = a mod m.
q1 <- a div b**(n-1), q2 <- mu*q1, q3 <- q2 div b**(n+1.)
r1 < a mod b**(n+1), r2 <- m*q3 mod b**(n+1), r <- r1 - r2.
Final reduction and correction step:
if r <= 0 then
r <- r + b**(n+1)
end if
while r >= m do
r <- r - m.
end while
return r.
*/



function BarrettMu(m)
{
	this.modulus = biCopy(m);
	/*this.k = biHighIndex(this.modulus) + 1;
	this.b2k = biMultiplyByRadixPower(bigOne, 2 * this.k);// b2k = b^(2k)
	this.mu = biDivide(this.b2k, this.modulus);
	this.bkplus1 = biMultiplyByRadixPower(bigOne, this.k + 1); // bkplus1 = b^(k+1)
	this.bkminus1 = biMultiplyByRadixPower(bigOne, this.k - 1); // bkplus1 = b^(k+1)*/
	this.modulo = BarrettMu_modulo;
	this.multiplyMod = BarrettMu_multiplyMod;
	this.powMod = BarrettMu_powMod;
}

function BarrettMu_modulo(x)
{
	var q1 = biDivideByRadixPower(x, this.k - 1);
	var q2 = biMultiply(q1, this.mu);
	var q3 = biDivideByRadixPower(q2, this.k + 1);
	var r1 = biModuloByRadixPower(x, this.k + 1);
	var r2term = biMultiply(q3, this.modulus);
	var r2 = biModuloByRadixPower(r2term, this.k + 1);
	var r = biSubtract(r1, r2);
	if(r.isNeg) {
		r = biAdd(r, this.bkplus1);
	}
	var rgtem = biCompare(r, this.modulus) >= 0;
	while (rgtem) {
		r = biSubtract(r, this.modulus);
		rgtem = biCompare(r, this.modulus) >= 0;
	}
	return r;
}

function BarrettMu_multiplyMod(x, y)
{//return biMultiplyMod(x,y,this.modulus)
	
	//x = biModulo(x, this.modulus);
	//y = biModulo(y, this.modulus);
	
	var xy = biMultiply(x, y);
	//return biMultiplyMod(x,y,this.modulus); 
	//return biModulo(xy, this.modulus);
	return this.modulo(xy);
}

function BarrettMu_powMod(x, y)
{

return biMontgomeryPowMod(x,y,this.modulus)

	var result = new BigInt();
	result.digits[0] = 1;
	var a = x;
	var k = y;
	while (true) {
		if ((k.digits[0] & 1) != 0) result = this.multiplyMod(result, a);
		k = biShiftRight(k, 1);
		if (k.digits[0] == 0 && biHighIndex(k) == 0) break;
		a = this.multiplyMod(a, a);
	}
	return result;
}


function BarrettMu_powMod11(x, y){
	var result = new BigInt();
	result.digits[0] = 1;
	var a = x;
	var k = biToString(y, 2);
	var n = k.length;
	for (var i = k.length - 1; i > -1; i--){
		if (k.charAt(i) == "1")
			result = this.multiplyMod(result, a);
		a = this.multiplyMod(a, a);
	}
	return result;
}

