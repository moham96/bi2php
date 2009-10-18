/*
The MIT License

Copyright (c)2009 ����� ��������� (Andrey Ovcharenko)

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

function biRSAKeyPair(encryptionExponent, decryptionExponent, modulus){
	this.e = biFromHex(encryptionExponent, 10) || "0";
	this.d = biFromHex(decryptionExponent, 10) || "0";
	this.m = biFromHex(modulus, 10);
	this.chunkSize = 2 * biHighIndex(this.m);
	this.radix = 16;
	// for Montgomery algorytm
	this.m.nN = biHighIndex(this.m) + 1;
	this.m.R = biMultiplyByRadixPower(biFromNumber(1), this.m.nN);
	this.m.EGCD = biExtendedEuclid(this.m.R, this.m);
	this.m.Ri = biModulo(this.m.EGCD[0], this.m);
	this.m.Ni = biMinus(this.m.EGCD[1]);
	this.m.Ni = biModulo(this.m.Ni, this.m.R);
	this.e.bin = biToString(this.e, 2);
	this.d.bin = biToString(this.d, 2);
}

function biEncryptedString(key, s){
// Altered by Rob Saunders (rob@robsaunders.net). New routine pads the
// string after it has been converted to an array. This fixes an
// incompatibility with Flash MX's ActionScript.
	s = biUTF8Encode(s);
	s = s.replace(/[\x00]/gm, String.fromCharCode(255)); //not UTF-8 zero replace
	s = s + String.fromCharCode(254); //not UTF-8 terminal sybol
	var sl = s.length;
	s = s + biRandomPadding(key.chunkSize - sl % key.chunkSize);
	var sl = s.length;
	var result = "";
	var i, j, k, block;
	block = new BigInt();
	for (var i = 0; i < sl; i += key.chunkSize) {
		block.blankZero();
		j = 0;
		for (k = i; k < i + key.chunkSize && k < sl; ++j) {
			block.digits[j] = s.charCodeAt(k++);
			block.digits[j] += (s.charCodeAt(k++) || 0) << 8;
		}
		var crypt = biMontgomeryPowMod(block, key.e, key.m);
		var text = biToHex(crypt);
		result += text + ",";
	}
	return result.substring(0, result.length - 1); // Remove last space.
}

function biDecryptedString(key, s){
	var blocks = s.split(",");
	var result = "";
	var i, j, block;
	for (i = 0; i < blocks.length; ++i) {
		var bi;
		bi = biFromHex(blocks[i], 10);
		block = biMontgomeryPowMod(bi, key.d, key.m);
		for (j = 0; j <= biHighIndex(block); ++j) {
			result += String.fromCharCode(block.digits[j] & 255,
			                              block.digits[j] >> 8);
		}
	}
	result = result.replace(/\xff/gm, String.fromCharCode(0));
	result = result.substr(0, result.lastIndexOf(String.fromCharCode(254)));
	return biUTF8Decode(result);
}

function biUTF8Encode(string){
// Base on:
/* 
 * jCryption JavaScript data encryption v1.0.1
 * http://www.jcryption.org/
 *
 * Copyright (c) 2009 Daniel Griesser
 * Dual licensed under the MIT and GPL licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/gpl-2.0.php
 *
 * If you need any further information about this plugin please
 * visit my homepage or contact me under daniel.griesser@jcryption.org
 */
	//string = string.replace(/\r\n/g,"\n");
	var utftext = "";
	var sl = string.length;
	for (var n = 0; n < sl; n++){
		var c = string.charCodeAt(n);
 		if (c < 128){
			utftext += String.fromCharCode(c);
		}else if((c > 127) && (c < 2048)){
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
		}else{
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
 	}
 	return utftext;
}

function biUTF8Decode(s){
	var utftext = "";
	var sl = s.length;
	var charCode;
	for (var n = 0; n < sl; n++){
		var c = s.charCodeAt(n);
 		if (c < 128){
			utftext += String.fromCharCode(c);
			charCode = 0;
		}else if((c > 191) && (c < 224)){
			charCode = ((c & 0x1f) << 6);
			c = s.charCodeAt(++n);
			charCode += (c & 0x3f);
			utftext += String.fromCharCode(charCode);		
		}else{
			charCode = ((c & 0xf) << 12);
			c = s.charCodeAt(++n);
			charCode += ((c & 0x3f) << 6);
			c = s.charCodeAt(++n);
			charCode += (c & 0x3f);
			utftext += String.fromCharCode(charCode);		
		}
 	}
 	return utftext;
}

function biRandomPadding(n){
	var result = "";
	for (var i = 0; i < n; i++)
		result = result + String.fromCharCode(Math.floor(Math.random()*126) + 1);
	return result;
}