

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

