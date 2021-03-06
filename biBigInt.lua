require("list");
require("string_ext");

local biRadixBase = 2;
local biRadixBits = 16;
    --biRadixBits = biRadixBits - biRadixBits % 4;
local bitsPerDigit = biRadixBits;
biRadix = 2 ^ biRadixBits; --// = 2^16 = 65536
local biHalfRadix = biRadix / 2;
local biRadixSquared = biRadix * biRadix;
local maxDigitVal = biRadix - 1;
local maxInteger = 4294967295;
local biHexPerDigit = biRadixBits / 4;


function biBigInt(n)
  if not n then
    n = 0;
  end
  local result = {["isNeg"] = false, ["digits"] = {}};
  if type(n) == "number" then
    for i = 0, n, 1 do
      result.digits[i] = 0;
    end
  end
  return result;
end

function biBlankZero(bi)
  table.isNeg = false;
  bi.digits = {[0]=0};
end

function biBlankOne(bi)
  table.isNeg = false;
  bi.digits = {[0]=1};
end


function biEqual(bi0, bi1)
  if bi0.isNeg ~= bi1.isNeg then
    return false;
  end
  local n0 = biHighIndex(bi0);
  local n1 = biHighIndex(bi1);
  if n0 ~= n1 then
    return false;
  end
  for i = 0, n0, 1 do
    if bi0.digits[i] ~= bi1.digits[i] then
      return false;
    end
  end
  return true;
end

function biIsOne(bi)
  local nb = biHighIndex(bi);
  return nb == 0 and not bi.isNeg and bi.digits[0] == 1;
end

function biIsZero(bi)
  local nb = biHighIndex(bi);
  return nb == 0 and bi.digits[0] == 0;
end

function biCopy(bi)
  local result = biBigInt();
  result.isNeg = bi.isNeg;
  local nb = biHighIndex(bi);
  for i = 0, nb, 1 do
    result.digits[i] = bi.digits[i]
  end
  return result;
end

function biAbs(bi)
  local result = biBigInt();
  result.isNeg = false;
  local nb = biHighIndex(bi);
  for i = 0, nb, 1 do
    result.digits[i] = bi.digits[i]
  end
  return result;
end

function biMinus(bi)
  local result = biBigInt();
  result.isNeg = not bi.isNeg;
  local nb = biHighIndex(bi);
  for i = 0, nb, 1 do
    result.digits[i] = bi.digits[i]
  end
  return result;
end

function biFromNumber(i)
  local result = biBigInt();
  if i < 0 then
    result.isNeg = true;
    i = -i;
  end
  local j = 0;
  while i > 0 do
    local c = math.floor(i / biRadix);
    result.digits[j] = i - c * biRadix;
    i = c;
    j = j + 1;
  end
  return result;
end

function biFromHex(s)
  local result = biBigInt();
  if s:sub(1,1) == '-' then
    result.isNeg = true;
    s = s:sub(2);
  else
    result.isNeg = false;
  end
  local sl = s:len();
  local j = 0;
  for i = sl, 1, -biHexPerDigit do
    result.digits[j] = hexToDigit(s:sub(math.max(i - biHexPerDigit + 1, 1), i));
    j = j + 1;
  end
  return biNormalize(result);
end

function biFromBit(s)
  local result = biBigInt();
  if s:sub(1,1) == '-' then
    result.isNeg = true;
    s = s:sub(2);
  else
    result.isNeg = false;
  end
  local sl = s:len();
  local j = 0;
  for i = sl, 1, -1 do
    result.digits[j] = 0 + s:sub(i, i);
    j = j + 1;
  end
  biDump(result);
  return biNormalize(result);
end

local hexToBit = { ['0']='0000',
['1']='0001', ['2']='0010', ['3']='0011', ['4']='0100', ['5']='0101', ['6']='0110', ['7']='0111', ['8']='1000', ['9']='1001',
['a']='1010', ['b']='1011', ['c']='1100', ['d']='1101', ['e']='1110', ['f']='1111'};


function biHexToBit(s)
  local result = "";
  if s:sub(1,1) == '-' then
    result = "-";
    s = s:sub(2);
  end
  local sl = s:len();
  for i = 1, sl, 1 do
    result = result .. hexToBit[s:sub(i, i)];
  end
  return result;
end

function hexToDigit(s)
  local result = 0;
  local sl = math.min(s:len(), biHexPerDigit);
  for i = 1, sl, 1 do
    result = result * 16 + charToHex(s:byte(i, i));
  end
  return result;
end

local hexatrigesimalToChar = {
[0]='0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
 'u', 'v', 'w', 'x', 'y', 'z'
};

function charToHex(c)
  local ZERO = 48;
  local NINE = ZERO + 9;
  local littleA = 97;
  local littleZ = littleA + 25;
  local bigA = 65;
  local bigZ = 65 + 25;
  local result;
  if c >= ZERO and c <= NINE then
    result = c - ZERO;
  elseif c >= bigA and c <= bigZ then
    result = 10 + c - bigA;
  elseif c >= littleA and c <= littleZ then
    result = 10 + c - littleA;
  else
    result = 0;
  end
  return result;
end

function biToHex(x)
  local result;
  if x.isNeg then
    result = "-";
  else
    result = "";
  end
  local i = biHighIndex(x);
  result = result .. digitToHexTrunk(x.digits[i]);
  i = i - 1;
  while i > -1 do
    result = result .. digitToHex(x.digits[i]);
    i = i - 1;
  end
  return result;
end

local hexToChar = {[0]='0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

function digitToHex(n)
  local result = "";
  for i = 0, biHexPerDigit - 1, 1 do
    result = hexToChar[n % 16] .. result;
    n = math.floor(n / 16);
  end
  return result;
end

function digitToHexTrunk(n)
  if (n == 0) then
    return "0";
  end
  local result = "";
  for  i = 0, biHexPerDigit - 1, 1 do
    if n > 0 then
      result = hexToChar[n % 16] .. result;
      n = math.floor(n / 16);
    end
  end
  return result;
end

local numToChar = {[0]='0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
 'u', 'v', 'w', 'x', 'y', 'z'
};

function biToString(x, radix)
-- require 2 <= radix <= 36
--	if radix == 16 then
--		return biToHex(x);
--  end
	local b = biFromNumber(radix);
	local qr = biDivideModulo(biAbs(x), b);
	local result = numToChar[qr[1].digits[0]];
	while not biIsZero(qr[0]) do
		qr = biDivideModulo(qr[0], b);
		result = numToChar[qr[1].digits[0]] .. result;
	end
	return biIIF(x.isNeg, "-", "") .. result;
end

function biFromString(s, radix)
--	if radix == 16 then
--		return biFromHex(s);
--  end
	local isNeg = s:sub(1) == '-';
	local first = biIIF(isNeg, 2, 1);
	local result = biBigInt();
	local place = biFromNumber(1);
	for i = s:len(), first, -1 do
		local c = s:byte(i);
		local digit = charToHex(c);
		local biDigit = biMultiplyDigit(place, digit);
		result = biAdd(result, biDigit);
		place = biMultiplyDigit(place, radix);
	end
	result.isNeg = isNeg;
	return biNormalize(result);
end

function reverseStr(s)
  local result = "";
  for i = s:len(), 1, -1 do
    result = result .. s:sub(i,i);
  end
  return result;
end

function biNormalize(x)
  local k = table.maxn(x.digits);
  if x.digits[k] ~= 0 then
    return x;
  end
  for i = k, 0, -1 do
    if x.digits[i] == 0 then
      table.remove(x.digits,i);
    else
      return x;
    end
  end
  if table.maxn(x.digits) == 0 and x.digits[0] == 0 then
    x.isNeg = false;
  end
  return x;
end

function biHighIndex(x)
  biNormalize(x);
  return table.maxn(x.digits);
end

function biDump(bi, s)
  local nb = table.maxn(bi.digits);
  s = s or "";
  local term = "";
  if biRadixBits > 1 then
    term = "..";
  end
  for i = nb, 0, -1 do
    s = s .. term .."[".. i .."]=" .. bi.digits[i];
  end
  return s;
end

function biMultiply(x, y)
  local c, u, uv, k, i, j;
  local n = biHighIndex(x) + 1;
  local t = biHighIndex(y) + 1;
  if (n == 1 and x.digits[0] == 0) or (t == 1 and y.digits[0] == 0) then
    return biBigInt();
  end
  local result = biBigInt(n + t);
  local resultdigits = result.digits;
  local xdigits = x.digits;
  local ydigits = y.digits;
  local i;
  for i = 0, t - 1, 1 do
    c = 0;
    k = i;
    for j = 0, n - 1, 1 do
      uv = resultdigits[k] + xdigits[j] * ydigits[i] + c;
      resultdigits[k] = uv % biRadix;
      c = math.floor(uv / biRadix);
      k = k + 1;
    end
    resultdigits[i + n] = c;
  end
  result.isNeg = (x.isNeg ~= y.isNeg);
  return biNormalize(result);
end

function biIIF(l, x, y)
  if l then
    return x;
  else
    return y;
  end
end

function biIF(x, y)
  if x then
    return x;
  else
    return y;
  end
end

function biCompareAbs(x, y)
  local nx = biHighIndex(x);
  local ny = biHighIndex(y);
  if nx ~= ny then
    return biIIF(nx > ny, 1, -1);
  end
  for i = table.maxn(x.digits), 0, -1 do
    if x.digits[i] ~= y.digits[i] then
      return biIIF(x.digits[i] > y.digits[i], 1, -1);
    end
  end
  return 0;
end

function biCompare(x, y)
  if x.isNeg ~= y.isNeg then
    return biIIF(x.isNeg, -1, 1);
  end;
  return biIIF(x.isNeg, biCompareAbs(y, x), biCompareAbs(x, y));
end

function biAddNatural(x, y)
  local nx, ny, i, c, result, source, k;
  nx = biHighIndex(x) + 1;
  ny = biHighIndex(y) + 1;
  i = 0;
  c = 0;
  if nx > ny then
    result = biAbs(x);
    source = y;
    k = ny;
  else
    result = biAbs(y);
    source = x;
    k = nx;
  end
  while i < k do
    result.digits[i] = result.digits[i] + source.digits[i] + c;
    if result.digits[i] < biRadix then
      c = 0;
    else
      result.digits[i] = result.digits[i] % biRadix;
      c = 1;
    end
    i = i +1;
  end
  while c > 0 do
    result.digits[i] = biIF(result.digits[i], 0) + c;
    if result.digits[i] < biRadix then
      c = 0;
    else
      result.digits[i] = result.digits[i] % biRadix;
      c = 1;
    end
    i = i + 1;
  end
  return result;
end

function biSubtractNatural(x, y)
-- require x >= y
  local nx, ny, result, resultdigits, xdigits, ydigits, c;
  local lasti = 0;
  nx = biHighIndex(x) + 1;
  ny = biHighIndex(y) + 1;
  result = biAbs(x);
  resultdigits = result.digits;
  xdigits = x.digits;
  ydigits = y.digits;
  c = 0;
  for i = 0, ny - 1, 1 do
    lasti = i + 1;
    if xdigits[i] >= ydigits[i] - c then
      resultdigits[i] = xdigits[i] - ydigits[i] + c;
      c = 0;
    else
      resultdigits[i] = biRadix + xdigits[i] - ydigits[i] + c;
      c = -1;
    end
  end
  while c < 0 and lasti < nx do
    if xdigits[lasti] >=  - c then
      resultdigits[lasti] = xdigits[lasti] + c;
      c = 0;
    else
      resultdigits[lasti] = biRadix + xdigits[lasti] + c;
      c = -1;
    end
    lasti = lasti + 1;
  end
  return biNormalize(result);
end

function biAdd(x, y)
  local result;
  if not x.isNeg and not y.isNeg then
    return biAddNatural(x, y);
  end
  if x.isNeg and y.isNeg then
    result = biAddNatural(x, y);
    result.isNeg = true;
    return result;
  end
  local x_y = biCompareAbs(x , y);
  if x_y == 0 then
    return biFromNumber(0);
  end
  if x_y > 0 then
    result = biSubtractNatural(x, y);
    result.isNeg = x.isNeg;
  end
  if x_y < 0 then
    result = biSubtractNatural(y, x);
    result.isNeg = y.isNeg;
  end
  return result;
end

function biSubtract(x, y)
  local result;
  if not x.isNeg and y.isNeg then
    return biAddNatural(x, y);
  end
  if x.isNeg and not y.isNeg then
    result = biAddNatural(x, y);
    result.isNeg = true;
    return result;
  end
  local x_y = biCompareAbs(x , y);
  if x_y == 0 then
    return biCopy(biFromNumber(0));
  elseif x_y >= 0 then
    result = biSubtractNatural(x, y);
    result.isNeg = x.isNeg;
  elseif x_y < 0 then
    result = biSubtractNatural(y, x);
    result.isNeg = not x.isNeg;
  end
  return result;
end

function biMultiplyDigit(x, y)
  local n = biHighIndex(x) + 1;
  local result = biBigInt(n);
  local c = 0;
  for j = 0, n - 1, 1 do
    local uv = result.digits[j] + x.digits[j] * y + c;
    result.digits[j] = uv % biRadix;
    c = math.floor(uv / biRadix);
  end
  result.digits[n] = c;
  return result;
end

function biDivideModuloNatural(x, y)
  local j0, j1, jm, qm, flag, nr;
  local nx = biHighIndex(x);
  local ny = biHighIndex(y);
  local q = biBigInt(-1);
    --q.digits = [];
  local r = biBigInt();
    --r.digits = [0]
  for i = nx, 0, -1 do
    table.insert(r.digits, 0, x.digits[i]);
    flag = biCompareAbs(y, r);
    if flag > 0 then
      table.insert(q.digits, 0, 0);
      --continue;
    elseif flag == 0 then
      table.insert(q.digits, 0, 1);
      biBlankZero(r);
    else
      nr = biHighIndex(r);
      if nr == ny then
        jm = math.floor((r.digits[nr] * biRadix + biIF(r.digits[nr - 1], 0))
          / (y.digits[ny] * biRadix + biIF(y.digits[ny - 1], 0) + 1));
      else
        jm = math.floor((r.digits[nr] * biRadixSquared + biIF(r.digits[nr - 1], 0) * biRadix + biIF(r.digits[nr - 2], 0))
          /	(y.digits[ny] * biRadix + biIF(y.digits[ny - 1], 0) + 1));
      end
      jm = math.max(0, math.min(jm, maxDigitVal))
      qm = biMultiplyDigit(y, jm);
      r = biSubtract(r, qm);
      if (r.isNeg) then
        while r.isNeg do
          r = biAdd(r, y);
          jm = jm - 1;
        end
      else
        while biCompare(r, y) >= 0 do
          r = biSubtract(r, y);
          jm = jm +1;
        end
        table.insert(q.digits, 0, jm);
      end
    end
  end
  return {[0]=biNormalize(q), biNormalize(r)};
end

function biDivideModulo(x, y)
  local q, r;
  if biCompareAbs(x, y) < 0 then
    if (x.isNeg and y.isNeg) or (not x.isNeg and not y.isNeg) then
      q = biFromNumber(0);
      r= biCopy(x);
    else
      q = biFromNumber(-1);
      r = biAdd(y, x);
    end
    return {[0]=q, r};
  end
  local origXIsNeg = x.isNeg;
  local origYIsNeg = y.isNeg;
  local result = biDivideModuloNatural(biAbs(x), biAbs(y));
  q = result[0];
  r = result[1];
  if not origXIsNeg and not origYIsNeg then
    return {[0]=q, r};
  elseif origXIsNeg and origYIsNeg then
    r.isNeg = true;
    return {[0]=q, r};
  else
    q.isNeg = true;
    q = biSubtract(q, bigOne);
    r.isNeg = origXIsNeg;
    r = biAdd(r, y);
  end
  if r.digits[0] == 0 and biHighIndex(r) == 0 then
    r.isNeg = false;
  end
  return {[0]=q, r};
end

function biDivide(x, y)
  return biDivideModulo(x, y)[0];
end

function biModulo(x, y)
  return biDivideModulo(x, y)[1];
end

function biMultiplyMod(x, y, m)
  return biModulo(biMultiply(x, y), m);
end

function biMultiplyModByRadixPower(x, y, p)
  local c, u, uv, k, i, j;
  local n = biHighIndex(x) + 1;
  local t = biHighIndex(y) + 1;
  if (n == 1 and x.digits[0] == 0) or (t == 1 and y.digits[0] == 0) then
    return biBigInt();
  end
  local result = biBigInt(n + t);
  local resultdigits = result.digits;
  local xdigits = x.digits;
  local ydigits = y.digits;
  local i;
  for i = 0, math.min(t, p) - 1, 1 do
    c = 0;
    k = i;
    for j = 0, math.min(n, p) - 1, 1 do
      if k >= p then
        break;
      end
      uv = resultdigits[k] + xdigits[j] * ydigits[i] + c;
      resultdigits[k] = uv % biRadix;
      c = math.floor(uv / biRadix);
      k = k + 1;
    end
    resultdigits[i + n] = c;
  end
  result = biModuloByRadixPower(result, n);
  result.isNeg = (x.isNeg ~= y.isNeg);
  return biNormalize(result);
end

function biModuloByRadixPower(bi, n)
  local result = biBigInt();
  local nb = biHighIndex(bi);
  local i;
  for i = 0, math.min(n, nb) - 1, 1 do
    result.digits[i] = bi.digits[i];
  end
  result.isNeg = bi.isNeg;
  return biNormalize(result);
end

function biMultiplyByRadixPower(bi, n)
  local result = biCopy(bi);
  for i = 1, n, 1 do
    table.insert(result.digits, 0, 0);
  end
  return result;
end

function biDivideByRadixPower(bi, n)
  local result = biCopy(bi);
  if n < 1 then
    return result;
  end
  local nb = biHighIndex(result)
  if nb < n then
    return biFromNumber(0);
  end
  for i = 1, n, 1 do
    result.digits[0] = table.remove(result.digits, 1);
  end
  return result;
end

--[[function biShiftRight(x, n)
	local digitCount = math.floor(n / bitsPerDigit);
	local result = new BigInt();
	arrayCopy(x.digits, digitCount, result.digits, 0,
	          x.digits.length - digitCount);
	var bits = n % bitsPerDigit;
	var leftBits = bitsPerDigit - bits;
	for (var i = 0, i1 = i + 1; i < result.digits.length - 1; ++i, ++i1) {
		result.digits[i] = (result.digits[i] >>> bits) |
		                   ((result.digits[i1] & lowBitMasks[bits]) << leftBits);
	}
	result.digits[result.digits.length - 1] >>>= bits;
	result.isNeg = x.isNeg;
	return result;
end]]


function biModularInverse(e, m)
  e = biModulo(e, m);
  local result = biExtendedEuclid(m, e);
  if not biIsOne(result[2]) then
    return nil;
  end
  return biModulo(result[1], m);
end

function biExtendedEuclid(a, b)
  if biCompare(a, b) >= 0 then
    return biExtendedEuclidNatural(a, b);
  end
  local result = biExtendedEuclidNatural(b, a);
  return {[0]=result[1], result[0], result[2]};
end

function biExtendedEuclidNatural(a, b)
-- calculates a * x + b * y = gcd(a, b)
-- require a >= b
  local qr, q, r, x1, x2, y1, y2, x, y;
  if biIsZero(b) then
    return {[0]=biFromNumber(1), biFromNumber(0), a};
  end
  x1 = biFromNumber(0);
  x2 = biFromNumber(1);
  y1 = biFromNumber(1);
  y2 = biFromNumber(0);
  while not biIsZero(b) do
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
  end
  return {[0]=x2, y2, a};
end

function biMontgomeryPowMod(T, EXP, N)
	local result = biFromNumber(1);
	local m = biCopy(T);--biModulo(biMultiply(T, N.R), N);
  local bin = biToString(EXP, 2);
	for i = bin:len(), 1, -1 do
    if bin:sub(i, i) == "1" then
			result = biMultiply(result, m);
			result = biMontgomeryModulo(result, N)
		end
		m = biMultiply(m, m);
		m = biMontgomeryModulo(m, N);
	end
	return result;
end

function biMontgomeryModulo(T, N)
  return biModulo(T, N);
end

function biMontgomeryModulo0(T, N)
  local m = biModuloByRadixPower(T, N.nN);
	m = biMultiplyModByRadixPower(m, N.Ninv, N.nN)
  m = biMultiply(m, N);
  m = biAdd(T, m);
  m = biDivideByRadixPower(m, N.nN);
  while biCompare(m, N) >= 0 do
    m = biSubtract(m, N);
	end
  return m;
end

biRSAKeyPair = {};

function biRSAKeyPair:new(encryptionExponent, decryptionExponent, modulus)
  local this = {};
  setmetatable(this, self)
  self.__index = self
  this.e = biFromHex(encryptionExponent);
  this.d = biFromHex(decryptionExponent);
  this.m = biFromHex(modulus);
  this.chunkSize = 2 * biHighIndex(this.m);
  this.radix = 16;
	-- for Montgomery algorythm
	this.m.nN = biHighIndex(this.m) + 1;
	this.m.R = biMultiplyByRadixPower(biFromNumber(1), this.m.nN);
  this.m.EGCD = biExtendedEuclid(this.m.R, this.m);
	this.m.Ri = this.m.EGCD[0];
	this.m.Rinv = biModulo(this.m.EGCD[0], this.m);
	this.m.Ni = biMinus(this.m.EGCD[1]);
	this.m.Ninv = biModulo(biMinus(this.m.EGCD[1]), this.m.R);
	--this.m.Ni = biModulo(this.m.Ni, this.m.R);
	--this.m.Ni = biModuloByRadixPower(this.m.Ni, this.m.nN);
	this.e.bin = biToString(this.e, 2);
  print(this.e.bin)
  print(biToHex(this.e))
  print(biToHex(biFromString(this.e.bin,2)))
	this.d.bin = biToString(this.d, 2);
  return this;
end

function biRSAKeyPair:encryptedString(s)
  local sl = s:len();
  local result = "";
  local i, j, k, block;
  block = biBigInt();
  for i = 1, sl, self.chunkSize do
    biBlankZero(block);
    j = 0;
    k = i;
    while k < i + self.chunkSize and k < sl do
      block.digits[j] = s:byte(k);
      k = k + 1;
      block.digits[j] = block.digits[j] + s:byte(k) * 256;
      k = k + 1;
      j = j + 1;
    end
    print(biToString(block,10).."=block");
    print(biToString(self.e,10))
    print(biToString(self.m,10))
    local crypt = biMontgomeryPowMod(block, self.e, self.m);
    print(biToString(crypt,10).."=crypt");
    local decrypt=biMontgomeryPowMod(crypt, self.d, self.m)
    print(biDump(decrypt).."=decrypt")
    local text = biToHex(crypt);
    result = result .. text .. ",";
  end
  return result:sub(1, -2);
end

function biRSAKeyPair:decryptedString(s)
  local blocks = string.split(",", s);
  local result = "";
  local i, j, block;
  for i = 1, table.getn(blocks), 1 do
    local bi;
    bi = biFromHex(blocks[i]);
    print(biDump(bi),"=bi")
    block = biMontgomeryPowMod(bi, self.d, self.m);
    for j = 0, biHighIndex(block), 1 do
      result = result .. string.char(block.digits[j] % 256, math.floor(block.digits[j] / 256));
    end
  end
  --result = result.replace(/\xff/gm, String.fromCharCode(0));
  --result = result.substr(0, result.lastIndexOf(String.fromCharCode(254)));
  return result; --biUTF8Decode(result);
end

function biUTF8Encode(s)
  do return s; end
  --//string = string.replace(/\r\n/g,"\n");
  local utftext = "";
  local sl = s:len();
  for n = 1, sl, 1 do
    local c = s:byte(n);
    if c < 128 then
      utftext = utftext .. string.char(c);
    elseif c > 127 and c < 2048 then
        utftext = utftext .. string.char(math.floor(c / 64) + 192);
        utftext = utftext .. string.char(c % 64 + 128);
    else
      utftext = utftext .. string.char(math.floor(c / 4096) + 224);
      utftext = utftext .. string.char(math.floor(c / 64) % 64 + 128);
      utftext = utftext .. string.char(c % 64 + 128);
    end
  end
  return utftext;
end

function biUTF8Decode(s)
  do return s; end
  local utftext = "";
  local sl = s:len();
  local charCode;
  local n = 0;
  while n < sl do
  local c = s:byte(n);
    if c < 128 then
      utftext = utftext .. string.char(c);
      charCode = 0;
    elseif c > 191 and c < 224 then
      charCode = c % 32 * 64;
      n = n + 1;
      c = s:byte(n);
      charCode = charCode + c % 64;
      utftext = utftext .. string.char(charCode);
    else
      charCode = c % 16 * 64 * 64;
      n = n + 1;
      c = s.byte(n);
      charCode = charCode + c % 64 * 64;
      n = n + 1;
      c = s.byte(n);
      charCode = charCode + c % 64;
      utftext = utftext .. string.char(charCode);
    end
  end
  return utftext;
end

function biRandomPadding(n)
  local result = "";
  for i = 0, n - 1, 1 do
    result = result .. string.char(math.floor(math.random()*126) + 1);
  end
  return result;
end




local bigOne = biFromNumber(1);
local bigZero = biFromNumber(0);


--[[qqq = biFromHex("16546a46a5646dd989798797987798d7987987987997d97d987987987987987e87e987987987987979879f879f879f87987a98a7987a97a9864d6464f64f6464b64b65465464a64a6546d46d4dd998798b79b87987c6");
www = biFromHex("987979879797799797aa6a54654d465d464546454987987987a98798a79879d79d87987f987f987989f8798f79879879879c4c4654b64b654654f654f6466f6f6f546546a987a987979d");
eee = biMultiply(qqq,www)

print(biToHex(eee));]]
