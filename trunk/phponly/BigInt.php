<?php
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
// Porte to PHP by Andrey V. Ovcharenko
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
// needs. Use the biSetMaxDigits() function to do this. See comments below.
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
// zeroed-out array ZERO_ARRAY is constructed inside the biSetMaxDigits()
// function. So use this function to set the variable. DON'T JUST SET THE
// VALUE. USE THE FUNCTION.
//
// ZERO_ARRAY exists to hopefully speed up construction of BigInts(). By
// precalculating the zero array, we can just use slice(0) to make copies of
// it. Presumably this calls faster native code, as opposed to setting the
// elements one at a time. I have not done any timing tests to verify this
// claim.

// Max number = 10^16 - 2 = 9999999999999998;
//               2^53     = 9007199254740992;

$biRadixBase = 2;
$biRadixBits = 12;//16;
$biBitsPerDigit = $biRadixBits;
$biRadix = 1 << $biRadixBits;//16; // = 2^16 = 65536
$biHalfRadix = $biRadix >> 1;
$biRadixSquared = $biRadix * $biRadix;
$biMaxDigitVal = $biRadix - 1;
$biMaxInteger = 2147483647;//9999999999999998; //2147483648

// maxDigits:
// Change this to accommodate your largest number size. Use biSetMaxDigits()
// to change it!
//
// In general, if you're working with numbers of size N bits, you'll need 2*N
// bits of storage. Each digit holds 16 bits. So, a 1024-bit key will need
//
// 1024 * 2 / 16 = 128 digits of storage.
//

$biMaxDigits;
$biZERO_ARRAY;
$biBigZero;
$biBigOne;


function biSetMaxDigits($value){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$biMaxDigits = $value;
	$biZERO_ARRAY = array_pad(array(), $biMaxDigits, 0);
	$biBigZero = new BigInt();
	$biBigOne = new BigInt();
	$biBigOne->digits[0] = 1;
}

biSetMaxDigits(20);

// The maximum number of digits in base 10 you can convert to an
// integer without JavaScript throwing up on you.
$dpl10 = 6;
// lr10 = 10 ^ dpl10
$lr10 = biFromNumber(1000000);

class BigInt{

	public $digits;
	public $isNeg;
	
	function BigInt($flag = NULL){
		global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
		$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;
	
		if (is_bool($flag) && $flag === true){
			$this->digits = null;
		}else{
			$this->digits = array_pad(array(), $biMaxDigits, 0);
		}
		$this->isNeg = 0;//false;
	}
	
	public static $hexatrigesimalToChar = array(
 '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
 'u', 'v', 'w', 'x', 'y', 'z');

	public static $hexToChar = array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                          'a', 'b', 'c', 'd', 'e', 'f');
							 
}

function biFromDecimal($s){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;
	
	$isNeg = (substr($s, 0, 1) == '-') ? 1 : 0;
	$i = $isNeg ? 1 : 0;
	$result;
	// Skip leading zeros.
	while ($i < strlen($s) && substr($s, $i, 1) == '0') ++$i;
	if ($i == strlen($s)){
		$result = new BigInt();
	}else{
		$digitCount = strlen($s) - $i;
		$fgl = $digitCount % $dpl10;
		if ($fgl == 0) $fgl = $dpl10;
		$result = biFromNumber(0 + substr($s, $i, $fgl));
		$i += $fgl;
		while ($i < strlen($s)) {
			$result = biAdd(biMultiply($result, $lr10),
			               biFromNumber(0 + substr($s, $i, $dpl10)));
			$i += $dpl10;
		}
		$result->isNeg = $isNeg ? 1 : 0;
	}
	return $result;
}

function biCopy($bi){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = new BigInt(true);
	$result->digits = array_slice($bi->digits, 0);
	$result->isNeg = $bi->isNeg ? 1 : 0;
	return $result;
}

function biFromNumber($i){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = new BigInt();
	$result->isNeg = $i < 0 ? 1 : 0;
	$i = abs($i);
	$j = 0;
	while ($i > 0) {
		$result->digits[$j++] = $i & $biMaxDigitVal;
		$i >>= $biRadixBits;
	}
	return $result;
}

function biReverseStr($s){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = "";
	for ($i = strlen($s) - 1; $i > -1; --$i) {
		$result .= substr($s, $i, 1);
	}
	return $result;
}



function biToString($x, $radix){
	// 2 <= radix <= 36
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;
	
	$origXIsNeg = $x->isNeg;
	if ($origXIsNeg){
		$x = biCopy($x);
		$x->isNeg = 0;
	}
	$b = new BigInt();
	$b->digits[0] = $radix;
	$qr = biDivideModulo($x, $b);
	$result = BigInt::$hexatrigesimalToChar[$qr[1]->digits[0]];
	while (biCompare($qr[0], $biBigZero) == 1) {
		$qr = biDivideModulo($qr[0], $b);
		$digit = $qr[1]->digits[0];
		$result = $result . BigInt::$hexatrigesimalToChar[$qr[1]->digits[0]];
	}
	return ($origXIsNeg ? "-" : "") . biReverseStr($result);
}

function biToDecimal($x){
	return biToString($x, 10);
}


function biDigitToHex($n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	if ($n > 2147483648) {
		throw new Exception("numeric owerflow in biDigitToHex($n)");
	}
	$mask = 0xf;
	$result = "";
	for ($i = 0; $i < 4; ++$i) {
		$result = $result . BigInt::$hexToChar[$n & $mask];
		$n >>= 4;
	}
	return biReverseStr($result);
}

function biToHex($x){
	return biToString($x, 16);
}

function biCharToHex($c){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$ZERO = 48;
	$NINE = $ZERO + 9;
	$littleA = 97;
	$littleZ = $littleA + 25;
	$bigA = 65;
	$bigZ = 65 + 25;
	$result;

	if ($c >= $ZERO && $c <= $NINE) {
		$result = $c - $ZERO;
	} else if ($c >= $bigA && $c <= $bigZ) {
		$result = 10 + $c - $bigA;
	} else if ($c >= $littleA && $c <= $littleZ) {
		$result = 10 + $c - $littleA;
	} else {
		$result = 0;
	}
	return $result;
}

function biHexToDigit($s){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = 0;
	$sl = min(strlen($s), 4);
	for ($i = 0; $i < $sl; ++$i) {
		$result <<= 4;
		$result = $result | biCharToHex(ord(substr($s, $i, 1)));
	}
	return $result;
}

function biFromHex($s){
	return biFromString($s, 16);
}

function biFromString($s, $radix){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$isNeg = (substr($s, 0,1) == '-') ? 1 : 0;
	$istop = $isNeg ? 1 : 0;
	$result = new BigInt();
	$place = new BigInt();
	$place->digits[0] = 1; // radix^0
	for ($i = strlen($s) - 1; $i >= $istop; $i--) {
		$c = ord(substr($s, $i, 1));
		$digit = biCharToHex($c);
		$biDigit = biMultiplyDigit($place, $digit);
		$result = biAdd($result, $biDigit);
		$place = biMultiplyDigit($place, $radix);
	}
	$result->isNeg = $isNeg ? 1 : 0;
	return $result;
}

function biDump($b){
	return ($b->isNeg ? "-" : "") . join('-',$b->digits);
}

function biAdd($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result;
	if ($x->isNeg != $y->isNeg) {
		$y->isNeg = (!$y->isNeg) ? 1 : 0;
		$result = biSubtract($x, $y);
		$y->isNeg = (!$y->isNeg) ? 1 : 0;
	}else{
		$result = new BigInt();
		$c = 0;
		$n;
		for ($i = 0; $i < count($x->digits); ++$i) {
			$n = $x->digits[$i] + $y->digits[$i] + $c;
			$result->digits[$i] = $n & $biMaxDigitVal;
			$c = ($n >= $biRadix) ? 1 : 0;
		}
		$result->isNeg = $x->isNeg ? 1 : 0;
	}
	return $result;
}

function biSubtract($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result;
	if ($x->isNeg != $y->isNeg) {
		$y->isNeg = (!$y->isNeg) ? 1 : 0;
		$result = biAdd($x, $y);
		$y->isNeg = (!$y->isNeg) ? 1 : 0;
	} else {
		$result = new BigInt();
		$n;
		$c;
		$c = 0;
		for ($i = 0; $i < count($x->digits); ++$i) {
			$n = $x->digits[$i] - $y->digits[$i] + $c;
			$result->digits[$i] = $n & $biMaxDigitVal;
			// Stupid non-conforming modulus operation.
			if ($result->digits[$i] < 0) $result->digits[$i] += $biRadix;
			$c = 0 -  ($n < 0 ? 1 : 0);
		}
		// Fix up the negative sign, if any.
		if ($c == -1) {
			$c = 0;
			for ($i = 0; $i < count($x->digits); ++$i) {
				$n = 0 - $result->digits[$i] + $c;
				$result->digits[$i] = $n & $biMaxDigitVal;
				// Stupid non-conforming modulus operation.
				if ($result->digits[$i] < 0) $result->digits[$i] += $biRadix;
				$c = 0 - ($n < 0 ? 1 : 0);
			}
			// Result is opposite sign of arguments.
			$result->isNeg = (!$x->isNeg) ? 1 : 0;
		} else {
			// Result is same sign.
			$result->isNeg = $x->isNeg ? 1 : 0;
		}
	}
	return $result;
}

function biHighIndex($x){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = count($x->digits) - 1;
	while ($result > 0 && $x->digits[$result] == 0) --$result;
	return $result;
}

function biNumBits($x){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;


	$n = biHighIndex($x);
	$d = $x->digits[$n];
	$m = ($n + 1) * $biBitsPerDigit;
	$result;
	for ($result = $m; $result > $m - $biBitsPerDigit; --$result) {
		if (($d & $biHalfRadix) != 0) break;
		$d <<= 1;
	}
	return $result;
}

function biMultiply($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = new BigInt();
	$c;
	$n = biHighIndex($x);
	$t = biHighIndex($y);
	$u;
	$uv;
	$k;

	for ($i = 0; $i <= $t; ++$i) {
		$c = 0;
		$k = $i;
		for ($j = 0; $j <= $n; ++$j, ++$k) {
			$uv = $result->digits[$k] + $x->digits[$j] * $y->digits[$i] + $c;
			$result->digits[$k] = $uv & $biMaxDigitVal;
			$c = $uv >> $biRadixBits;
		}
		$result->digits[$i + $n + 1] = $c;
	}
	// Someone give me a logical xor, please.
	$result->isNeg = ($x->isNeg != $y->isNeg) ? 1 : 0;
	return $result;
}

function biMultiplyDigit($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;


	$n;
	$c;
	$uv;

	$result = new BigInt();
	$n = biHighIndex($x);
	$c = 0;
	for ($j = 0; $j <= $n; ++$j) {
		$uv = $result->digits[$j] + $x->digits[$j] * $y + $c;
		$result->digits[$j] = $uv & $biMaxDigitVal;
		$c = $uv >> $biRadixBits;
	}
	$result->digits[1 + $n] = $c;
	return $result;
}

function biArrayCopy($src, $srcStart, &$dest, $destStart, $n){
	$m = min($srcStart + $n, count($src));
	for ($i = $srcStart, $j = $destStart; $i < $m; ++$i, ++$j) {
		$dest[$j] = $src[$i];
	}
}

function biShiftLeft($x, $n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$digitCount = intval(floor($n / $biBitsPerDigit));
	$result = new BigInt();
	biArrayCopy($x->digits, 0, $result->digits, $digitCount, count($result->digits) - $digitCount);
	$bits = $n % $biBitsPerDigit;
	$rightBits = $biBitsPerDigit - $bits;
	for ($i = count($result->digits) - 1, $i1 = $i - 1; $i > 0; --$i, --$i1) {
		$result->digits[$i] = (($result->digits[$i] << $bits) & $biMaxDigitVal) | ($result->digits[$i1] >> $rightBits);
	}
	$result->digits[0] = (($result->digits[$i] << $bits) & $biMaxDigitVal);
	$result->isNeg = $x->isNeg ? 1 : 0;
	return $result;
}

function biShiftRight($x, $n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;


	$digitCount = intval(floor($n / $biBitsPerDigit));
	$result = new BigInt();
	biArrayCopy($x->digits, $digitCount, $result->digits, 0,
	          count($x->digits) - $digitCount);
	$bits = $n % $biBitsPerDigit;
	$leftBits = $biBitsPerDigit - $bits;
	for ($i = 0, $i1 = $i + 1; $i < count($result->digits) - 1; ++$i, ++$i1) {
		$result->digits[$i] = ($result->digits[$i] >> $bits) | ($result->digits[$i1] << $leftBits) & $biMaxDigitVal;
	}
	$result->digits[count($result->digits) - 1] >>= $bits;
	$result->isNeg = $x->isNeg ? 1 : 0;
	return $result;
}

function biMultiplyByRadixPower($x, $n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = new BigInt();
	biArrayCopy($x->digits, 0, $result->digits, $n, count($result->digits) - $n);
	return $result;
}

function biDivideByRadixPower($x, $n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = new BigInt();
	biArrayCopy($x->digits, $n, $result->digits, 0, count($result->digits) - $n);
	return $result;
}

function biModuloByRadixPower($x, $n){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;


	$result = new BigInt();
	biArrayCopy($x->digits, 0, $result->digits, 0, $n);
	return $result;
}

function biCompare($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	if ($x->isNeg != $y->isNeg) {
		return 1 - 2 * ($x->isNeg ? 1 : 0);
	}
	
	if ($x->isNeg != $y->isNeg) {
		return 1 - 2 * ($x->isNeg ? 1 : 0);
	}

	$nx = biHighIndex($x);
	$ny = biHighIndex($y);
	
	if ($nx != $ny) {
		if ($x->isNeg) {
			return 1 - 2 * (($nx > $ny) ? 1 : 0);
		} else {
			return 1 - 2 * (($nx < $ny) ? 1 : 0);
		}
	}

	$bx = biNumBits($x);
	$by = biNumBits($y);
	
	if ($bx != $by) {
		if ($x->isNeg) {
			return 1 - 2 * (($bx > $by) ? 1 : 0);
		} else {
			return 1 - 2 * (($bx < $by) ? 1 : 0);
		}
	}
	
	for ($i = count($x->digits) - 1; $i >= 0; --$i) {
		if ($x->digits[$i] != $y->digits[$i]) {
			if ($x->isNeg) {
				return 1 - 2 * (($x->digits[$i] > $y->digits[$i]) ? 1 : 0);
			} else {
				return 1 - 2 * (($x->digits[$i] < $y->digits[$i]) ? 1 : 0);
			}
		}
	}
	return 0;
}

function biCompareModule($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;
	
	$nx = biHighIndex($x);
	$ny = biHighIndex($y);
	
	if ($nx != $ny) {
			return 1 - 2 * (($nx < $ny) ? 1 : 0);
	}

	$bx = biNumBits($x);
	$by = biNumBits($y);
	
	if ($bx != $by) {
			return 1 - 2 * (($bx < $by) ? 1 : 0);
	}	

	for ($i = count($x->digits) - 1; $i >= 0; --$i)
		if ($x->digits[$i] != $y->digits[$i])
				return 1 - 2 * (($x->digits[$i] < $y->digits[$i]) ? 1 : 0);
	return 0;
}


function biDivideModulo($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$nb = biNumBits($x);
	$nh = biHighIndex($x);
	$tb = biNumBits($y);
	$th = biHighIndex($y);
	$origXIsNeg = $x->isNeg ? 1 : 0;
	$origYIsNeg = $y->isNeg ? 1 : 0;
	$origX = $x;
	$origY = $y;
	$q;
	$r;

	if ($nb < $tb  || ($nb == $tb && biCompareModule($x, $y) < 0)) {
		// |x| < |y|
		if (($x->isNeg && $y->isNeg) xor (!$x->isNeg && !$y->isNeg)){
			$q = new BigInt();
			$r= biCopy($x);
		}else {
			$q = new BigInt();
			$q->digits[0] = 1;
			$q->isNeg = 1;
			$r = biAdd($y, $x);
		}
		return array($q, $r);
	}
	$q = new BigInt();
	$x = biCopy($x);
	$x->isNeg = 0;
	$r = $x;
	$y = biCopy($y);
	$y->isNeg = 0;
	// Normalize Y.
	$t = ceil($tb / $biBitsPerDigit) - 1;
	$lambda = 0;
	while ($y->digits[$t] < $biHalfRadix) {
		$y = biShiftLeft($y, 1);
		++$lambda;
		++$tb;
		$t = intval(ceil($tb / $biBitsPerDigit)) - 1;
	}
	// Shift r over to keep the quotient constant. We'll shift the
	// remainder back at the end.
	$r = biShiftLeft($r, $lambda);
	$nb += $lambda; // Update the bit count for x.
	$n = intval(ceil($nb / $biBitsPerDigit)) - 1;

	$b = biMultiplyByRadixPower($y, $n - $t);
	while (biCompare($r, $b) != -1) {
		$q->digits[$n - $t] += 1;
		$r = biSubtract($r, $b);
	}
	for ($i = $n; $i > $t; --$i) {
    $ri = ($i >= count($r->digits)) ? 0 : $r->digits[$i];
    $ri1 = ($i - 1 >= count($r->digits)) ? 0 : $r->digits[$i - 1];
    $ri2 = ($i - 2 >= count($r->digits) || $i - 2 < 0) ? 0 :  $r->digits[$i - 2];
    $yt = ($t >= count($y->digits)) ? 0 : $y->digits[$t];
    $yt1 = ($t - 1 >= count($y->digits) || $t - 1 < 0 ) ? 0 : $y->digits[$t - 1];
		if ($ri == $yt) {
			$q->digits[$i - $t - 1] = $biMaxDigitVal;
		} else {
			$q->digits[$i - $t - 1] = intval(floor(($ri * $biRadix + $ri1) / $yt));
		}

		$c1 = $q->digits[$i - $t - 1] * (($yt * $biRadix) + $yt1);
		$c2 = ($ri * $biRadixSquared) + (($ri1 * $biRadix) + $ri2);
		while ($c1 > $c2) {
			$q->digits[$i - $t - 1] -= 1;
			$c1 = $q->digits[$i - $t - 1] * (($yt * $biRadix) | $yt1);
			$c2 = ($ri * $biRadix * $biRadix) + (($ri1 * $biRadix) + $ri2);
		}

		$b = biMultiplyByRadixPower($y, $i - $t - 1);
		$r = biSubtract($r, biMultiplyDigit($b, $q->digits[$i - $t - 1]));
		if ($r->isNeg) {
			$r = biAdd($r, $b);
			$q->digits[$i - $t - 1] -= 1;
		}
	}
	$r = biShiftRight($r, $lambda);
	// Fiddle with the signs and stuff to make sure that 0 <= r < y.
	/*$q->isNeg = ($x->isNeg != $origYIsNeg) ? 1 : 0;
	if ($x->isNeg) {
		if ($origYIsNeg) {
			$q = biAdd($q, $biBigOne);
		} else {
			$q = biSubtract($q, $biBigOne);
		}
		$y = biShiftRight($y, $lambda);
		$r = biSubtract($y, $r);
	}*/
	// Check for the unbelievably stupid degenerate case of r == -0.
	/*
	$origXIsNeg = $x->isNeg ? 1 : 0;
	$origYIsNeg = $y->isNeg ? 1 : 0;
	if ($nb < $tb  || ($nb == $tb && biCompareModule($x, $y) < 0)) {
		// |x| < |y|
		if (($x->isNeg && $y->isNeg) xor (!$x->isNeg && !$y->isNeg)){
			$q = new BigInt();
			$r= biCopy($x);
		}else {
			$q = new BigInt();
			$q->digits[0] = 1;
			$q->isNeg = 1;
			$r = biAdd($y, $x);
		}
		return array($q, $r);
	}
	*/


	if ((!$origXIsNeg) && (!$origYIsNeg)){
		return array($q, $r);
	}elseif ($origXIsNeg && $origYIsNeg){
		$r->isNeg = 1;
		return array($q, $r);
	}else{

	$q->isNeg = 1;
		$q = biSubtract($q, $biBigOne);
		$r->isNeg = $origXIsNeg;
		$r = biAdd($r, $origY);
	}

	if ($r->digits[0] == 0 && biHighIndex($r) == 0) $r->isNeg = 0;

	return array($q, $r);
}


function biDivide($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$res = biDivideModulo($x, $y);
	$res = $res[0];
	return $res;
}

function biModulo($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$res = biDivideModulo($x, $y);
	$res = $res[1];
	return $res;
}

function biMultiplyMod($x, $y, $m)
{
	return biModulo(biMultiply($x, $y), $m);
}

function biPow($x, $y){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;


	$result = $biBigOne;
	$a = $x;
	while (true) {
		if (($y & 1) != 0) $result = biMultiply($result, $a);
		$y >>= 1;
		if ($y == 0) break;
		$a = biMultiply($a, $a);
	}
	return $result;
}

function biPowMod($x, $y, $m){
	global $biRadixBase, $biRadixBits, $biBitsPerDigit, $biRadix, $biHalfRadix, $biRadixSquared, 
	$biMaxDigitVal, $biMaxInteger, $biMaxDigits, $biZERO_ARRAY, $biBigZero, $biBigOne, $dpl10, $lr10;

	$result = $biBigOne;
	$a = $x;
	$k = $y;
	while (true) {
		if (($k->digits[0] & 1) != 0) $result = biMultiplyMod($result, $a, $m);
		$k = biShiftRight($k, 1);
		if ($k->digits[0] == 0 && biHighIndex($k) == 0) break;
		$a = biMultiplyMod($a, $a, $m);
	}
	return $result;
}

