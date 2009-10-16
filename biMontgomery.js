

function biModularInverse(e, m){
	e = biModulo(e, m);
	var result = biExtendedEuclid(m, e);
	if (!result[2].isOne())
		return null;
	return biModulo(result[1], m);
}

/*А ВХОДЕ: два неотрицательных числа a и b: a>=b
НА ВЫХОДЕ: d=НОД(a,b) и целые x,y: ax + by = d.

1. Если b=0 положить d:=a, x:=1, y:=0 и возвратить (d,x,y)
2. Положить x2:=1, x1:=0, y2:=0, y1:=1
3. Пока b>0
    3.1 q:=[a/b], r:=a-qb, x:=x2-qx1, y:=y2-qy1
    3.2 a:=b, b:=r, x2:=x1, x1:=x, y2:=y1, y1:=y
4. Положить d:=a, x:=x2, y:=y2 и возвратить (d,x,y)
*/

function biExtendedEuclid(a, b){
	if (biCompare(a, b) >= 0)
		return biExtendedEuclidNatural(a, b);
	var result = biExtendedEuclidNatural(b, a);
	return [ result[1], result[0], result[3] ];
}

function biExtendedEuclidNatural(a, b){
// calculates a * x + b * y = gcd(a, b) 
// require a >= b
	var origA = a;
	var origB = b;
	var qr, q, r, x1, x2, y1, y2, x, y, d;
	if (b.isZero())
		return [biFromNumber(1), biFromNumber(0), a];
	x2 = biFromNumber(1);
	x1 = biFromNumber(0);
	y2 = biFromNumber(0);
	y1 = biFromNumber(1);
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
  d = a, x = x2, y = y2;
  return [x, y, d];
}

f12345=0

function biMontgomeryModulo(T, N, nN, R, EGCD, Ri, Rii, Ni){
	var nN = nN || biHighIndex(N) + 1;
	//var R = biPow(biFromNumber(biRadix), nN);
	var R = R || biMultiplyByRadixPower(biFromNumber(1), nN);
	var EGCD = EGCD || biExtendedEuclid(R, N);
	var Ri = Ri || EGCD[0];
	var Rii = Rii || biModularInverse(Ri, N);
	var Ni = Ni || biMinus(EGCD[1]);
	//var GCD = EGCD[3];
	var m = biModulo(T, R);
	m = biMultiply(m, Ni);
	if (f12345++<5)
	alert(biDump(m))
	m = biModuloByRadixPower(m, nN);
	m = biMultiply(m, N);
	m = biAdd(T, m);
	var t = biDivideByRadixPower(m, nN);
	while (biCompare(t, N) >= 0)
		t = biSubtract(t, N);
	return biModulo(biMultiply(t, Rii), N);
}

function biMontgomeryPowMod(T, pow, N){
	var nN = biHighIndex(N) + 1;
	var	R = biPow(biFromNumber(biRadix), nN);
	var	EGCD = biExtendedEuclid(R, N);
	var Ri = EGCD[0];
	var Rii = biModularInverse(Ri, N);
	var	Ni = biMinus(EGCD[1]);
		Ni = biAdd(Ni, R);
	var k = biToString(pow, 2);
	var result = biFromNumber(1);
	var m = T;
	for (var i = k.length - 1; i > -1; i--){
		if (k.charAt(i) == "1")
			result = biMontgomeryModulo(biMultiply(result, m), N, nN, R, EGCD, Ri, Rii, Ni);
		m = biModulo(biMultiply(m, m), N, nN, R, EGCD, Ri, Rii, Ni);
	}
	return result;

}


function biMontgomeryStep(){}