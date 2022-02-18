(function (global, factory) {
      typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
      (global.dataway = factory());
}(this, function () { 'use strict';
  if (!CryptoJS) {
    // ---------------------------
    // Crypto Code From `CryptoJS`
    // ---------------------------
    // # License

    // [The MIT License (MIT)](http://opensource.org/licenses/MIT)

    // Copyright (c) 2009-2013 Jeff Mott
    // Copyright (c) 2013-2016 Evan Vosberg

    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:

    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.

    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    // THE SOFTWARE.

    // CryptoJS - core
    /**
     * CryptoJS core components.
     */
    var CryptoJS = CryptoJS || (function (Math, undefined) {
        /*
         * Local polyfil of Object.create
         */
        var create = Object.create || (function () {
            function F() {}

            return function (obj) {
                var subtype;

                F.prototype = obj;

                subtype = new F();

                F.prototype = null;

                return subtype;
            };
        }())

        /**
         * CryptoJS namespace.
         */
        var C = {};

        /**
         * Library namespace.
         */
        var C_lib = C.lib = {};

        /**
         * Base object for prototypal inheritance.
         */
        var Base = C_lib.Base = (function () {


            return {
                /**
                 * Creates a new object that inherits from this object.
                 *
                 * @param {Object} overrides Properties to copy into the new object.
                 *
                 * @return {Object} The new object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var MyType = CryptoJS.lib.Base.extend({
                 *         field: 'value',
                 *
                 *         method: function () {
                 *         }
                 *     });
                 */
                extend: function (overrides) {
                    // Spawn
                    var subtype = create(this);

                    // Augment
                    if (overrides) {
                        subtype.mixIn(overrides);
                    }

                    // Create default initializer
                    if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
                        subtype.init = function () {
                            subtype.$super.init.apply(this, arguments);
                        };
                    }

                    // Initializer's prototype is the subtype object
                    subtype.init.prototype = subtype;

                    // Reference supertype
                    subtype.$super = this;

                    return subtype;
                },

                /**
                 * Extends this object and runs the init method.
                 * Arguments to create() will be passed to init().
                 *
                 * @return {Object} The new object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var instance = MyType.create();
                 */
                create: function () {
                    var instance = this.extend();
                    instance.init.apply(instance, arguments);

                    return instance;
                },

                /**
                 * Initializes a newly created object.
                 * Override this method to add some logic when your objects are created.
                 *
                 * @example
                 *
                 *     var MyType = CryptoJS.lib.Base.extend({
                 *         init: function () {
                 *             // ...
                 *         }
                 *     });
                 */
                init: function () {
                },

                /**
                 * Copies properties into this object.
                 *
                 * @param {Object} properties The properties to mix in.
                 *
                 * @example
                 *
                 *     MyType.mixIn({
                 *         field: 'value'
                 *     });
                 */
                mixIn: function (properties) {
                    for (var propertyName in properties) {
                        if (properties.hasOwnProperty(propertyName)) {
                            this[propertyName] = properties[propertyName];
                        }
                    }

                    // IE won't copy toString using the loop above
                    if (properties.hasOwnProperty('toString')) {
                        this.toString = properties.toString;
                    }
                },

                /**
                 * Creates a copy of this object.
                 *
                 * @return {Object} The clone.
                 *
                 * @example
                 *
                 *     var clone = instance.clone();
                 */
                clone: function () {
                    return this.init.prototype.extend(this);
                }
            };
        }());

        /**
         * An array of 32-bit words.
         *
         * @property {Array} words The array of 32-bit words.
         * @property {number} sigBytes The number of significant bytes in this word array.
         */
        var WordArray = C_lib.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of 32-bit words.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.create();
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
             */
            init: function (words, sigBytes) {
                words = this.words = words || [];

                if (sigBytes != undefined) {
                    this.sigBytes = sigBytes;
                } else {
                    this.sigBytes = words.length * 4;
                }
            },

            /**
             * Converts this word array to a string.
             *
             * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
             *
             * @return {string} The stringified word array.
             *
             * @example
             *
             *     var string = wordArray + '';
             *     var string = wordArray.toString();
             *     var string = wordArray.toString(CryptoJS.enc.Utf8);
             */
            toString: function (encoder) {
                return (encoder || Hex).stringify(this);
            },

            /**
             * Concatenates a word array to this word array.
             *
             * @param {WordArray} wordArray The word array to append.
             *
             * @return {WordArray} This word array.
             *
             * @example
             *
             *     wordArray1.concat(wordArray2);
             */
            concat: function (wordArray) {
                // Shortcuts
                var thisWords = this.words;
                var thatWords = wordArray.words;
                var thisSigBytes = this.sigBytes;
                var thatSigBytes = wordArray.sigBytes;

                // Clamp excess bits
                this.clamp();

                // Concat
                if (thisSigBytes % 4) {
                    // Copy one byte at a time
                    for (var i = 0; i < thatSigBytes; i++) {
                        var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                        thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                    }
                } else {
                    // Copy one word at a time
                    for (var i = 0; i < thatSigBytes; i += 4) {
                        thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                    }
                }
                this.sigBytes += thatSigBytes;

                // Chainable
                return this;
            },

            /**
             * Removes insignificant bits.
             *
             * @example
             *
             *     wordArray.clamp();
             */
            clamp: function () {
                // Shortcuts
                var words = this.words;
                var sigBytes = this.sigBytes;

                // Clamp
                words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
                words.length = Math.ceil(sigBytes / 4);
            },

            /**
             * Creates a copy of this word array.
             *
             * @return {WordArray} The clone.
             *
             * @example
             *
             *     var clone = wordArray.clone();
             */
            clone: function () {
                var clone = Base.clone.call(this);
                clone.words = this.words.slice(0);

                return clone;
            },

            /**
             * Creates a word array filled with random bytes.
             *
             * @param {number} nBytes The number of random bytes to generate.
             *
             * @return {WordArray} The random word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.random(16);
             */
            random: function (nBytes) {
                var words = [];

                var r = function (m_w) {
                    var m_w = m_w;
                    var m_z = 0x3ade68b1;
                    var mask = 0xffffffff;

                    return function () {
                        m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                        m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                        var result = ((m_z << 0x10) + m_w) & mask;
                        result /= 0x100000000;
                        result += 0.5;
                        return result * (Math.random() > 0.5 ? 1 : -1);
                    }
                };

                for (var i = 0, rcache; i < nBytes; i += 4) {
                    var _r = r((rcache || Math.random()) * 0x100000000);

                    rcache = _r() * 0x3ade67b7;
                    words.push((_r() * 0x100000000) | 0);
                }

                return new WordArray.init(words, nBytes);
            }
        });

        /**
         * Encoder namespace.
         */
        var C_enc = C.enc = {};

        /**
         * Hex encoding strategy.
         */
        var Hex = C_enc.Hex = {
            /**
             * Converts a word array to a hex string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The hex string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;

                // Convert
                var hexChars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    hexChars.push((bite >>> 4).toString(16));
                    hexChars.push((bite & 0x0f).toString(16));
                }

                return hexChars.join('');
            },

            /**
             * Converts a hex string to a word array.
             *
             * @param {string} hexStr The hex string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
             */
            parse: function (hexStr) {
                // Shortcut
                var hexStrLength = hexStr.length;

                // Convert
                var words = [];
                for (var i = 0; i < hexStrLength; i += 2) {
                    words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
                }

                return new WordArray.init(words, hexStrLength / 2);
            }
        };

        /**
         * Latin1 encoding strategy.
         */
        var Latin1 = C_enc.Latin1 = {
            /**
             * Converts a word array to a Latin1 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Latin1 string.
             *
             * @static
             *
             * @example
             *
             *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;

                // Convert
                var latin1Chars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    latin1Chars.push(String.fromCharCode(bite));
                }

                return latin1Chars.join('');
            },

            /**
             * Converts a Latin1 string to a word array.
             *
             * @param {string} latin1Str The Latin1 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
             */
            parse: function (latin1Str) {
                // Shortcut
                var latin1StrLength = latin1Str.length;

                // Convert
                var words = [];
                for (var i = 0; i < latin1StrLength; i++) {
                    words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
                }

                return new WordArray.init(words, latin1StrLength);
            }
        };

        /**
         * UTF-8 encoding strategy.
         */
        var Utf8 = C_enc.Utf8 = {
            /**
             * Converts a word array to a UTF-8 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-8 string.
             *
             * @static
             *
             * @example
             *
             *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
             */
            stringify: function (wordArray) {
                try {
                    return decodeURIComponent(escape(Latin1.stringify(wordArray)));
                } catch (e) {
                    throw new Error('Malformed UTF-8 data');
                }
            },

            /**
             * Converts a UTF-8 string to a word array.
             *
             * @param {string} utf8Str The UTF-8 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
             */
            parse: function (utf8Str) {
                return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
            }
        };

        /**
         * Abstract buffered block algorithm template.
         *
         * The property blockSize must be implemented in a concrete subtype.
         *
         * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
         */
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
            /**
             * Resets this block algorithm's data buffer to its initial state.
             *
             * @example
             *
             *     bufferedBlockAlgorithm.reset();
             */
            reset: function () {
                // Initial values
                this._data = new WordArray.init();
                this._nDataBytes = 0;
            },

            /**
             * Adds new data to this block algorithm's buffer.
             *
             * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
             *
             * @example
             *
             *     bufferedBlockAlgorithm._append('data');
             *     bufferedBlockAlgorithm._append(wordArray);
             */
            _append: function (data) {
                // Convert string to WordArray, else assume WordArray already
                if (typeof data == 'string') {
                    data = Utf8.parse(data);
                }

                // Append
                this._data.concat(data);
                this._nDataBytes += data.sigBytes;
            },

            /**
             * Processes available data blocks.
             *
             * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
             *
             * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
             *
             * @return {WordArray} The processed data.
             *
             * @example
             *
             *     var processedData = bufferedBlockAlgorithm._process();
             *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
             */
            _process: function (doFlush) {
                var processedWords;

                // Shortcuts
                var data = this._data;
                var dataWords = data.words;
                var dataSigBytes = data.sigBytes;
                var blockSize = this.blockSize;
                var blockSizeBytes = blockSize * 4;

                // Count blocks ready
                var nBlocksReady = dataSigBytes / blockSizeBytes;
                if (doFlush) {
                    // Round up to include partial blocks
                    nBlocksReady = Math.ceil(nBlocksReady);
                } else {
                    // Round down to include only full blocks,
                    // less the number of blocks that must remain in the buffer
                    nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
                }

                // Count words ready
                var nWordsReady = nBlocksReady * blockSize;

                // Count bytes ready
                var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

                // Process blocks
                if (nWordsReady) {
                    for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                        // Perform concrete-algorithm logic
                        this._doProcessBlock(dataWords, offset);
                    }

                    // Remove processed words
                    processedWords = dataWords.splice(0, nWordsReady);
                    data.sigBytes -= nBytesReady;
                }

                // Return processed words
                return new WordArray.init(processedWords, nBytesReady);
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = bufferedBlockAlgorithm.clone();
             */
            clone: function () {
                var clone = Base.clone.call(this);
                clone._data = this._data.clone();

                return clone;
            },

            _minBufferSize: 0
        });

        /**
         * Abstract hasher template.
         *
         * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
         */
        var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             */
            cfg: Base.extend(),

            /**
             * Initializes a newly created hasher.
             *
             * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
             *
             * @example
             *
             *     var hasher = CryptoJS.algo.SHA256.create();
             */
            init: function (cfg) {
                // Apply config defaults
                this.cfg = this.cfg.extend(cfg);

                // Set initial values
                this.reset();
            },

            /**
             * Resets this hasher to its initial state.
             *
             * @example
             *
             *     hasher.reset();
             */
            reset: function () {
                // Reset data buffer
                BufferedBlockAlgorithm.reset.call(this);

                // Perform concrete-hasher logic
                this._doReset();
            },

            /**
             * Updates this hasher with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {Hasher} This hasher.
             *
             * @example
             *
             *     hasher.update('message');
             *     hasher.update(wordArray);
             */
            update: function (messageUpdate) {
                // Append
                this._append(messageUpdate);

                // Update the hash
                this._process();

                // Chainable
                return this;
            },

            /**
             * Finalizes the hash computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The hash.
             *
             * @example
             *
             *     var hash = hasher.finalize();
             *     var hash = hasher.finalize('message');
             *     var hash = hasher.finalize(wordArray);
             */
            finalize: function (messageUpdate) {
                // Final message update
                if (messageUpdate) {
                    this._append(messageUpdate);
                }

                // Perform concrete-hasher logic
                var hash = this._doFinalize();

                return hash;
            },

            blockSize: 512/32,

            /**
             * Creates a shortcut function to a hasher's object interface.
             *
             * @param {Hasher} hasher The hasher to create a helper for.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
             */
            _createHelper: function (hasher) {
                return function (message, cfg) {
                    return new hasher.init(cfg).finalize(message);
                };
            },

            /**
             * Creates a shortcut function to the HMAC's object interface.
             *
             * @param {Hasher} hasher The hasher to use in this HMAC helper.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
             */
            _createHmacHelper: function (hasher) {
                return function (message, key) {
                    return new C_algo.HMAC.init(hasher, key).finalize(message);
                };
            }
        });

        /**
         * Algorithm namespace.
         */
        var C_algo = C.algo = {};

        return C;
    }(Math));

    // CryptoJS - md5
    (function (Math) {
        // Shortcuts
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;

        // Constants table
        var T = [];

        // Compute constants
        (function () {
            for (var i = 0; i < 64; i++) {
                T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
            }
        }());

        /**
         * MD5 hash algorithm.
         */
        var MD5 = C_algo.MD5 = Hasher.extend({
            _doReset: function () {
                this._hash = new WordArray.init([
                    0x67452301, 0xefcdab89,
                    0x98badcfe, 0x10325476
                ]);
            },

            _doProcessBlock: function (M, offset) {
                // Swap endian
                for (var i = 0; i < 16; i++) {
                    // Shortcuts
                    var offset_i = offset + i;
                    var M_offset_i = M[offset_i];

                    M[offset_i] = (
                        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                    );
                }

                // Shortcuts
                var H = this._hash.words;

                var M_offset_0  = M[offset + 0];
                var M_offset_1  = M[offset + 1];
                var M_offset_2  = M[offset + 2];
                var M_offset_3  = M[offset + 3];
                var M_offset_4  = M[offset + 4];
                var M_offset_5  = M[offset + 5];
                var M_offset_6  = M[offset + 6];
                var M_offset_7  = M[offset + 7];
                var M_offset_8  = M[offset + 8];
                var M_offset_9  = M[offset + 9];
                var M_offset_10 = M[offset + 10];
                var M_offset_11 = M[offset + 11];
                var M_offset_12 = M[offset + 12];
                var M_offset_13 = M[offset + 13];
                var M_offset_14 = M[offset + 14];
                var M_offset_15 = M[offset + 15];

                // Working varialbes
                var a = H[0];
                var b = H[1];
                var c = H[2];
                var d = H[3];

                // Computation
                a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
                d = FF(d, a, b, c, M_offset_1,  12, T[1]);
                c = FF(c, d, a, b, M_offset_2,  17, T[2]);
                b = FF(b, c, d, a, M_offset_3,  22, T[3]);
                a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
                d = FF(d, a, b, c, M_offset_5,  12, T[5]);
                c = FF(c, d, a, b, M_offset_6,  17, T[6]);
                b = FF(b, c, d, a, M_offset_7,  22, T[7]);
                a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
                d = FF(d, a, b, c, M_offset_9,  12, T[9]);
                c = FF(c, d, a, b, M_offset_10, 17, T[10]);
                b = FF(b, c, d, a, M_offset_11, 22, T[11]);
                a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
                d = FF(d, a, b, c, M_offset_13, 12, T[13]);
                c = FF(c, d, a, b, M_offset_14, 17, T[14]);
                b = FF(b, c, d, a, M_offset_15, 22, T[15]);

                a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
                d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
                c = GG(c, d, a, b, M_offset_11, 14, T[18]);
                b = GG(b, c, d, a, M_offset_0,  20, T[19]);
                a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
                d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
                c = GG(c, d, a, b, M_offset_15, 14, T[22]);
                b = GG(b, c, d, a, M_offset_4,  20, T[23]);
                a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
                d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
                c = GG(c, d, a, b, M_offset_3,  14, T[26]);
                b = GG(b, c, d, a, M_offset_8,  20, T[27]);
                a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
                d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
                c = GG(c, d, a, b, M_offset_7,  14, T[30]);
                b = GG(b, c, d, a, M_offset_12, 20, T[31]);

                a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
                d = HH(d, a, b, c, M_offset_8,  11, T[33]);
                c = HH(c, d, a, b, M_offset_11, 16, T[34]);
                b = HH(b, c, d, a, M_offset_14, 23, T[35]);
                a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
                d = HH(d, a, b, c, M_offset_4,  11, T[37]);
                c = HH(c, d, a, b, M_offset_7,  16, T[38]);
                b = HH(b, c, d, a, M_offset_10, 23, T[39]);
                a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
                d = HH(d, a, b, c, M_offset_0,  11, T[41]);
                c = HH(c, d, a, b, M_offset_3,  16, T[42]);
                b = HH(b, c, d, a, M_offset_6,  23, T[43]);
                a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
                d = HH(d, a, b, c, M_offset_12, 11, T[45]);
                c = HH(c, d, a, b, M_offset_15, 16, T[46]);
                b = HH(b, c, d, a, M_offset_2,  23, T[47]);

                a = II(a, b, c, d, M_offset_0,  6,  T[48]);
                d = II(d, a, b, c, M_offset_7,  10, T[49]);
                c = II(c, d, a, b, M_offset_14, 15, T[50]);
                b = II(b, c, d, a, M_offset_5,  21, T[51]);
                a = II(a, b, c, d, M_offset_12, 6,  T[52]);
                d = II(d, a, b, c, M_offset_3,  10, T[53]);
                c = II(c, d, a, b, M_offset_10, 15, T[54]);
                b = II(b, c, d, a, M_offset_1,  21, T[55]);
                a = II(a, b, c, d, M_offset_8,  6,  T[56]);
                d = II(d, a, b, c, M_offset_15, 10, T[57]);
                c = II(c, d, a, b, M_offset_6,  15, T[58]);
                b = II(b, c, d, a, M_offset_13, 21, T[59]);
                a = II(a, b, c, d, M_offset_4,  6,  T[60]);
                d = II(d, a, b, c, M_offset_11, 10, T[61]);
                c = II(c, d, a, b, M_offset_2,  15, T[62]);
                b = II(b, c, d, a, M_offset_9,  21, T[63]);

                // Intermediate hash value
                H[0] = (H[0] + a) | 0;
                H[1] = (H[1] + b) | 0;
                H[2] = (H[2] + c) | 0;
                H[3] = (H[3] + d) | 0;
            },

            _doFinalize: function () {
                // Shortcuts
                var data = this._data;
                var dataWords = data.words;

                var nBitsTotal = this._nDataBytes * 8;
                var nBitsLeft = data.sigBytes * 8;

                // Add padding
                dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

                var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
                var nBitsTotalL = nBitsTotal;
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                    (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                    (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
                );
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                    (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                    (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
                );

                data.sigBytes = (dataWords.length + 1) * 4;

                // Hash final blocks
                this._process();

                // Shortcuts
                var hash = this._hash;
                var H = hash.words;

                // Swap endian
                for (var i = 0; i < 4; i++) {
                    // Shortcut
                    var H_i = H[i];

                    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                           (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
                }

                // Return final computed hash
                return hash;
            },

            clone: function () {
                var clone = Hasher.clone.call(this);
                clone._hash = this._hash.clone();

                return clone;
            }
        });

        function FF(a, b, c, d, x, s, t) {
            var n = a + ((b & c) | (~b & d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function GG(a, b, c, d, x, s, t) {
            var n = a + ((b & d) | (c & ~d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function HH(a, b, c, d, x, s, t) {
            var n = a + (b ^ c ^ d) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function II(a, b, c, d, x, s, t) {
            var n = a + (c ^ (b | ~d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        /**
         * Shortcut function to the hasher's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         *
         * @return {WordArray} The hash.
         *
         * @static
         *
         * @example
         *
         *     var hash = CryptoJS.MD5('message');
         *     var hash = CryptoJS.MD5(wordArray);
         */
        C.MD5 = Hasher._createHelper(MD5);

        /**
         * Shortcut function to the HMAC's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         * @param {WordArray|string} key The secret key.
         *
         * @return {WordArray} The HMAC.
         *
         * @static
         *
         * @example
         *
         *     var hmac = CryptoJS.HmacMD5(message, key);
         */
        C.HmacMD5 = Hasher._createHmacHelper(MD5);
    }(Math));

    // CryptoJS - sha1
    (function () {
        // Shortcuts
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;

        // Reusable object
        var W = [];

        /**
         * SHA-1 hash algorithm.
         */
        var SHA1 = C_algo.SHA1 = Hasher.extend({
            _doReset: function () {
                this._hash = new WordArray.init([
                    0x67452301, 0xefcdab89,
                    0x98badcfe, 0x10325476,
                    0xc3d2e1f0
                ]);
            },

            _doProcessBlock: function (M, offset) {
                // Shortcut
                var H = this._hash.words;

                // Working variables
                var a = H[0];
                var b = H[1];
                var c = H[2];
                var d = H[3];
                var e = H[4];

                // Computation
                for (var i = 0; i < 80; i++) {
                    if (i < 16) {
                        W[i] = M[offset + i] | 0;
                    } else {
                        var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                        W[i] = (n << 1) | (n >>> 31);
                    }

                    var t = ((a << 5) | (a >>> 27)) + e + W[i];
                    if (i < 20) {
                        t += ((b & c) | (~b & d)) + 0x5a827999;
                    } else if (i < 40) {
                        t += (b ^ c ^ d) + 0x6ed9eba1;
                    } else if (i < 60) {
                        t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
                    } else /* if (i < 80) */ {
                        t += (b ^ c ^ d) - 0x359d3e2a;
                    }

                    e = d;
                    d = c;
                    c = (b << 30) | (b >>> 2);
                    b = a;
                    a = t;
                }

                // Intermediate hash value
                H[0] = (H[0] + a) | 0;
                H[1] = (H[1] + b) | 0;
                H[2] = (H[2] + c) | 0;
                H[3] = (H[3] + d) | 0;
                H[4] = (H[4] + e) | 0;
            },

            _doFinalize: function () {
                // Shortcuts
                var data = this._data;
                var dataWords = data.words;

                var nBitsTotal = this._nDataBytes * 8;
                var nBitsLeft = data.sigBytes * 8;

                // Add padding
                dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
                data.sigBytes = dataWords.length * 4;

                // Hash final blocks
                this._process();

                // Return final computed hash
                return this._hash;
            },

            clone: function () {
                var clone = Hasher.clone.call(this);
                clone._hash = this._hash.clone();

                return clone;
            }
        });

        /**
         * Shortcut function to the hasher's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         *
         * @return {WordArray} The hash.
         *
         * @static
         *
         * @example
         *
         *     var hash = CryptoJS.SHA1('message');
         *     var hash = CryptoJS.SHA1(wordArray);
         */
        C.SHA1 = Hasher._createHelper(SHA1);

        /**
         * Shortcut function to the HMAC's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         * @param {WordArray|string} key The secret key.
         *
         * @return {WordArray} The HMAC.
         *
         * @static
         *
         * @example
         *
         *     var hmac = CryptoJS.HmacSHA1(message, key);
         */
        C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
    }());

    // CryptoJS - Hmac
    (function () {
        // Shortcuts
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var C_enc = C.enc;
        var Utf8 = C_enc.Utf8;
        var C_algo = C.algo;

        /**
         * HMAC algorithm.
         */
        var HMAC = C_algo.HMAC = Base.extend({
            /**
             * Initializes a newly created HMAC.
             *
             * @param {Hasher} hasher The hash algorithm to use.
             * @param {WordArray|string} key The secret key.
             *
             * @example
             *
             *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
             */
            init: function (hasher, key) {
                // Init hasher
                hasher = this._hasher = new hasher.init();

                // Convert string to WordArray, else assume WordArray already
                if (typeof key == 'string') {
                    key = Utf8.parse(key);
                }

                // Shortcuts
                var hasherBlockSize = hasher.blockSize;
                var hasherBlockSizeBytes = hasherBlockSize * 4;

                // Allow arbitrary length keys
                if (key.sigBytes > hasherBlockSizeBytes) {
                    key = hasher.finalize(key);
                }

                // Clamp excess bits
                key.clamp();

                // Clone key for inner and outer pads
                var oKey = this._oKey = key.clone();
                var iKey = this._iKey = key.clone();

                // Shortcuts
                var oKeyWords = oKey.words;
                var iKeyWords = iKey.words;

                // XOR keys with pad constants
                for (var i = 0; i < hasherBlockSize; i++) {
                    oKeyWords[i] ^= 0x5c5c5c5c;
                    iKeyWords[i] ^= 0x36363636;
                }
                oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

                // Set initial values
                this.reset();
            },

            /**
             * Resets this HMAC to its initial state.
             *
             * @example
             *
             *     hmacHasher.reset();
             */
            reset: function () {
                // Shortcut
                var hasher = this._hasher;

                // Reset
                hasher.reset();
                hasher.update(this._iKey);
            },

            /**
             * Updates this HMAC with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {HMAC} This HMAC instance.
             *
             * @example
             *
             *     hmacHasher.update('message');
             *     hmacHasher.update(wordArray);
             */
            update: function (messageUpdate) {
                this._hasher.update(messageUpdate);

                // Chainable
                return this;
            },

            /**
             * Finalizes the HMAC computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The HMAC.
             *
             * @example
             *
             *     var hmac = hmacHasher.finalize();
             *     var hmac = hmacHasher.finalize('message');
             *     var hmac = hmacHasher.finalize(wordArray);
             */
            finalize: function (messageUpdate) {
                // Shortcut
                var hasher = this._hasher;

                // Compute HMAC
                var innerHash = hasher.finalize(messageUpdate);
                hasher.reset();
                var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

                return hmac;
            }
        });
    }());

    // CryptoJS - enc-base64
    (function () {
        // Shortcuts
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;

        /**
         * Base64 encoding strategy.
         */
        var Base64 = C_enc.Base64 = {
            /**
             * Converts a word array to a Base64 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Base64 string.
             *
             * @static
             *
             * @example
             *
             *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;
                var map = this._map;

                // Clamp excess bits
                wordArray.clamp();

                // Convert
                var base64Chars = [];
                for (var i = 0; i < sigBytes; i += 3) {
                    var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
                    var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                    var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                    var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                    for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                        base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                    }
                }

                // Add padding
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    while (base64Chars.length % 4) {
                        base64Chars.push(paddingChar);
                    }
                }

                return base64Chars.join('');
            },

            /**
             * Converts a Base64 string to a word array.
             *
             * @param {string} base64Str The Base64 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
             */
            parse: function (base64Str) {
                // Shortcuts
                var base64StrLength = base64Str.length;
                var map = this._map;
                var reverseMap = this._reverseMap;

                if (!reverseMap) {
                        reverseMap = this._reverseMap = [];
                        for (var j = 0; j < map.length; j++) {
                            reverseMap[map.charCodeAt(j)] = j;
                        }
                }

                // Ignore padding
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    var paddingIndex = base64Str.indexOf(paddingChar);
                    if (paddingIndex !== -1) {
                        base64StrLength = paddingIndex;
                    }
                }

                // Convert
                return parseLoop(base64Str, base64StrLength, reverseMap);

            },

            _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
        };

        function parseLoop(base64Str, base64StrLength, reverseMap) {
          var words = [];
          var nBytes = 0;
          for (var i = 0; i < base64StrLength; i++) {
              if (i % 4) {
                  var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                  var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                  var bitsCombined = bits1 | bits2;
                  words[nBytes >>> 2] |= bitsCombined << (24 - (nBytes % 4) * 8);
                  nBytes++;
              }
          }
          return WordArray.create(words, nBytes);
        }
    }());
  }

  var isBrowser = 'undefined' === typeof XMLHttpRequest ? false : true;
  var http, https;
  if (!isBrowser) {
    http  = require('http');
    https = require('https');
  }

  var MIN_ALLOWED_NS_TIMESTAMP = '1000000000000000000';

  var ESCAPE_REPLACER           = '\\$1';
  var RE_ESCAPE_TAG_KEY         = /([,= ])/g;
  var RE_ESCAPE_TAG_VALUE       = RE_ESCAPE_TAG_KEY;
  var RE_ESCAPE_FIELD_KEY       = RE_ESCAPE_TAG_KEY;
  var RE_ESCAPE_MEASUREMENT     = /([, ])/g;
  var RE_ESCAPE_FIELD_STR_VALUE = /(["\\])/g;

  var KEYEVENT_STATUS = ['critical', 'error', 'warning', 'info', 'ok'];

  function strf() {
    var args = Array.prototype.slice.call(arguments);
    if (0 === args.length) {
      return '';
    }

    var pattern = args.shift();
    try {
      pattern = pattern.toString();
    } catch (ex) {
      pattern = '';
    }

    return pattern.replace(/\{(\d+)\}/g, function replaceFunc(m, i) {
      return args[i] + '';
    });
  }
  function parseQuery(query) {
    if (query[0] === '?') query = query.slice(1);

    var queryObj = {};
    query.split('&').forEach(function(kvExpr) {
      var kvPair = kvExpr.split('=');
      queryObj[kvPair[0]] = kvPair[1];
    });

    return queryObj;
  };
  function encodeQuery(query) {
    var parts = [];
    for (var k in query) {
      var v = query[k];
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
    return parts.join('&');
  }
  function dumpHeaders(headers) {
    var headersDumps = '';
    if (headers) {
      var headerLines = [];
      for (var k in headers) {
        headerLines.push(k + ': ' + headers[k]);
      }
      headersDumps = headerLines.join('\n');
    }

    return headersDumps;
  }

  function padLeft(str, char, length) {
    while(str.length < length) str = char + str;
    return str;
  }
  function padRight(str, char, length) {
    while(str.length < length) str += char;
    return str;
  }

  function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
  }
  function isEmptyObjectOrNothing(o) {
    return !o || isObject(o) && Object.keys(o).length === 0;
  }
  function isString(o) {
    return 'string' === typeof o;
  }
  function isNumber(o) {
    return 'number' === typeof o;
  }
  function isInteger(o) {
    return isNumber(o) && (o % 1 === 0);
  }
  function isBoolean(o) {
    return 'boolean' === typeof o;
  }

  function IntVal(i) {
    this.val = parseInt(i);
  }
  function asInt(i) {
    return new IntVal(i);
  }
  function stringifyTags(o) {
    switch (Object.prototype.toString.call(o)) {
      case '[object Object]':
        break;

      case '[object Array]':
        return JSON.stringify(o.map(stringifyTags));

      default:
        return JSON.stringify(o);
    }

    var keys = Object.keys(o);
    keys.sort();

    var parts = [];
    keys.forEach(function(k) {
      parts.push(JSON.stringify(k) + ':' + stringifyTags(o[k]));
    });

    return '{' + parts.join(',') + '}';
  }

  var ASSERT_TYPE_MAP = {
    json: {
      type   : '[object Object]',
      message: 'should be a JSON object',
    },
    array: {
      type   : '[object Array]',
      message: 'should be an Array object',
    },
    str: {
      type   : '[object String]',
      message: 'should be a String',
    },
  }
  function _assertType(data, dataType, name) {
    var _dataType = Object.prototype.toString.call(data);
    if (_dataType !== ASSERT_TYPE_MAP[dataType].type) {
      throw new Error(strf('`{0}` {1}, got {2}', name, ASSERT_TYPE_MAP[dataType].message, _dataType));
    }
    return data;
  }
  function assertJSON(data, name) {
    return _assertType(data, 'json', name);
  }
  function assertArray(data, name) {
    return _assertType(data, 'array', name);
  }
  function assertStr(data, name) {
    return _assertType(data, 'str', name);
  }

  function assertTimestamp(data, name) {
    if ('number' !== typeof data && !data.match(/^([1-9]\d+|\d)(\.\d*[1-9])?$/g)) {
      throw new Error(strf('`{0}` should be a number or a number string, got {1}', name, data));
    }
  }

  function assertInt(data, name) {
    if (!isInteger(data)) {
      throw new Error(strf('`{0}` should be an number without point', name));
    }
    return data;
  }

  function assertEnum(data, name, opt) {
    if (opt.indexOf(data) < 0) {
      throw new Error(strf('`{0}` should be one of {1}', name, opt.join(',')));
    }
    return data;
  }

  function assertTags(data, name) {
    assertJSON(data, name);
    for (var k in data) if (data.hasOwnProperty(k)) {
      var v = data[k];
      assertStr(k, strf('Key of `{0}`: {1}', name));
      assertStr(v, strf('Value of `{0}["{1}"]`: {2}', name, k ,v));
    }
    return data;
  }

  function assertJSONStr(data, name) {
    if ('string' === typeof data) {
      try {
        data = stringifyTags(JSON.parse(data));
      } catch(e) {
        throw new Error(strf('`{0}` should be a JSON or JSON string', name));
      }

    } else if (isObject(data)) {
      try {
        data = stringifyTags(data)
      } catch(e) {
        throw new Error(strf('`{0}` should be a JSON or JSON string', name));
      }
    } else {
      throw new Error(strf('`{0}` should be a JSON or JSON string', name));
    }
    return data;
  }

  function _jsonReplacer(k, v) {
    if (v instanceof IntVal) {
      return {
        $class: 'IntVal',
        $value: v.val,
      };
    }
    return v;
  }
  function _jsonReceiver(k, v) {
    if (null !== v && 'object' === typeof v && v.$class === 'IntVal') {
      return asInt(v.$value);
    }
    return v;
  }

  function jsonCopy(j) {
    return JSON.parse(JSON.stringify(j, _jsonReplacer), _jsonReceiver);
  }

  var COLORS = {
    'black'  : [30, 39],
    'red'    : [31, 39],
    'green'  : [32, 39],
    'yellow' : [33, 39],
    'blue'   : [34, 39],
    'magenta': [35, 39],
    'cyan'   : [36, 39],
    'white'  : [37, 39],
    'gray'   : [90, 39],
    'grey'   : [90, 39],
  }

  function colored(s, name) {
    if (name in COLORS) {
        var left  = '\x1b[' + COLORS[name][0] + 'm';
        var right = '\x1b[' + COLORS[name][1] + 'm';

        return left + s + right;

    } else {
      throw new Error(strf("Color '{0}' not supported.", name));
    }
  }

  function DataWay(opt) {
    opt = opt || {};

    this.host      = opt.host || 'localhost';
    this.port      = parseInt(opt.port || 9528);
    this.protocol  = opt.protocol || 'http';
    this.path      = opt.path || '/v1/write/metric';
    this.token     = opt.token;
    this.rp        = opt.rp || null;
    this.accessKey = opt.accessKey;
    this.secretKey = opt.secretKey;
    this.debug     = opt.debug  || false;
    this.dryRun    = opt.dryRun || false;

    if (this.debug) {
      if (isBrowser) {
        console.log(strf('[JS Environment]\n{0}', navigator.userAgent));
      } else {
        console.log(strf('[JS Environment]\n node {0} {1} {2}', process.version, process.platform, process.arch));
      }

      if (this.dryRun) {
        console.log('[DRY RUN MODE]');
      }
    }

    if (opt.url) {
      var parsedURL = new URL(opt.url);

      this.protocol = parsedURL.protocol.replace(/\:$/g, '');

      if (parsedURL.pathname && parsedURL.pathname !== '/') {
        this.path = parsedURL.pathname;
      }
      if (parsedURL.search) {
        var parsedQuery = parseQuery(parsedURL.search);
        if ('token' in parsedQuery) {
          this.token = parsedQuery.token;
        }
      }

      this.host = parsedURL.hostname;
      if (parsedURL.port) {
        this.port = parseInt(parsedURL.port);
      } else {
        this.port = this.protocol === 'https' ? 443 : 80;
      }
    }
  }

  DataWay.prototype._toNsString = function(timestamp) {
    timestamp = timestamp || Date.now();
    timestamp = timestamp.toString();
    if (timestamp.indexOf('e') >= 0) {
      var parts = timestamp.split('e');
      var tsI = parts[0].replace(/\./g, '');
      var tsP = parseInt(parts[1]);
      timestamp = strf('{0}{1}', tsI, (tsP - tsI.length + 1));
    }

    var parts = timestamp.split('.');
    var tsI = parts[0];
    var appending = padRight(parts[1] || '', '0', 9);
    for (var i = 0; i <= 9; i += 3) {
      if (tsI.length + i >= MIN_ALLOWED_NS_TIMESTAMP.length) {
        timestamp = strf('{0}{1}', tsI, appending.slice(0, i));
        break;
      }
    }
    return timestamp;
  };

  DataWay.prototype._getBodyMD5 = function(body) {
    var hash = CryptoJS.MD5(body);
    var md5Res = CryptoJS.enc.Base64.stringify(hash);

    return md5Res;
  };

  DataWay.prototype._getSign = function(strToSign) {
    var hash = CryptoJS.HmacSHA1(strToSign, this.secretKey);
    var md5Res = CryptoJS.enc.Base64.stringify(hash);

    return md5Res;
  };

  DataWay.prototype._prepareAuthHeaders = function(opt) {
    opt = opt || {};

    opt.body        = opt.body        || '';
    opt.contentType = opt.contentType || '';

    var headers = {};
    if (!this.accessKey || !this.secretKey) {
      return headers;
    }

    var bodyMD5 = this._getBodyMD5(opt.body);
    var dateStr = new Date().toGMTString();
    var strToSign = [opt.method, bodyMD5, opt.contentType, dateStr].join('\n');

    var sign = this._getSign(strToSign);

    if (this.debug) {
      console.log(strf('\n[String to sign] {0}', JSON.stringify(strToSign)));
      console.log(strf('[Signature] {0}', JSON.stringify(sign)));
    }

    headers['Date']          = dateStr;
    headers['Authorization'] = strf('DWAY {0}:{1}', this.accessKey, sign);

    return headers;
  };

  DataWay.prototype.prepareLineProtocol = function(points) {
    var self = this;

    if (!Array.isArray(points)) points = [points];

    var lines = [];

    points.forEach(function(p) {
      // Influx DB line protocol
      // https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
      var measurement = p.measurement;
      measurement = measurement.replace(RE_ESCAPE_MEASUREMENT, ESCAPE_REPLACER);

      var tagSetList = [];
      var tags = p.tags;
      if (tags) {
        var keyList = Object.keys(tags).sort();
        keyList.forEach(function(k) {
          var v = tags[k];
          if ('undefined' === typeof v || v === null || ('' + v).trim() === '') return;

          v = '' + v;

          k = k.replace(RE_ESCAPE_TAG_KEY, ESCAPE_REPLACER);
          v = v.replace(RE_ESCAPE_TAG_VALUE, ESCAPE_REPLACER);

          tagSetList.push(strf('{0}={1}', k, v));
        });
      }

      var tagSet = '';
      if (tagSetList.length > 0) {
        tagSet = strf(',{0}', tagSetList.join(','));
      }

      var fieldSetList = [];
      var fields = p.fields;
      if (fields) {
        var keyList = Object.keys(fields).sort();
        keyList.forEach(function(k) {
          var v = fields[k];
          if ('undefined' === typeof v || v === null) return;

          k = k.replace(RE_ESCAPE_FIELD_KEY, ESCAPE_REPLACER);
          if (isString(v)) {
            v = v.replace(RE_ESCAPE_FIELD_STR_VALUE, ESCAPE_REPLACER);
            v = strf('"{0}"', v);

          } else if (isBoolean(v)) {
            v = strf('{0}', v);

          } else if (v instanceof IntVal) {
            v = strf('{0}i', v.val);

          } else {
            v = strf('{0}', v);
          }

          fieldSetList.push(strf('{0}={1}', k, v));
        });
      }

      var fieldSet = strf(' {0}', fieldSetList.join(','));

      var timestamp = p.timestamp;
      timestamp = self._toNsString(timestamp);
      timestamp = strf(' {0}', timestamp);

      lines.push(strf('{0}{1}{2}{3}', measurement, tagSet, fieldSet, timestamp));
    });

    var body = lines.join('\n');

    return body;
  };

  DataWay.prototype._doRequest = function(opt, callback) {
    opt.method = opt.method || 'GET'

    if (!isEmptyObjectOrNothing(opt.query)) {
      opt.path = opt.path + '?' + encodeQuery(opt.query);
    }
    opt.url = strf('{0}://{1}:{2}{3}', this.protocol, this.host, this.port, opt.path);

    if (isBrowser) {
      return this._doRequest_browser(opt, callback);
    } else {
      return this._doRequest_node(opt, callback);
    }
  };

  DataWay.prototype._doRequest_browser = function(opt, callback) {
    var self = this;

    if (self.debug) {
      console.log(strf('[Request] {0} {1}', opt.method, opt.url));
      console.log(strf('[Request Headers]\n{0}', dumpHeaders(opt.headers) || '<EMPTY>'));
      if (opt.method.toUpperCase() !== 'GET') {
        console.log(strf('[Request Body]\n{0}', opt.body || '<EMPTY>'));
      }
    }

    if (!self.dryRun) {
      var xhr = new XMLHttpRequest();

      xhr.open(opt.method, opt.url);

      if (!isEmptyObjectOrNothing(opt.headers)) {
        for (var k in opt.headers) if (opt.headers.hasOwnProperty(k)) {
          xhr.setRequestHeader(k, opt.headers[k]);
        }
      }

      var reqCallback = function() {
        var respData = xhr.responseText;
        try { respData = JSON.parse(respData); } catch(err) { }

        var ret = {
          statusCode: xhr.status,
          respData  : respData,
        }

        if (self.debug) {
          console.log(strf('\n[Response Status Code] {0}', ret.statusCode));
          console.log(strf('[Response Body] {0}', JSON.stringify(ret.respData)));
        }

        if ('function' === typeof callback) callback(null, ret);
      };

      xhr.onload  = reqCallback;
      xhr.onerror = reqCallback;

      xhr.send(opt.body);

    } else {
      if ('function' === typeof callback) callback();
    }
  };

  DataWay.prototype._doRequest_node = function(opt, callback) {
    var self = this;

    if (self.debug) {
      console.log(strf('[Request] {0} {1}://{2}:{3}{4}', opt.method, self.protocol, self.host, self.port, opt.path));
      console.log(strf('[Request Headers]\n{0}', dumpHeaders(opt.headers) || '<EMPTY>'));
      if (opt.method.toUpperCase() !== 'GET') {
        console.log(strf('[Request Body]\n{0}', opt.body || '<EMPTY>'));
      }
    }

    if (!self.dryRun) {
      // Do HTTP/HTTPS
      var requestOptions = {
        host   : self.host,
        port   : self.port,
        path   : opt.path,
        method : opt.method,
        headers: opt.headers,
        timeout: 3 * 1000,
      };

      var httpLib = self.protocol === 'https' ? https : http;

      var respStatusCode = 0;
      var respRawData    = '';
      var respData       = '';
      var req = httpLib.request(requestOptions, function(res) {
        respStatusCode = res.statusCode;

        res.on('data', function(chunk) {
          respRawData += chunk;
        });

        res.on('end', function() {
          respData = respRawData;
          try { respData = JSON.parse(respData); } catch(err) { };

          var ret = {
            statusCode: respStatusCode,
            respData  : respData,
          }

          if (self.debug) {
            var output = strf('\n[Response Status Code] {0}\n[Response Body] {1}', ret.statusCode, JSON.stringify(ret.respData || '') || '<EMPTY>');

            var color = 'green';
            if (ret.statusCode >= 400) {
              color = 'red';
            }

            console.log(colored(output, color));
          }

          if ('function' === typeof callback) return callback(null, ret);
        });
      });

      req.on('error', function(err) {
        if ('function' === typeof callback) {
          return callback(err);
        }
      });

      if (opt.body) {
        req.write(opt.body);
      }

      req.end();

    } else {
      if ('function' === typeof callback) callback();
    }
  };

  DataWay.prototype._doGET = function(opt, callback) {
    opt = opt || {};

    opt.method  = 'GET';
    opt.path    = opt.path    || this.path;
    opt.query   = opt.query   || {};
    opt.headers = opt.headers || {};

    if (this.token) {
      opt.query['token'] = this.token;
    }

    var _authHeaders = this._prepareAuthHeaders(opt);
    Object.assign(opt.headers, _authHeaders);

    return this._doRequest(opt, callback);
  };

  DataWay.prototype._doPOST = function(opt, callback) {
    opt = opt || {};

    opt.method      = opt.method      || 'POST';
    opt.contentType = opt.contentType || 'text/plain';
    opt.path        = opt.path        || this.path;
    opt.query       = opt.query       || {};
    opt.headers     = opt.headers     || {};

    if (this.token) {
      opt.query['token'] = this.token;
    }
    if (opt.withRP && this.rp) {
      opt.query['rp'] = this.rp;
    }

    var _authHeaders = this._prepareAuthHeaders(opt);
    Object.assign(opt.headers, _authHeaders);
    opt.headers['Content-Type'] = opt.contentType;

    return this._doRequest(opt, callback);
  };

  // Low-Level API
  DataWay.prototype.get = function(opt, callback) {
    return this._doGET(opt, callback);
  };

  DataWay.prototype.postLineProtocol = function(points, opt, callback) {
    opt = opt || {};
    opt.contentType = 'text/plain';

    // break obj reference
    points = jsonCopy(points);
    opt    = jsonCopy(opt);

    opt.body = this.prepareLineProtocol(points);

    return this._doPOST(opt, callback);
  };

  DataWay.prototype.postJSON = function(jsonObj, opt, callback) {
    opt = opt || {};
    opt.contentType = 'application/json';

    // break obj reference
    opt = jsonCopy(opt);

    opt.body = jsonObj;
    if ('string' !== typeof opt.body) {
      opt.body = JSON.stringify(opt.body);
    }

    return this._doPOST(opt, callback);
  };

  // High-Level API
  DataWay.prototype._prepareMetric = function(data) {
    assertJSON(data, 'data');

    var measurement = assertStr(data.measurement, 'measurement');

    var tags = data.tags;
    if (tags) {
      assertJSON(tags, 'tags');
      assertTags(tags, 'tags');
    }

    var fields = assertJSON(data.fields, 'fields')

    var timestamp = data.timestamp;
    if (timestamp) {
      assertTimestamp(timestamp, 'timestamp')
    }

    var preparedData = {
        measurement: measurement,
        tags       : tags   || null,
        fields     : fields || null,
        timestamp  : timestamp,
    };
    return preparedData;
  };

  DataWay.prototype.writeMetric = function(data, callback) {
    var data = {
        measurement: data.measurement,
        tags       : data.tags,
        fields     : data.fields,
        timestamp  : data.timestamp,
    };

    // break obj reference
    data = jsonCopy(data);

    var preparedData = this._prepareMetric(data);

    var opt = {
      path  : '/v1/write/metric',
      withRP: true,
    };
    this.postLineProtocol(preparedData, opt, callback);
  };

  DataWay.prototype.writeMetrics = function(data, callback) {
    var self = this;

    if (!Array.isArray(data)) {
      throw new Error('`data` should be an array');
    }

    // break obj reference
    data = jsonCopy(data);

    var preparedData = [];
    data.forEach(function(d) {
      preparedData.push(self._prepareMetric(d));
    });

    var opt = {
      path  : '/v1/write/metric',
      withRP: true,
    };
    self.postLineProtocol(preparedData, opt, callback);
  };

  DataWay.prototype.writePoint = function(data, callback) {
    // Alias of this.writeMetric()
    return this.writeMetric(data, callback);
  };

  DataWay.prototype.writePoints = function(points, callback) {
    // Alias of this.writeMetrics()
    return this.writeMetrics(data, callback);
  };

  return {
    DataWay: DataWay,
    Dataway: DataWay, //Alias
    asInt  : asInt,
  };
}));
