var keygenInfo, keyGen = new productKeyGen();
try {
	module.exports = {
		getKey: function (s) {
			return keyGen.getKey(s);
		}
	};
	keygenInfo = require('config').get('keygenConfig');
} catch(e){}

// User key generator generates a key based on email address.
function productKeyGen() {

    this.getKey = getKey;
    this.getMd5 = getMd5;

    var md5js = new md5Js();
    var md5Js2 = new md5Js2();

    function getMd5(email){
        return md5Js2.md5(email);
    }
	function getKey(email){
        return getLvl10Key(email);
    }

    function getLvl10Key(email){
        return getLvl5Key(getLvl5Key(email));
    }

    function getLvl5Key(email){
        return genKey(genKey(genKey(genKey(genKey(email)))));
    }

    function getLvl2Key(email){
        return genKey(genKey(email));
    }

    function genKey(email){
        return dashes(odds(reverse(md5js.md5(secret(email)))));
    }
    function secret(email){
        return email + keygenInfo.cipher;
    }
    function reverse(s){
        return s.split("").reverse().join("");
    }
    function odds(s){
        var partsLeft = "";
        for(var i=0; i<=s.length; i++) { if( i % 2 != 0 ) partsLeft = partsLeft + "" + s[i]; }
        return partsLeft;
    }
    function dashes(s){
        return insertNthChar(s,'-',4);
    }
    function insertNthChar(string,chr,nth) {
        var output = '';
        for (var i=0; i<string.length; i++) { if (i>0 && i%4 == 0) {output += chr;} output += string.charAt(i); }
        return output;
    }

    function md5Js() {

		this.md5 = md5;

		function md5cycle(x, k) {
		var a = x[0], b = x[1], c = x[2], d = x[3];

		a = ff(a, b, c, d, k[0], 7, -680876936);
		d = ff(d, a, b, c, k[1], 12, -389564586);
		c = ff(c, d, a, b, k[2], 17,  606105819);
		b = ff(b, c, d, a, k[3], 22, -1044525330);
		a = ff(a, b, c, d, k[4], 7, -176418897);
		d = ff(d, a, b, c, k[5], 12,  1200080426);
		c = ff(c, d, a, b, k[6], 17, -1473231341);
		b = ff(b, c, d, a, k[7], 22, -45705983);
		a = ff(a, b, c, d, k[8], 7,  1770035416);
		d = ff(d, a, b, c, k[9], 12, -1958414417);
		c = ff(c, d, a, b, k[10], 17, -42063);
		b = ff(b, c, d, a, k[11], 22, -1990404162);
		a = ff(a, b, c, d, k[12], 7,  1804603682);
		d = ff(d, a, b, c, k[13], 12, -40341101);
		c = ff(c, d, a, b, k[14], 17, -1502002290);
		b = ff(b, c, d, a, k[15], 22,  1236535329);

		a = gg(a, b, c, d, k[1], 5, -165796510);
		d = gg(d, a, b, c, k[6], 9, -1069501632);
		c = gg(c, d, a, b, k[11], 14,  643717713);
		b = gg(b, c, d, a, k[0], 20, -373897302);
		a = gg(a, b, c, d, k[5], 5, -701558691);
		d = gg(d, a, b, c, k[10], 9,  38016083);
		c = gg(c, d, a, b, k[15], 14, -660478335);
		b = gg(b, c, d, a, k[4], 20, -405537848);
		a = gg(a, b, c, d, k[9], 5,  568446438);
		d = gg(d, a, b, c, k[14], 9, -1019803690);
		c = gg(c, d, a, b, k[3], 14, -187363961);
		b = gg(b, c, d, a, k[8], 20,  1163531501);
		a = gg(a, b, c, d, k[13], 5, -1444681467);
		d = gg(d, a, b, c, k[2], 9, -51403784);
		c = gg(c, d, a, b, k[7], 14,  1735328473);
		b = gg(b, c, d, a, k[12], 20, -1926607734);

		a = hh(a, b, c, d, k[5], 4, -378558);
		d = hh(d, a, b, c, k[8], 11, -2022574463);
		c = hh(c, d, a, b, k[11], 16,  1839030562);
		b = hh(b, c, d, a, k[14], 23, -35309556);
		a = hh(a, b, c, d, k[1], 4, -1530992060);
		d = hh(d, a, b, c, k[4], 11,  1272893353);
		c = hh(c, d, a, b, k[7], 16, -155497632);
		b = hh(b, c, d, a, k[10], 23, -1094730640);
		a = hh(a, b, c, d, k[13], 4,  681279174);
		d = hh(d, a, b, c, k[0], 11, -358537222);
		c = hh(c, d, a, b, k[3], 16, -722521979);
		b = hh(b, c, d, a, k[6], 23,  76029189);
		a = hh(a, b, c, d, k[9], 4, -640364487);
		d = hh(d, a, b, c, k[12], 11, -421815835);
		c = hh(c, d, a, b, k[15], 16,  530742520);
		b = hh(b, c, d, a, k[2], 23, -995338651);

		a = ii(a, b, c, d, k[0], 6, -198630844);
		d = ii(d, a, b, c, k[7], 10,  1126891415);
		c = ii(c, d, a, b, k[14], 15, -1416354905);
		b = ii(b, c, d, a, k[5], 21, -57434055);
		a = ii(a, b, c, d, k[12], 6,  1700485571);
		d = ii(d, a, b, c, k[3], 10, -1894986606);
		c = ii(c, d, a, b, k[10], 15, -1051523);
		b = ii(b, c, d, a, k[1], 21, -2054922799);
		a = ii(a, b, c, d, k[8], 6,  1873313359);
		d = ii(d, a, b, c, k[15], 10, -30611744);
		c = ii(c, d, a, b, k[6], 15, -1560198380);
		b = ii(b, c, d, a, k[13], 21,  1309151649);
		a = ii(a, b, c, d, k[4], 6, -145523070);
		d = ii(d, a, b, c, k[11], 10, -1120210379);
		c = ii(c, d, a, b, k[2], 15,  718787259);
		b = ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = add32(a, x[0]);
		x[1] = add32(b, x[1]);
		x[2] = add32(c, x[2]);
		x[3] = add32(d, x[3]);

		}

		function cmn(q, a, b, x, s, t) {
		a = add32(add32(a, q), add32(x, t));
		return add32((a << s) | (a >>> (32 - s)), b);
		}

		function ff(a, b, c, d, x, s, t) {
		return cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}

		function gg(a, b, c, d, x, s, t) {
		return cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}

		function hh(a, b, c, d, x, s, t) {
		return cmn(b ^ c ^ d, a, b, x, s, t);
		}

		function ii(a, b, c, d, x, s, t) {
		return cmn(c ^ (b | (~d)), a, b, x, s, t);
		}

		function md51(s) {
		txt = '';
		var n = s.length,
		state = [1732584193, -271733879, -1732584194, 271733878], i;
		for (i=64; i<=s.length; i+=64) {
		md5cycle(state, md5blk(s.substring(i-64, i)));
		}
		s = s.substring(i-64);
		var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
		for (i=0; i<s.length; i++)
		tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
		tail[i>>2] |= 0x80 << ((i%4) << 3);
		if (i > 55) {
		md5cycle(state, tail);
		for (i=0; i<16; i++) tail[i] = 0;
		}
		tail[14] = n*8;
		md5cycle(state, tail);
		return state;
		}

		/* there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 */
		function md5blk(s) { /* I figured global was faster.   */
		var md5blks = [], i; /* Andy King said do it this way. */
		for (i=0; i<64; i+=4) {
		md5blks[i>>2] = s.charCodeAt(i)
		+ (s.charCodeAt(i+1) << 8)
		+ (s.charCodeAt(i+2) << 16)
		+ (s.charCodeAt(i+3) << 24);
		}
		return md5blks;
		}

		var hex_chr = '0123456789abcdef'.split('');

		function rhex(n)
		{
		var s='', j=0;
		for(; j<4; j++)
		s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
		+ hex_chr[(n >> (j * 8)) & 0x0F];
		return s;
		}

		function hex(x) {
		for (var i=0; i<x.length; i++)
		x[i] = rhex(x[i]);
		return x.join('');
		}

		function md5(s) {
		return hex(md51(s));
		}

		/* this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  */

		function add32(a, b) {
		return (a + b) & 0xFFFFFFFF;
		}

		if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
		function add32(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
		msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
		}
		}
	}


	function md5Js2() {

		this.md5 = md5;

		function md5 (str) {
		  // From: http://phpjs.org/functions
		  // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
		  // + namespaced by: Michael White (http://getsprink.com)
		  // +    tweaked by: Jack
		  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		  // +      input by: Brett Zamir (http://brett-zamir.me)
		  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		  // -    depends on: utf8_encode
		  // *     example 1: md5('Kevin van Zonneveld');
		  // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
		  var xl;

		  var rotateLeft = function (lValue, iShiftBits) {
		    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
		  };

		  var addUnsigned = function (lX, lY) {
		    var lX4, lY4, lX8, lY8, lResult;
		    lX8 = (lX & 0x80000000);
		    lY8 = (lY & 0x80000000);
		    lX4 = (lX & 0x40000000);
		    lY4 = (lY & 0x40000000);
		    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
		    if (lX4 & lY4) {
		      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		    }
		    if (lX4 | lY4) {
		      if (lResult & 0x40000000) {
		        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
		      } else {
		        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
		      }
		    } else {
		      return (lResult ^ lX8 ^ lY8);
		    }
		  };

		  var _F = function (x, y, z) {
		    return (x & y) | ((~x) & z);
		  };
		  var _G = function (x, y, z) {
		    return (x & z) | (y & (~z));
		  };
		  var _H = function (x, y, z) {
		    return (x ^ y ^ z);
		  };
		  var _I = function (x, y, z) {
		    return (y ^ (x | (~z)));
		  };

		  var _FF = function (a, b, c, d, x, s, ac) {
		    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
		    return addUnsigned(rotateLeft(a, s), b);
		  };

		  var _GG = function (a, b, c, d, x, s, ac) {
		    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
		    return addUnsigned(rotateLeft(a, s), b);
		  };

		  var _HH = function (a, b, c, d, x, s, ac) {
		    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
		    return addUnsigned(rotateLeft(a, s), b);
		  };

		  var _II = function (a, b, c, d, x, s, ac) {
		    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
		    return addUnsigned(rotateLeft(a, s), b);
		  };

		  var convertToWordArray = function (str) {
		    var lWordCount;
		    var lMessageLength = str.length;
		    var lNumberOfWords_temp1 = lMessageLength + 8;
		    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
		    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
		    var lWordArray = new Array(lNumberOfWords - 1);
		    var lBytePosition = 0;
		    var lByteCount = 0;
		    while (lByteCount < lMessageLength) {
		      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
		      lBytePosition = (lByteCount % 4) * 8;
		      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
		      lByteCount++;
		    }
		    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
		    lBytePosition = (lByteCount % 4) * 8;
		    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
		    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
		    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
		    return lWordArray;
		  };

		  var wordToHex = function (lValue) {
		    var wordToHexValue = "",
		      wordToHexValue_temp = "",
		      lByte, lCount;
		    for (lCount = 0; lCount <= 3; lCount++) {
		      lByte = (lValue >>> (lCount * 8)) & 255;
		      wordToHexValue_temp = "0" + lByte.toString(16);
		      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
		    }
		    return wordToHexValue;
		  };

		  var x = [],
		    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
		    S12 = 12,
		    S13 = 17,
		    S14 = 22,
		    S21 = 5,
		    S22 = 9,
		    S23 = 14,
		    S24 = 20,
		    S31 = 4,
		    S32 = 11,
		    S33 = 16,
		    S34 = 23,
		    S41 = 6,
		    S42 = 10,
		    S43 = 15,
		    S44 = 21;

		  str = utf8_encode(str);
		  x = convertToWordArray(str);
		  a = 0x67452301;
		  b = 0xEFCDAB89;
		  c = 0x98BADCFE;
		  d = 0x10325476;

		  xl = x.length;
		  for (k = 0; k < xl; k += 16) {
		    AA = a;
		    BB = b;
		    CC = c;
		    DD = d;
		    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
		    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
		    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
		    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
		    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
		    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
		    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
		    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
		    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
		    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
		    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
		    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
		    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
		    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
		    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
		    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
		    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
		    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
		    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
		    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
		    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
		    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
		    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
		    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
		    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
		    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
		    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
		    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
		    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
		    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
		    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
		    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
		    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
		    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
		    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
		    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
		    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
		    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
		    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
		    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
		    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
		    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
		    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
		    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
		    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
		    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
		    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
		    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
		    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
		    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
		    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
		    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
		    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
		    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
		    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
		    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
		    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
		    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
		    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
		    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
		    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
		    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
		    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
		    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
		    a = addUnsigned(a, AA);
		    b = addUnsigned(b, BB);
		    c = addUnsigned(c, CC);
		    d = addUnsigned(d, DD);
		  }

		  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

		  return temp.toLowerCase();
		}

		function utf8_encode ( string ) {
 
		    string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		 
		    var utftext = "";
		    var start, end;
		    var stringl = 0;
		 
		    start = end = 0;
		    stringl = string.length;
		    for (var n = 0; n < stringl; n++) {
		        var c1 = string.charCodeAt(n);
		        var enc = null;
		 
		        if (c1 < 128) {
		            end++;
		        } else if((c1 > 127) && (c1 < 2048)) {
		            enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
		        } else {
		            enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
		        }
		        if (enc != null) {
		            if (end > start) {
		                utftext += string.substring(start, end);
		            }
		            utftext += enc;
		            start = end = n+1;
		        }
		    }
		 
		    if (end > start) {
		        utftext += string.substring(start, string.length);
		    }
		 
		    return utftext;
		}
	}
}