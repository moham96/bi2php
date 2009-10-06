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
		global $biRadixBits;
	
		$this->e = biFromString($encryptionExponent, 16);
		$this->d = biFromString($decryptionExponent, 16);
		$this->m = biFromString($modulus, 16);
		// We can do two bytes per digit, so
		// chunkSize = 2 * (number of digits in modulus - 1).
		// Since biHighIndex returns the high index, not the number of digits, 1 has
		// already been subtracted.
		$this->chunkSize = /*2 **/ biHighIndex($this->m);
		$this->radix = $biRadixBits;//12;
		$this->barrett = new biBarrettMu($this->m);
	}

	function twoDigit($n){
		return ($n < 10 ? "0" : "") . $n;
	}
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
			$block = new BigInt();
			$j = 0;
			for ($k = $i; $k < $i + $key->chunkSize; ++$j){
				$block->digits[$j] = $a[$k++];
				//$block->digits[$j] += $a[$k++] << 8;
			}

			$crypt = $key->barrett->powMod($block, $key->e);
			$text = biToString($crypt, $key->radix);
			$result .= ($text . " ");
		}
		return substr($result,0, strlen($result) - 1); // Remove last space.
	}

	function biDecryptedString($key, $s){
		$blocks = split(" ", $s);
		$result = "";
		$i;
		$j;
		$block;
		for ($i = 0; $i < count($blocks); ++$i){
			$bi;
			if ($key->radix == 16) {
				$bi = biFromHex($blocks[$i]);
			}else{
				$bi = biFromString($blocks[$i], $key->radix);
			}
			$block = $key->barrett->powMod($bi, $key->d);
			
			for ($j = 0; $j <= biHighIndex($block); ++$j){
				$result .= chr($block->digits[$j] /*& 255) . chr($block->digits[$j] >> 8*/);
			}
		}
		//Remove trailing null, if any.

		if (ord(substr($result, strlen($result) - 1, 1)) == 0){
			$result = substr($result, 0, strlen($result) - 1);
		}
		return $result;
	}
