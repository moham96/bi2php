

function biModularInverse(e, m){
	//e = e % m;
	var result = biExtendedEuclid(m, e);
	while (result[1].isNeg)
		result[1] = biAdd(result[1],m);
	if (result[2].isOne())
		return result[1];
	else
		return null;
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
/* calculates a * *x + b * *y = gcd(a, b) = *d */
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
  alert(biToString(x,10))
  alert(biToString(y,10))
  alert(biToString(d,10))

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

function biMontgomery(a, b, m){
	var nm = biHighIndex(m) + 1;
	var R = biPow(biFromNumber(biRadix), nm);
	var Ri = (biModularInverse(R, m));
	var a1 = biModulo(biMultiply(a, R), m);
	var b1 = biModulo(biMultiply(b, R), m);
	var a1b1 = biMultiply(a1, b1);
	var t = biDivide(a1b1, R);
	var t = biMultiply(t, Ri);
	return biModulo(t, m);
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

