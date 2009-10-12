

function biModularInverse(e, m){
	var qr = biDivideModulo(m, e);
	var q = qr[0];
	var r = qr[1];
	var t = biPow(r, biSubtract(e, biFromNumber(2)))
	t = biModulo(t, e);
	t = biSubtract(e, t);
	q = biMultiply(q, t);
	var einv = biMultiply(t, r);
	einv = biDivide(einv, e);
	einv = biAdd(einv, q);
	einv = biAdd(einv, biFromNumber(1));
	qr= biMultiply(e, einv)
	qr = biDivideModulo(qr, m)
	alert(biDump(qr[1]))
	return rinv;
}