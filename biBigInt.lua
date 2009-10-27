local biRadixBase = 2;
local biRadixBits = 16;
    biRadixBits = biRadixBits - biRadixBits % 4;
local bitsPerDigit = biRadixBits;
local biRadix = 2 ^ biRadixBits; --// = 2^16 = 65536
local biHalfRadix = biRadix / 2;
local biRadixSquared = biRadix * biRadix;
local maxDigitVal = biRadix - 1;
local maxInteger = 4294967295;
local biHexPerDigit = biRadixBits / 4;


function biBigInt(n)
	local result={["isNeg"]=false, ["digits"]={[0]=10}};
	return result;
end


function biFromHex(s)
	local result = biBigInt();
	if s:sub(1,1) == '-' then
		result.isNeg = true;
		s = sub(s, 2);
	else
		result.isNeg = false;
	end
	local sl = s:len();
	local j = 0;
	for i = sl, 1, -biHexPerDigit do
	print(i .. j .. "\n")
		result.digits[j]=hexToDigit(s:sub(math.max(i-biHexPerDigit+1,1),i));
		j = j + 1;
	end
	return result;
end

function hexToDigit(s)
print("***"..s.."\n")
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
print(c .. "\n")
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
		result="-";
	else
		result="";
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

local hexToChar = {[0]='0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                          'a', 'b', 'c', 'd', 'e', 'f'};

function digitToHex(n)
	local result = "";
	local i;
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
	local i;
	for  i = 0, biHexPerDigit - 1, 1 do
		if n > 0 then
			result = hexToChar[n % 16] .. result;
			n = math.floor(n / 16);
		end
	end
	return result;
end

function reverseStr(s)
	local result = "";
	local i;
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
	local i;
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


function biDump(bi)
	local nb = table.maxn(bi.digits);
	print(nb);
	for i = 0, nb, 1 do
		print(bi.digits[i] .. "..");
	end
end

qqq = biFromHex("aadd1ff234bb5ccc67aa89d6546d465d6546465464f64f65465b46b4654c654c6546a46a546565d46d89d79987f97f");
print(biToHex(qqq));
