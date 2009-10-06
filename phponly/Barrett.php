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
class biBarrettMu{

	var $modulus;
	var $k;
	var $mu;
	var $bkplus1;
	
	function biBarrettMu($m){
		$this->modulus = biCopy($m);
		$this->k = biHighIndex($this->modulus) + 1;
		$b2k = new BigInt();
		$b2k->digits[2 * $this->k] = 1; // b2k = b^(2k)
		$this->mu = biDivide($b2k, $this->modulus);
		$this->bkplus1 = new BigInt();
		$this->bkplus1->digits[$this->k + 1] = 1; // bkplus1 = b^(k+1)
		//$this->modulo = BarrettMu_modulo;
		//$this->multiplyMod = BarrettMu_multiplyMod;
		//this.powMod = BarrettMu_powMod;
	}

	function /*BarrettMu_*/modulo($x){
		$q1 = biDivideByRadixPower($x, $this->k - 1);
		$q2 = biMultiply($q1, $this->mu);
		$q3 = biDivideByRadixPower($q2, $this->k + 1);
		$r1 = biModuloByRadixPower($x, $this->k + 1);
		$r2term = biMultiply($q3, $this->modulus);
		$r2 = biModuloByRadixPower($r2term, $this->k + 1);
		$r = biSubtract($r1, $r2);
		if ($r->isNeg) {
			$r = biAdd($r, $this->bkplus1);
		}
		$rgtem = biCompare($r, $this->modulus) >= 0 ? 1 : 0;
		while ($rgtem) {
			$r = biSubtract($r, $this->modulus);
			$rgtem = biCompare($r, $this->modulus) >= 0 ? 1 : 0;
		}
		return $r;
	}

	function /*BarrettMu_*/multiplyMod($x, $y){
	/*
	x = this.modulo(x);
	y = this.modulo(y);
	*/
		$xy = biMultiply($x, $y);
		return $this->modulo($xy);
	}

	function /*BarrettMu_*/powMod($x, $y){
		$result = new BigInt();
		$result->digits[0] = 1;
		$a = $x;
		$k = $y;
		while (true){
			if (($k->digits[0] & 1) != 0) $result = $this->multiplyMod($result, $a);
			$k = biShiftRight($k, 1);
			if ($k->digits[0] == 0 && biHighIndex($k) == 0) break;
			$a = $this->multiplyMod($a, $a);
		}
		return $result;
	}

}