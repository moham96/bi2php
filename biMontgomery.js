

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
	//alert(biToString(a,10) + "/"+biToString(b,10) +"=="+ biToString(q,10) +"|" +biToString(r,10))
    x = biSubtract(x2, biMultiply(q, x1));
	y = biSubtract(y2, biMultiply(q, y1));
    a = b;
	b = r;
	//alert(biDump(b))
    x2 = x1;
	x1 = x;
	y2 = y1;
	y1 = y;
  }
  d = a, x = x2, y = y2;
  /*alert(biToString(x,10))
  alert(biToString(y,10))
  alert(biToString(d,10))
  alert(biToString(biAdd(biMultiply(origA,x),biMultiply(origB,y)),10))*/

  return [x, y, d];
}

function biMontgomery00(a, m){
	alert(biDump(m))
	var nm = biHighIndex(m) + 1;
	alert(nm)
	alert(biDump(biFromNumber(biRadix)))
	alert(biDump(biFromNumber(nm)))
	var R = biPow(biFromNumber(biRadix), nm);
	alert("R="+biDump(R))
	var Ri = (biModularInverse(R, m));
	alert("Be="+biDump(Be))
	var s1 = biModulo(a, R);
	alert("s1="+biDump(s1))

	var s2 = biModulo(biMultiply(Be, s1), R);
	alert("s2="+biDump(s2))
	var s3 = biMultiply(m, s2);
	alert("s3="+biDump(s3))
	var t = biDivide(biAdd(a, s3), R);
	var i = 50;
	while (biCompare(t, m) >= 0){
		t = biSubtract(t, m);
		if (!i--)
			break;
	}
	return t;
}

function biMontgomery(T, N){
alert("N"+biDump(N))
alert("T"+biDump(T))

	var nN = biHighIndex(N) + 1;
	var R = biPow(biFromNumber(biRadix), nN);
	alert("R"+biDump(R))

	var EGCD = biExtendedEuclid(R, N);
	var Ri = EGCD[0];
	alert("Ri"+biDump(Ri))

	var Rii = biModularInverse(Ri, N);
	alert("Rii"+biDump(Rii))

	//alert("Rii"+biDump(Rii))
	var Ni = biMinus(EGCD[1]);
	alert("Ni"+biDump(Ni))

	var GCD = EGCD[3];
	alert("******"+biDump(biSubtract(biMultiply(R,Ri),biMultiply(N,Ni)),10))
	var m = biModulo(T, R);
	alert("m1"+biDump(m))

	alert(biToString(T,10)+"%\n"+biToString(R,10)+"=\n"+biToString(m,10))
	var m0 = biMultiply(m, Ni);
	alert("m2"+biDump(m0))

	alert(biToString(m,10)+"*\n"+biToString(Ni,10)+"=\n"+biToString(m0,10)+"\n\n***")
	var m = biModulo(m0, R);
	alert("m3"+biDump(m))

	alert(biToString(m0,10)+"%\n"+biToString(R,10)+"=\n"+biToString(m,10)+"\n\n***")
	var m0 = biMultiply(m, N);
	alert("m4"+biDump(m0))

	alert(biToString(m,10)+"*\n"+biToString(N,10)+"=\n"+biToString(m0,10)+"\n\n***")
	m = biAdd(T, m0)
	alert("T"+biDump(T))
	alert("m0"+biDump(m0))

	alert("m5"+biDump(m))

	alert(biToString(T,10)+"+\n"+biToString(m0,10)+"=\n"+biToString(m,10)+"\n\n***")
	debug = 0
	var t = biDivide(m, R)
	debug = 0
	alert(biToString(m,10)+"/\n"+biToString(R,10)+"=\n"+biToString(t,10)+"\n\n***")
	if (biCompare(t, N) >= 0)
		t = biSubtract(t, N);
	alert("t="+biDump(t))
	//t=biModulo(biMultiply(T, Ri),N)
	alert("******"+biDump(biSubtract(biMultiply(R,Ri),biMultiply(N,Ni)),10))
	alert(biDump( biModulo(biMultiply(T, Ri),N)))
	return biModulo(biMultiply(biAdd(t, biFromNumber(0)), Rii), N);
}


function biMontgomery111(e, m){
	var nm = biHighIndex(m) + 1;
	var R = biPow(biFromNumber(biRadix), nm);
	var ei = (biModularInverse(e, m));
	var r = biModulo(m, ei);
	var b1 = biModulo(biMultiply(b, Ri), m);
	var a1b1 = biMultiply(a1, b1);
	var t = biMultiply(a1b1, R);
	var t = biMultiply(t, R);
	return biModulo(t, m);
}

