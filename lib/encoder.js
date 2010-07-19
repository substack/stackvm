/*  Emit png (and soon jpeg) tiles from an RFB stream.
    Emits these events:
        error, png, copyRect, desktopSize
*/

var EventEmitter = require('events').EventEmitter;
var PngLib = require('png');
var Buffer = require('buffer').Buffer;

exports.Encoder = Encoder;
Encoder.prototype = new EventEmitter;
function Encoder (rfb) {
    if (!(this instanceof Encoder)) return new Encoder(rfb);
    var self = this;
    var pngStack = null;
    
    // pass some events through directly to consumers
    'error copyRect desktopSize'.split(/\s+/).forEach(function (ev) {
        rfb.addListener(ev, function () {
            var args = [ev].concat([].slice.call(arguments));
            self.emit.apply(self,args);
        });
    });
    
    rfb.addListener('startRects', function (nRects) {
        if (nRects > 1) {
            pngStack = new PngLib.DynamicPngStack('rgb');
        }
    });
    
    rfb.addListener('endRects', function (nRects) {
        if (nRects > 1) {
            var png = pngStack.encode();
            var pngBuf = new Buffer(png.length);
            pngBuf.write(png, 'binary');
            
            var dims = pngStack.dimensions();
            self.emit('png', {
                image : pngBuf,
                image64 : base64.encode(pngBuf),
                width : dims.width,
                height : dims.height,
                x : dims.x,
                y : dims.y
            });
        }
    });
    
    rfb.addListener('raw', function (rect) {
        if (rect.nRects == 1) {
            var png = new PngLib.Png(rect.fb, rect.width, rect.height, 'rgb').encode();
            var pngBuf = new Buffer(png.length);
            pngBuf.write(png, 'binary');
            
            var rfbDims = rfb.fbDims();
            var fullScreen = (rect.width == rfbDims.width) &&
                (rect.height == rfbDims.height);
            
            self.emit('png', {
                image : pngBuf,
                image64 : base64_encode(pngBuf),
                width : rect.width,
                height : rect.height,
                x : rect.x,
                y : rect.y,
                fullScreen : fullScreen
            });
        }
        else {
            pngStack.push(rect.fb, rect.x, rect.y, rect.width, rect.height);
        }
    });
    
    rfb.addListener('unknownRect', function (rect) {
        sys.log('received an unknownRect from rfb: ' + sys.inspect(rect));
        self.emit('error', 'received an unknownRect from rfb');
    });
}
