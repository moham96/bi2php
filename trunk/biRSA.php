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
// RSA, a suite of routines for performing RSA public-key computations in
// JavaScript.
//
// Requires BigInt.js and Barrett.js.
//
// Copyright 1998-2005 David Shapiro.
//
// You may use, re-use, abuse, copy, and modify this code to your liking, but
// please keep this header.
//
// Thanks!
// 
// Dave Shapiro
// dave@ohdave.com 
class biRSAKeyPair{
	var $e;
	var $d;
	var $m;
	function biRSAKeyPair($encryptionExponent, $decryptionExponent, $modulus){
		//global $biRadixBits;
		$this->e = $encryptionExponent;
		$this->d = $decryptionExponent;
		$this->m = $modulus;
		// We can do two bytes per digit, so
		// chunkSize = 2 * (number of digits in modulus - 1).
		// Since biHighIndex returns the high index, not the number of digits, 1 has
		// already been subtracted.
		$count = 0;
		$r = $this->m;
		while ($r !== "0"){
			$r =  bcdiv($r, '65536', 0);
			$count++;
		}
		$this->chunkSize = ($count - 1) * 2;
		//$this->radix = $biRadixBits;//12;
		//$this->barrett = new biBarrettMu($this->m);
	}

	function biEncryptedString($key, $s){
	// Altered by Rob Saunders (rob@robsaunders.net). New routine pads the
	// string after it has been converted to an array. This fixes an
	// incompatibility with Flash MX's ActionScript.
		$a = array();
		$sl = strlen($s);
		$i = 0;
		while ($i < $sl) {
			$a[$i] = ord(substr($s, $i, 1));
			$i++;
		}
		while (count($a) % $key->chunkSize != 0) {
			$a[$i++] = 0;
		}

		$al = count($a);
		$result = "";
		$j;
		$k;
		$block;
		for ($i = 0; $i < $al; $i += $key->chunkSize){
			$block = "0";
			$faktor = "1";
			$j = 0;
			for ($k = $i; $k < $i + $key->chunkSize; ++$j){
				$block = bcadd($block, bcmul($a[$k++], $faktor));
				$faktor = bcmul($faktor, 256);
				$block = bcadd($block, bcmul($a[$k++], $faktor));
				$faktor = bcmul($faktor, 256);
			}
		echo "<br>++++++++++++++++$block+++++++++<br>";
			$text = bcpowmod($block, $key->e, $key->m);
			//$text = biToString($crypt, $key->radix);
			$result .= ($text . " ");
		}
		return substr($result,0, strlen($result) - 1); // Remove last space.
	}

	function biDecryptedString($key, $s){
		$blocks = split(" ", $s);
		print_r($blocks);
		//exit();
		$result = "";
		$i;
		$j;
		$block;
		for ($i = 0; $i < count($blocks); $i++){
			$block = bcpowmod($blocks[$i], $key->d, $key->m);
		echo "<br>------------$block----------<br>";

			for ($j = 0; $block !== "0"; $j++){
				$curchar = bcmod($block, 256);
				$result .= chr($curchar);
				$block = bcdiv($block, 256, 0);
			}
		}
		//Remove trailing null, if any.
		if (ord(substr($result, strlen($result) - 1, 1)) == 0){
			$result = substr($result, 0, strlen($result) - 1);
		}
		return $result;
	}
	
}
