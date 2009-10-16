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
function biModularInverse(e, m){
	e = biModulo(e, m);
	var result = biExtendedEuclid(m, e);
	if (!result[2].isOne())
		return null;
	return result[1];
}

function biExtendedEuclid(a, b){
	if (biCompare(a, b) >= 0)
		return biExtendedEuclidNatural(a, b);
	var result = biExtendedEuclidNatural(b, a);
	return [ result[1], result[0], result[3] ];
}

function biExtendedEuclidNatural(a, b){
// calculates a * x + b * y = gcd(a, b) 
// require a >= b
	var qr, q, r, x1, x2, y1, y2, x, y;
	if (b.isZero())
		return [biFromNumber(1), biFromNumber(0), a];
	x1 = biFromNumber(0);
	x2 = biFromNumber(1);
	y1 = biFromNumber(1);
	y2 = biFromNumber(0);
	while (!b.isZero()){
		qr = biDivideModulo(a, b);
		q = qr[0];
		r = qr[1];
		x = biSubtract(x2, biMultiply(q, x1));
		y = biSubtract(y2, biMultiply(q, y1));
		a = b;
		b = r;
		x2 = x1;
		x1 = x;
		y2 = y1;
		y1 = y;
	}
	return [x2, y2, a];
}

function biMontgomeryModulo(T, N, nN, R, EGCD, Ri, Ni){
	var nN = nN || biHighIndex(N) + 1;
	var R = R || biMultiplyByRadixPower(biFromNumber(1), nN);
	var EGCD = EGCD || biExtendedEuclid(R, N);
	var Ri = Ri || EGCD[0];
	var Ni = Ni || biMinus(EGCD[1]);
	var m = biModulo(T, R);
	m = biMultiply(m, Ni);
	m = biModuloByRadixPower(m, nN);
	m = biMultiply(m, N);
	m = biAdd(T, m);
	// m=biAdd(T, biMultiply(biModuloByRadixPower(m, nN), N));
	/*var t = biDivideByRadixPower(m, nN);
	while (biCompare(t, N) >= 0)
		t = biSubtract(t, N);*/
	m = biModulo(m, N)
	return m;
}

function biMontgomeryPowMod(T, pow, N){
	var nN = biHighIndex(N) + 1;
	var	R = biMultiplyByRadixPower(biFromNumber(1), nN);
	var	EGCD = biExtendedEuclid(R, N);
	var Ri = biModulo(EGCD[0], N);
	var	Ni = biMinus(EGCD[1]);
		//Ni = biModulo(Ni, R);
	var k;
	if (pow.k)	
		k = pow.k;
	else
		pow.k = k = biToString(pow, 2);
	var result = biFromNumber(1);
	var m = biModuloByRadixPower(biMultiply(T, Ni), nN);
	for (var i = k.length - 1; i > -1; i--){
		if (k.charAt(i) == "1")
			result = biModuloByRadixPower(biMultiply(result, m), nN);
		m = biModuloByRadixPower(biMultiply(m, m), nN);
	}
	result = biMultiply(result, N);
	result = biAdd(T, result);
	//m=biAdd(T, biMultiply(biModuloByRadixPower(m, nN), N));
	//var t = biDivideByRadixPower(m, nN);
	//while (biCompare(result, N) >= 0)
	//result = biSubtract(result, N);
	result = biModulo(result, N);
	return result;
}
