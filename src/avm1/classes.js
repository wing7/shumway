/* -*- mode: javascript; tab-width: 2; indent-tabs-mode: nil -*- */

function proxyNativeProperty(propertyName) {
  return {
    get: function getter() { return this.$nativeObject[propertyName]; },
    set: function setter(value) { this.$nativeObject[propertyName] = value; },
    enumerable: true
  };
}

function proxyNativeReadonlyProperty(propertyName) {
  return {
    get: function getter() { return this.$nativeObject[propertyName]; },
    enumerable: true
  };
}

function proxyNativeMethod(methodName) {
  return {
    value: function proxyMethod(id) {
      return this.$nativeObject[methodName].apply(this.$nativeObject, arguments);
    },
    enumerable: false
  };
}

function proxyEventHandler(eventName, argsConverter) {
  var currentHandler = null;
  var handlerRunner = null;
  return {
    get: function() {
      return currentHandler;
    },
    set: function(newHandler) {
      if (currentHandler === newHandler) {
        return;
      }
      if (currentHandler) {
        this.$nativeObject.removeEventListener(eventName, handlerRunner);
      }
      currentHandler = newHandler;
      if (currentHandler) {
        handlerRunner = function handlerRunner() {
          var args = argsConverter ? argsConverter(arguments) : null;
          return currentHandler.apply(this, args);
        }.bind(this);
        this.$nativeObject.addEventListener(eventName, handlerRunner);
      } else {
        handlerRunner = null;
      }
    },
    configurable: false,
    enumerable: false
  };
}

function createConstant(value) {
  return {
    value: value,
    writable: false,
    configurable: false,
    enumerable: true
  };
}

function defineObjectProperties(obj, propeties) {
  for (var i in propeties)
    Object.defineProperty(obj, i, propeties[i]);
}

function getAS2Object(nativeObject) {
  return nativeObject ? nativeObject._getAS2Object() : null;
}

// AS2 Classes

function AS2MovieClip() {
}
AS2MovieClip.prototype = Object.create(Object.prototype, {
  $nativeObject: {
    value: null,
    writable: true
  },
  $attachNativeObject: {
    value: function attachNativeObject(nativeMovieClip) {
      this.$nativeObject = nativeMovieClip;
      nativeMovieClip.$as2Object = this;
    },
    enumerable: false
  },
  $lookupChild: {
    value: function lookupChild(id) {
      var child;
      if (id == '.') {
        return this;
      } else if (id == '..') {
        return getAS2Object(this.$nativeObject.parent);
      } else {
        return getAS2Object(this.$nativeObject.getChildByName(id));
      }
    },
    enumerable: false
  },
  $targetPath: {
    get: function targetPath$get() {
      var target = this._target;
      var prefix = '_level0'; // TODO use needed level number here
      return target != '/' ? prefix + target.replace(/\//g, '.') : prefix;
    },
    enumerable: true
  },
  _alpha: proxyNativeProperty('alpha'),
  attachAudio: {
    value: function attachAudio(id) {
      throw 'Not implemented: attachAudio';
    },
    enumerable: false
  },
  attachBitmap: {
    value: function attachBitmap(bmp, depth, pixelSnapping, smoothing) {
      throw 'Not implemented: attachBitmap';
    },
    enumerable: false
  },
  attachMovie: {
    value: function attachMovie(id, name, depth, initObject) {
      var mc = this.$nativeObject._constructSymbol(symbolId, name);
      this._insertChildAtDepth(mc, depth);

      var as2mc = mc._getAS2Object();
      for (var i in initObject) {
        as2mc[i] = initObject[i];
      }

      return as2mc;
    },
    enumerable: false
  },
  beginFill: {
    value: function beginFill(color, alpha) {
      this.$nativeObject._graphics.beginFill(color, alpha);
    },
  },
  beginBitmapFill: {
    value: function beginBitmapFill(bmp, matrix, repeat, smoothing) {
      if (!(bmp instanceof flash.display.BitmapData))
        return;

      this.$nativeObject._graphics.beginBitmapFill(bmp, matrix, repeat, smoothing);
    },
    enumerable: false
  },
  beginGradientFill: {
    value: function beginGradientFill(fillType, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio) {
      this.$nativeObject._graphics.beginGradientFill(fillType, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio);
    },
    enumerable: false
  },
  blendMode: proxyNativeProperty('blendMode'),
  cacheAsBitmap: proxyNativeProperty('cacheAsBitmap'),
  clear: {
    value: function clear() {
      this.$nativeObject._graphics.clear();
    },
    enumerable: false
  },
  createEmptyMovieClip: {
    value: function createEmptyMovieClip(name, depth) {
      var MovieClipClass = avm2.systemDomain.getClass("flash.display.MovieClip");
      var mc = MovieClipClass.createInstance();
      mc.name = name;
      this.$nativeObject._insertChildAtDepth(mc, +depth);
      return mc._getAS2Object();
    },
    enumerable: false
  },
  createTextField: {
    value: function createTextField(name, depth, x, y, width, height) {
      var TextFieldClass = avm2.systemDomain.getClass("flash.text.TextField");
      var text = TextFieldClass.createInstance();
      text.name = name;
      text._bbox = {left: +x, top: +y, right: +x + width, bottom: +y + height};
      this.$nativeObject._insertChildAtDepth(text, +depth);
      return text._getAS2Object();
    },
    enumerable: false
  },
  _currentframe: proxyNativeReadonlyProperty('currentFrame'),
  curveTo: {
    value: function curveTo(controlX, controlY, anchorX, anchorY) {
      this.$nativeObject._graphics.curveTo(controlX, controlY, anchorX, anchorY);
    },
    enumerable: false
  },
  _droptarget: proxyNativeReadonlyProperty('dropTarget'),
  duplicateMovieClip: {
    value: function duplicateMovieClip(name, depth, initObject) {
      var newMovieClip = this.$nativeObject.
        _duplicate(name, +depth, initObject)._getAS2Object();
      return newMovieClip;
    },
    enumerable: false
  },
  enabled: proxyNativeProperty('enabled'),
  endFill: {
    value: function endFill() {
      this.$nativeObject._graphics.endFill();
    },
    enumerable: false
  },
  filters: { // @flash.display.DisplayObject
    get: function get$filters() { throw 'Not implemented: get$filters'; },
    set: function set$filters(value) { throw 'Not implemented: set$filters'; },
    enumerable: true
  },
  focusEnabled: {
    get: function get$focusEnabled() { throw 'Not implemented: get$focusEnabled'; },
    set: function set$focusEnabled(value) { throw 'Not implemented: set$focusEnabled'; },
    enumerable: true
  },
  _focusrect: {
    get: function get$_focusrect() { throw 'Not implemented: get$_focusrect'; },
    set: function set$_focusrect(value) { throw 'Not implemented: set$_focusrect'; },
    enumerable: true
  },
  forceSmoothing: {
    get: function get$forceSmoothing() { throw 'Not implemented: get$forceSmoothing'; },
    set: function set$forceSmoothing(value) { throw 'Not implemented: set$forceSmoothing'; },
    enumerable: true
  },
  _framesloaded: proxyNativeReadonlyProperty('_framesLoaded'),
  getBounds: {
    value: function getBounds(bounds) {
      var obj = bounds.$nativeObject;
      if (!obj)
        throw 'Unsupported bounds type';
      return this.$nativeObject.getBounds(obj);
    },
    enumerable: false
  },
  getBytesLoaded: {
    value: function getBytesLoaded() {
      var loaderInfo = this.$nativeObject.loaderInfo;
      return loaderInfo.bytesLoaded;
    },
    enumerable: false
  },
  getBytesTotal: {
    value: function getBytesTotal() {
      var loaderInfo = this.$nativeObject.loaderInfo;
      return loaderInfo.bytesTotal;
    },
    enumerable: false
  },
  getDepth: {
    value: function getDepth() {
      return this.$nativeObject._clipDepth;
    },
    enumerable: false
  },
  getInstanceAtDepth: {
    value: function getInstanceAtDepth(depth) {
      return this.$nativeObject._depthMap[depth];
    },
    enumerable: false
  },
  getNextHighestDepth: {
    value: function getNextHighestDepth() {
      return this.$nativeObject._depthMap.length;
    },
    enumerable: false
  },
  getRect: {
    value: function getRect(bounds) {
      throw 'Not implemented: getRect';
    },
    enumerable: false
  },
  getSWFVersion: {
    value: function getSWFVersion() {
      var loaderInfo = this.$nativeObject.loaderInfo;
      return loaderInfo.swfVersion;
    },
    enumerable: false
  },
  getTextSnapshot: {
    value: function getTextSnapshot() {
      throw 'Not implemented: getTextSnapshot';
    },
    enumerable: false
  },
  getURL: {
    value: function getURL(url, window, method) {
      var request = new AS2URLRequest(url);
      if (method)
        request.method = method;
      flash.net.navigateToURL(request, window);
    },
    enumerable: false
  },
  globalToLocal: {
    value: function globalToLocal(pt) {
      throw 'Not implemented: globalToLocal';
    },
    enumerable: false
  },
  gotoAndPlay: proxyNativeMethod('gotoAndPlay'),
  gotoAndStop: proxyNativeMethod('gotoAndStop'),
  _height: proxyNativeProperty('height'),
  _highquality: {
    get: function get$_highquality() { return 1; },
    set: function set$_highquality(value) { },
    enumerable: true
  },
  hitArea: {
    get: function get$hitArea() { throw 'Not implemented: get$hitArea'; },
    set: function set$hitArea(value) { throw 'Not implemented: set$hitArea'; },
    enumerable: true
  },
  hitTest: {
    value: function hitTest(x, y, shapeFlag) {
      if (x instanceof AS2MovieClip) {
        return this.$nativeObject.hitTestObject(x.$nativeObject);
      } else {
        return this.$nativeObject.hitTestPoint(x, y, shapeFlag);
      }
    },
    enumerable: false
  },
  lineGradientStyle: {
    value: function lineGradientStyle(fillType, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio) {
      this.$nativeObject._graphics.lineGradientStyle(fillType, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio);
    },
    enumerable: false
  },
  lineStyle: {
    value: function lineStyle(thickness, rgb, alpha, pixelHinting, noScale, capsStyle, jointStyle, miterLimit) {
      this.$nativeObject._graphics.lineStyle(thickness, rgb, alpha, pixelHinting, noScale, capsStyle, jointStyle, miterLimit);
    },
    enumerable: false
  },
  lineTo: {
    value: function lineTo(x, y) {
      this.$nativeObject._graphics.lineTo(x, y);
    },
    enumerable: false
  },
  loadMovie: {
    value: function loadMovie(url, method) {
      throw 'Not implemented: loadMovie';
    },
    enumerable: false
  },
  loadVariables: {
    value: function loadVariables(url, method) {
      throw 'Not implemented: loadVariables';
    },
    enumerable: false
  },
  localToGlobal: {
    value: function localToGlobal(pt) {
      var tmp = this.$nativeObject.localToGlobal(pt);
      pt.x = tmp.x;
      pt.y = tmp.y;
    },
    enumerable: false
  },
  _lockroot: {
    get: function get$_lockroot() { throw 'Not implemented: get$_lockroot'; },
    set: function set$_lockroot(value) { throw 'Not implemented: set$_lockroot'; },
    enumerable: true
  },
  menu: {
    get: function get$menu() { throw 'Not implemented: get$menu'; },
    set: function set$menu(value) { throw 'Not implemented: set$menu'; },
    enumerable: true
  },
  moveTo: {
    value: function moveTo(x, y) {
      this.$nativeObject._graphics.moveTo(x, y);
    },
    enumerable: false
  },
  _name: proxyNativeProperty('name'),
  nextFrame: proxyNativeMethod('nextFrame'),
  onData: proxyEventHandler('data'),
  onDragOut: proxyEventHandler('dragOut'),
  onDragOut: proxyEventHandler('dragOver'),
  onEnterFrame: proxyEventHandler('enterFrame'),
  onKeyDown: proxyEventHandler('keyDown'),
  onKeyUp: proxyEventHandler('keyUp'),
  onKillFocus: proxyEventHandler('focusOut', function(e) { return [e.relatedObject]; }),
  onLoad: proxyEventHandler('load'),
  onMouseDown: proxyEventHandler('mouseDown'),
  onMouseUp: proxyEventHandler('mouseUp'),
  onPress: proxyEventHandler('mouseDown'),
  onRelease: proxyEventHandler('mouseUp'),
  onReleaseOutside: proxyEventHandler('releaseOutside'),
  onRollOut: proxyEventHandler('rollOut'),
  onRollOver: proxyEventHandler('rollOver'),
  onSetFocus: proxyEventHandler('focusIn', function(e) { return [e.relatedObject]; }),
  onUnload: proxyEventHandler('unload'),
  opaqueBackground: proxyNativeProperty('opaqueBackground'),
  _parent: { // @flash.display.DisplayObject
    get: function get$_parent() { return getAS2Object(this.$nativeObject.parent); },
    set: function set$_parent(value) { throw 'Not implemented: set$_parent'; },
    enumerable: true
  },
  play: proxyNativeMethod('play'),
  prevFrame: proxyNativeMethod('prevFrame'),
  _quality: { // @flash.display.Stage
    get: function get$_quality() { return 'HIGH'; },
    set: function set$_quality(value) { },
    enumerable: true
  },
  removeMovieClip: {
    value: function removeMovieClip() {
      var parent = this._parent.$nativeObject;
      parent.removeChild(this.$nativeObject);
    },
    enumerable: false
  },
  _rotation: proxyNativeProperty('rotation'),
  scale9Grid: { // @flash.display.DisplayObject
    get: function get$scale9Grid() { throw 'Not implemented: get$scale9Grid'; },
    set: function set$scale9Grid(value) { throw 'Not implemented: set$scale9Grid'; },
    enumerable: true
  },
  scrollRect: {
    get: function get$scrollRect() { throw 'Not implemented: get$scrollRect'; },
    set: function set$scrollRect(value) { throw 'Not implemented: set$scrollRect'; },
    enumerable: true
  },
  setMask: {
    value: function setMask(mc) {
      throw 'Not implemented: setMask';
    },
    enumerable: false
  },
  _soundbuftime: {
    get: function get$_soundbuftime() { throw 'Not implemented: get$_soundbuftime'; },
    set: function set$_soundbuftime(value) { throw 'Not implemented: set$_soundbuftime'; },
    enumerable: true
  },
  startDrag: {
    value: function startDrag(lock, left, top, right, bottom) {
      this.$nativeObject.startDrag(lock, arguments.length < 3 ? null :
        new AS2Rectangle(left, top, right - left, bottom - top));
    },
    enumerable: false
  },
  stop: proxyNativeMethod('stop'),
  stopDrag: proxyNativeMethod('stopDrag'),
  swapDepths: {
    value: function swapDepths(target) {
      throw 'Not implemented: swapDepths';
    },
    enumerable: false
  },
  tabChildren: proxyNativeProperty('tabChildren'),
  tabEnabled: proxyNativeProperty('tabEnabled'),
  tabIndex: proxyNativeProperty('tabIndex'),
  _target: {
    get: function get$_target() {
      var nativeObject = this.$nativeObject;
      if (nativeObject === nativeObject.root) {
        return '/';
      }
      var path = '';
      do {
        path = '/' + nativeObject.name + path;
        nativeObject = nativeObject.parent;
      } while (nativeObject !== nativeObject.root);
      return path;
    },
    enumerable: true
  },
  _totalframes: proxyNativeReadonlyProperty('totalFrames'),
  trackAsMenu: {
    get: function get$trackAsMenu() { throw 'Not implemented: get$trackAsMenu'; },
    set: function set$trackAsMenu(value) { throw 'Not implemented: set$trackAsMenu'; },
    enumerable: true
  },
  transform: {
    get: function get$transform() { throw 'Not implemented: get$transform'; },
    set: function set$transform(value) { throw 'Not implemented: set$transform'; },
    enumerable: true
  },
  toString: proxyNativeMethod('toString'),
  unloadMovie: {
    value: function unloadMovie() {
      var nativeObject = this.$nativeObject;
      // TODO remove movie clip content
      nativeObject.stop();
    },
    enumerable: false
  },
  _url: {
    get: function get$_url() { throw 'Not implemented: get$_url'; },
    enumerable: true
  },
  useHandCursor: proxyNativeProperty('useHandCursor'),
  _visible: {
    get: function get$_visible() { return this.$nativeObject.visible; },
    set: function set$_visible(value) { this.$nativeObject.visible = !!+value; },
    enumerable: true
  },
  _width: proxyNativeProperty('width'),
  _x: proxyNativeProperty('x'),
  _xmouse: proxyNativeReadonlyProperty('mouseX'),
  _xscale: proxyNativeProperty('scaleX'),
  _y: proxyNativeProperty('y'),
  _ymouse: proxyNativeReadonlyProperty('mouseY'),
  _yscale: proxyNativeProperty('scaleY'),
});

function AS2Button() {
}
AS2Button.prototype = Object.create(Object.prototype, {
  $nativeObject: {
    value: null,
    writable: true
  },
  $attachNativeObject: {
    value: function attachNativeObject(nativeButton) {
      this.$nativeObject = nativeButton;
      nativeButton.$as2Object = this;
    },
    enumerable: false
  },
  _alpha: { // @flash.display.DisplayObject
    get: function get$_alpha() { return this.$nativeObject.alpha; },
    set: function set$_alpha(value) { this.$nativeObject.alpha = value; },
    enumerable: true
  },
  blendMode: { // @flash.display.DisplayObject
    get: function get$blendMode() { return this.$nativeObject.blendMode; },
    set: function set$blendMode(value) { this.$nativeObject.blendMode = value; },
    enumerable: true
  },
  cacheAsBitmap: { // @flash.display.DisplayObject
    get: function get$cacheAsBitmap() { return this.$nativeObject.cacheAsBitmap; },
    set: function set$cacheAsBitmap(value) { this.$nativeObject.cacheAsBitmap = value; },
    enumerable: true
  },
  enabled: { // @flash.display.SimpleButton
    get: function get$enabled() { return this.$nativeObject.enabled; },
    set: function set$enabled(value) { this.$nativeObject.enabled = value; },
    enumerable: true
  },
  filters: {
    get: function get$filters() { throw 'Not implemented: get$filters'; },
    set: function set$filters(value) { throw 'Not implemented: set$filters'; },
    enumerable: true
  },
  _focusrect: {
    get: function get$_focusrect() { throw 'Not implemented: get$_focusrect'; },
    set: function set$_focusrect(value) { throw 'Not implemented: set$_focusrect'; },
    enumerable: true
  },
  getDepth: {
    value: function getDepth() {
      throw 'Not implemented: getDepth';
    },
    enumerable: false
  },
  _height: { // @flash.display.DisplayObject
    get: function get$_height() { return this.$nativeObject.height; },
    set: function set$_height(value) { this.$nativeObject.height = value; },
    enumerable: true
  },
  _highquality: {
    get: function get$_highquality() { return 1; },
    set: function set$_highquality(value) { },
    enumerable: true
  },
  menu: {
    get: function get$menu() { throw 'Not implemented: get$menu'; },
    set: function set$menu(value) { throw 'Not implemented: set$menu'; },
    enumerable: true
  },
  _name: { // @flash.display.DisplayObject
    get: function get$_name() { return this.$nativeObject.name; },
    set: function set$_name(value) { this.$nativeObject.name = value; },
    enumerable: true
  },
  onDragOut: proxyEventHandler('dragOut'),
  onDragOut: proxyEventHandler('dragOver'),
  onKeyDown: proxyEventHandler('keyDown'),
  onKeyUp: proxyEventHandler('keyUp'),
  onKillFocus: proxyEventHandler('focusOut', function(e) { return [e.relatedObject]; }),
  onPress: proxyEventHandler('mouseDown'),
  onRelease: proxyEventHandler('mouseUp'),
  onReleaseOutside: proxyEventHandler('releaseOutside'),
  onRollOut: proxyEventHandler('rollOut'),
  onRollOver: proxyEventHandler('rollOver'),
  onSetFocus: proxyEventHandler('focusIn', function(e) { return [e.relatedObject]; }),
  _parent: { // @flash.display.DisplayObject
    get: function get$_parent() { return getAS2Object(this.$nativeObject.parent); },
    set: function set$_parent(value) { throw 'Not implemented: set$_parent'; },
    enumerable: true
  },
  _quality: {
    get: function get$_quality() { return 'HIGH'; },
    set: function set$_quality(value) { },
    enumerable: true
  },
  _rotation: { // @flash.display.DisplayObject
    get: function get$_rotation() { return this.$nativeObject.rotation; },
    set: function set$_rotation(value) { this.$nativeObject.rotation = value; },
    enumerable: true
  },
  scale9Grid: { // @flash.display.DisplayObject
    get: function get$scale9Grid() { throw 'Not implemented: get$scale9Grid'; },
    set: function set$scale9Grid(value) { throw 'Not implemented: set$scale9Grid'; },
    enumerable: true
  },
  _soundbuftime: {
    get: function get$_soundbuftime() { throw 'Not implemented: get$_soundbuftime'; },
    set: function set$_soundbuftime(value) { throw 'Not implemented: set$_soundbuftime'; },
    enumerable: true
  },
  tabEnabled: { // @flash.display.InteractiveObject
    get: function get$tabEnabled() { return this.$nativeObject.tabEnabled; },
    set: function set$tabEnabled(value) { this.$nativeObject.tabEnabled = value; },
    enumerable: true
  },
  tabIndex: { // @flash.display.InteractiveObject
    get: function get$tabIndex() { return this.$nativeObject.tabIndex; },
    set: function set$tabIndex(value) { return this.$nativeObject.tabIndex = value; },
    enumerable: true
  },
  _target: {
    get: function get$_target() { throw 'Not implemented: get$_target'; },
    enumerable: true
  },
  trackAsMenu: {
    get: function get$trackAsMenu() { throw 'Not implemented: get$trackAsMenu'; },
    set: function set$trackAsMenu(value) { throw 'Not implemented: set$trackAsMenu'; },
    enumerable: true
  },
  _url: {
    get: function get$_url() { throw 'Not implemented: get$_url'; },
    enumerable: true
  },
  useHandCursor: {
    get: function get$useHandCursor() { throw 'Not implemented: get$useHandCursor'; },
    set: function set$useHandCursor(value) { throw 'Not implemented: set$useHandCursor'; },
    enumerable: true
  },
  _visible: { // @flash.display.DisplayObject
    get: function get$_visible() { return this.$nativeObject.visible; },
    set: function set$_visible(value) { this.$nativeObject.visible = !!+value; },
    enumerable: true
  },
  _width: { // @flash.display.DisplayObject
    get: function get$_width() { return this.$nativeObject.width; },
    set: function set$_width(value) { this.$nativeObject.width = value; },
    enumerable: true
  },
  _x: {
    get: function get$_x() { return this.$nativeObject.x; },
    set: function set$_x(value) { this.$nativeObject.x = value; },
    enumerable: true
  },
  _xmouse: { // @flash.display.DisplayObject
    get: function get$_xmouse() { return this.$nativeObject.mouseX; },
    enumerable: true
  },
  _xscale: { // @flash.display.DisplayObject
    get: function get$_xscale() { return this.$nativeObject.scaleX; },
    set: function set$_xscale(value) { this.$nativeObject.scaleX = value; },
    enumerable: true
  },
  _y: { // @flash.display.DisplayObject
    get: function get$_y() { return this.$nativeObject.y; },
    set: function set$_y(value) { this.$nativeObject.y = value; },
    enumerable: true
  },
  _ymouse: { // @flash.display.DisplayObject
    get: function get$_ymouse() { return this.$nativeObject.mouseY; },
    enumerable: true
  },
  _yscale: { // @flash.display.DisplayObject
    get: function get$_yscale() { return this.$nativeObject.scaleY; },
    set: function set$_yscale(value) { this.$nativeObject.scale = value; },
    enumerable: true
  }
});

function AS2TextField() {
}
AS2TextField.prototype = Object.create(Object.prototype, {
  $nativeObject: {
    value: null,
    writable: true
  },
  $attachNativeObject: {
    value: function attachNativeObject(nativeButton) {
      this.$nativeObject = nativeButton;
      nativeButton.$as2Object = this;
    },
    enumerable: false
  },
  _alpha: { // @flash.display.DisplayObject
    get: function get$_alpha() { return this.$nativeObject.alpha; },
    set: function set$_alpha(value) { this.$nativeObject.alpha = value; },
    enumerable: true
  },
  antiAliasType: { // @flash.text.TextField
    get: function get$antiAliasType() { return this.$nativeObject.antiAliasType; },
    set: function set$antiAliasType(value) { this.$nativeObject.antiAliasType = value; },
    enumerable: true
  },
  autoSize: { // @flash.text.TextField
    get: function get$autoSize() { return this.$nativeObject.autoSize; },
    set: function set$autoSize(value) { this.$nativeObject.autoSize = value; },
    enumerable: true
  },
  background: { // @flash.text.TextField
    get: function get$background() { return this.$nativeObject.background; },
    set: function set$background(value) { this.$nativeObject.background = value; },
    enumerable: true
  },
  backgroundColor: { // @flash.text.TextField
    get: function get$backgroundColor() { return this.$nativeObject.backgroundColor; },
    set: function set$backgroundColor(value) { this.$nativeObject.backgroundColor = value; },
    enumerable: true
  },
  border: { // @flash.text.TextField
    get: function get$border() { return this.$nativeObject.border; },
    set: function set$bborder(value) { this.$nativeObject.border = value; },
    enumerable: true
  },
  borderColor: { // @flash.text.TextField
    get: function get$borderColor() { return this.$nativeObject.borderColor; },
    set: function set$borderColor(value) { this.$nativeObject.borderColor = value; },
    enumerable: true
  },
  bottomScroll: { // @flash.text.TextField
    get: function get$bottomScroll() { return this.$nativeObject.bottomScrollV; },
    enumerable: true
  },
  condenseWhite: { // @flash.text.TextField
    get: function get$condenseWhite() { return this.$nativeObject.condenseWhite; },
    set: function set$condenseWhite(value) { this.$nativeObject.condenseWhite = value; },
    enumerable: true
  },
  embedFonts: { // @flash.text.TextField
    get: function get$embedFonts() { return this.$nativeObject.embedFonts; },
    set: function set$embedFonts(value) { this.$nativeObject.embedFonts = value; },
    enumerable: true
  },
  getNewTextFormat: {
    value: function getNewTextFormat() {
      return this.$nativeObject.defaultTextFormat;
    },
    enumerable: true
  },
  getTextFormat: proxyNativeMethod('getTextFormat'),
  _height: { // @flash.display.DisplayObject
    get: function get$_height() { return this.$nativeObject.height; },
    set: function set$_height(value) { this.$nativeObject.height = value; },
    enumerable: true
  },
  _highquality: {
    get: function get$_highquality() { return 1; },
    set: function set$_highquality(value) {  },
    enumerable: true
  },
  hscroll: { // @flash.text.TextField
    get: function get$embedFonts() { return this.$nativeObject.embedFonts; },
    set: function set$embedFonts(value) { this.$nativeObject.embedFonts = value; },
    enumerable: true
  },
  html: { // @flash.text.TextField
    get: function get$embedFonts() { throw 'Not implemented: get$_html'; },
    set: function set$embedFonts(value) { throw 'Not implemented: set$_html'; },
    enumerable: true
  },
  htmlText: { // @flash.text.TextField
    get: function get$htmlText() { return this.$nativeObject.htmlText; },
    set: function set$htmlText(value) { this.$nativeObject.htmlText = value; },
    enumerable: true
  },
  length: { // @flash.text.TextField
    get: function get$length() { return this.$nativeObject.length; },
    enumerable: true
  },
  maxChars: {
    get: function get$maxChars() { return this.$nativeObject.maxChars; },
    set: function set$maxChars(value) { this.$nativeObject.maxChars = value; },
    enumerable: true
  },
  maxhscroll: {
    get: function get$maxhscroll() { return this.$nativeObject.maxScrollH; },
    enumerable: true
  },
  maxscroll: {
    get: function get$maxscroll() { return this.$nativeObject.maxScrollV; },
    enumerable: true
  },
  multiline: {
    get: function get$multiline() { return this.$nativeObject.multiline; },
    set: function set$multiline(value) { this.$nativeObject.multiline = value; },
    enumerable: true
  },
  _name: { // @flash.display.DisplayObject
    get: function get$_name() { return this.$nativeObject.name; },
    set: function set$_name(value) { this.$nativeObject.name = value; },
    enumerable: true
  },
  onDragOut: proxyEventHandler('dragOut'),
  onDragOut: proxyEventHandler('dragOver'),
  onKeyDown: proxyEventHandler('keyDown'),
  onKeyUp: proxyEventHandler('keyUp'),
  onKillFocus: proxyEventHandler('focusOut', function(e) { return [e.relatedObject]; }),
  onPress: proxyEventHandler('mouseDown'),
  onRelease: proxyEventHandler('mouseUp'),
  onReleaseOutside: proxyEventHandler('releaseOutside'),
  onRollOut: proxyEventHandler('rollOut'),
  onRollOver: proxyEventHandler('rollOver'),
  onSetFocus: proxyEventHandler('focusIn', function(e) { return [e.relatedObject]; }),
  _parent: { // @flash.display.DisplayObject
    get: function get$_parent() { return getAS2Object(this.$nativeObject.parent); },
    set: function set$_parent(value) { throw 'Not implemented: set$_parent'; },
    enumerable: true
  },
  password: {
    get: function get$password() { return this.$nativeObject.displayAsPassword; },
    set: function set$password(value) { this.$nativeObject.displayAsPassword = value; },
    enumerable: true
  },
  _quality: {
    get: function get$_quality() { return 'HIGH'; },
    set: function set$_quality(value) { },
    enumerable: true
  },
  _rotation: { // @flash.display.DisplayObject
    get: function get$_rotation() { return this.$nativeObject.rotation; },
    set: function set$_rotation(value) { this.$nativeObject.rotation = value; },
    enumerable: true
  },
  scroll: { // @flash.display.TextField
    get: function get$scroll() { return this.$nativeObject.scrollV; },
    set: function set$scroll(value) { this.$nativeObject.rotation = value; },
    enumerable: true
  },
  selectable: { // @flash.display.TextField
    get: function get$selectable() { return this.$nativeObject.selectable; },
    set: function set$selectable(value) { this.$nativeObject.selectable = value; },
    enumerable: true
  },
  setNewTextFormat: {
    value: function setNewTextFormat(tf) {
      this.$nativeObject.defaultTextFormat = tf;
    },
    enumerable: true
  },
  setTextFormat: proxyNativeMethod('setTextFormat'),
  _soundbuftime: {
    get: function get$_soundbuftime() { throw 'Not implemented: get$_soundbuftime'; },
    set: function set$_soundbuftime(value) { throw 'Not implemented: set$_soundbuftime'; },
    enumerable: true
  },
  tabEnabled: { // @flash.display.InteractiveObject
    get: function get$tabEnabled() { return this.$nativeObject.tabEnabled; },
    set: function set$tabEnabled(value) { this.$nativeObject.tabEnabled = value; },
    enumerable: true
  },
  tabIndex: { // @flash.display.InteractiveObject
    get: function get$tabIndex() { return this.$nativeObject.tabIndex; },
    set: function set$tabIndex(value) { return this.$nativeObject.tabIndex = value; },
    enumerable: true
  },
  _target: {
    get: function get$_target() { throw 'Not implemented: get$_target'; },
    enumerable: true
  },
  text: { // @flash.display.TextField
    get: function get$text() { return this.$nativeObject.text; },
    set: function set$text(value) { this.$nativeObject.text = value; },
    enumerable: true
  },
  textColor: { // @flash.display.TextField
    get: function get$textColort() { return this.$nativeObject.textColor; },
    set: function set$textColor(value) { this.$nativeObject.textColor = value; },
    enumerable: true
  },
  textHeight: { // @flash.display.TextField
    get: function get$textHeight() { return this.$nativeObject.textHeight; },
    set: function set$textHeight(value) { this.$nativeObject.textHeight = value; },
    enumerable: true
  },
  textWidth: { // @flash.display.TextField
    get: function get$textWidth() { return this.$nativeObject.textWidth; },
    set: function set$textWidth(value) { this.$nativeObject.textWidth = value; },
    enumerable: true
  },
  type: { // @flash.display.TextField
    get: function get$type() { return this.$nativeObject.type; },
    set: function set$type(value) { this.$nativeObject.type = value; },
    enumerable: true
  },
  _url: {
    get: function get$_url() { throw 'Not implemented: get$_url'; },
    enumerable: true
  },
  variable: {
    get: function get$variable() { throw 'Not implemented: get$variable'; },
    set: function set$variable(value) { throw 'Not implemented: set$variable'; },
    enumerable: true
  },
  _visible: { // @flash.display.DisplayObject
    get: function get$_visible() { return this.$nativeObject.visible; },
    set: function set$_visible(value) { this.$nativeObject.visible = !!+value; },
    enumerable: true
  },
  _width: { // @flash.display.DisplayObject
    get: function get$_width() { return this.$nativeObject.width; },
    set: function set$_width(value) { this.$nativeObject.width = value; },
    enumerable: true
  },
  wordWrap: { // @flash.display.TextField
    get: function get$wordWrap() { return this.$nativeObject.wordWrap; },
    set: function set$wordWrap(value) { this.$nativeObject.wordWrap = value; },
    enumerable: true
  },
  _x: {
    get: function get$_x() { return this.$nativeObject.x; },
    set: function set$_x(value) { this.$nativeObject.x = value; },
    enumerable: true
  },
  _xmouse: { // @flash.display.DisplayObject
    get: function get$_xmouse() { return this.$nativeObject.mouseX; },
    enumerable: true
  },
  _xscale: { // @flash.display.DisplayObject
    get: function get$_xscale() { return this.$nativeObject.scaleX; },
    set: function set$_xscale(value) { this.$nativeObject.scaleX = value; },
    enumerable: true
  },
  _y: { // @flash.display.DisplayObject
    get: function get$_y() { return this.$nativeObject.y; },
    set: function set$_y(value) { this.$nativeObject.y = value; },
    enumerable: true
  },
  _ymouse: { // @flash.display.DisplayObject
    get: function get$_ymouse() { return this.$nativeObject.mouseY; },
    enumerable: true
  },
  _yscale: { // @flash.display.DisplayObject
    get: function get$_yscale() { return this.$nativeObject.scaleY; },
    set: function set$_yscale(value) { this.$nativeObject.scale = value; },
    enumerable: true
  }
});

function AS2Broadcaster() {
}
defineObjectProperties(AS2Broadcaster, {
  initialize: {
    value: function initialize(obj) {
      obj._listeners = [];
      obj.broadcastMessage = AS2Broadcaster.prototype.broadcastMessage;
      obj.addListener = AS2Broadcaster.prototype.addListener;
      obj.removeListener = AS2Broadcaster.prototype.removeListener;
    },
    enumerable: false
  }
});
AS2Broadcaster.prototype = Object.create(Object.prototype, {
  broadcastMessage: {
    value: function broadcastMessage(eventName) {
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0; i < this._listeners.length; i++) {
        var listener = this._listeners[i];
        if (!(eventName in listener))
          continue;
        listener[eventName].apply(listener, args);
      }
    },
    enumerable: false
  },
  addListener: {
    value: function addListener(listener) {
      this._listeners.push(listener);
    },
    enumerable: false
  },
  removeListener: {
    value: function removeListener(listener) {
      var i = this._listeners.indexOf(listener);
      if (i < 0)
        return;
      this._listeners.splice(i, 1);
    },
    enumerable: false
  }
});

// TODO TextField
// TODO MovieClipLoader

function AS2Key() {}
defineObjectProperties(AS2Key, {
  DOWN: createConstant(40),
  LEFT: createConstant(37),
  RIGHT: createConstant(39),
  UP: createConstant(38),
  $keyStates: {
    value: [],
    writable: false,
    enumerable: false
  },
  $lastKeyCode: {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: false
  },
  $bind: {
    value: function $bind(stage) {
      stage.addEventListener('keyDown', function(e) {
        AS2Key.$lastKeyCode = e.keyCode;
        AS2Key.$keyStates[e.keyCode] = 1;
        AS2Key.broadcastMessage('onKeyDown');
      }, false);
      stage.addEventListener('keyUp', function(e) {
        AS2Key.$lastKeyCode = e.keyCode;
        delete AS2Key.$keyStates[e.keyCode];
        AS2Key.broadcastMessage('onKeyUp');
      }, false);
    },
    enumerable: false
  },
  isDown: {
    value: function isDown(code) {
      return !!AS2Key.$keyStates[code];
    }
  }
});
AS2Broadcaster.initialize(AS2Key);

function AS2Mouse() {}
defineObjectProperties(AS2Mouse, {
  $lastX: {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: false
  },
  $lastY: {
    value: 0,
    writable: true,
    configurable: true,
    enumerable: false
  },
  $bind: {
    value: function $bind(stage) {

      function updateMouseState(e) {
        var state = stage._canvasState;
        if (!state)
          return;

        var mouseX = e.clientX, mouseY = e.clientY;
        for (var p = state.canvas; p; p = p.offsetParent) {
          mouseX -= p.offsetLeft;
          mouseY -= p.offsetTop;
        }
        AS2Mouse.$lastX = (mouseX - state.offsetX) / state.scale;
        AS2Mouse.$lastY = (mouseY - state.offsetY) / state.scale;
      }

      stage.addEventListener('mousedown', function(e) {
        updateMouseState(e);
        AS2Mouse.broadcastMessage('onMouseDown');
      }, false);
      stage.addEventListener('mousemove', function(e) {
        updateMouseState(e);
        AS2Mouse.broadcastMessage('onMouseMove');
      }, false);
      stage.addEventListener('mouseout', function(e) {
        updateMouseState(e);
        AS2Mouse.broadcastMessage('onMouseMove');
      }, false);
      stage.addEventListener('mouseup', function(e) {
        updateMouseState(e);
        AS2Mouse.broadcastMessage('onMouseUp');
      }, false);
    },
    enumerable: false
  },
  hide: {
    value: function hide() {
      Mouse.hide();
    },
    enumerable: false
  },
  show: {
    value: function show() {
      Mouse.show();
    },
    enumerable: false
  }
});
AS2Broadcaster.initialize(AS2Mouse);

function AS2Stage() {
}
defineObjectProperties(AS2Stage, {
  $stage: {
    get: function get$stage() {
      return AS2Context.instance.stage;
    }
  },
  align: {
    get: function get$align() {
      return this.$stage.align;
    },
    set: function set$align(value) {
      this.$stage.align = value;
    },
    enumerable: true
  },
  displayState: {
    get: function get$displayState() {
      return this.$stage.displayState;
    },
    set: function set$displayState(value) {
      this.$stage.displayState = value;
    },
    enumerable: true
  },
  fullScreenSourceRect: {
    get: function get$fullScreenSourceRect() {
      return this.$stage.fullScreenSourceRect;
    },
    set: function set$fullScreenSourceRect(value) {
      this.$stage.fullScreenSourceRect = value;
    },
    enumerable: true
  },
  height: {
    get: function get$height() {
      return this.$stage.stageHeight;
    },
    enumerable: true
  },
  scaleMode: {
    get: function get$scaleMode() {
      return this.$stage.scaleMode;
    },
    set: function set$scaleMode(value) {
      this.$stage.scaleMode = value;
    },
    enumerable: true
  },
  showMenu: {
    get: function get$showMenu() {
      return this.$stage.showDefaultContextMenu;
    },
    set: function set$showMenu(value) {
      this.$stage.showDefaultContextMenu = value;
    },
    enumerable: true
  },
  width: {
    get: function get$width() {
      return this.$stage.stageWidth;
    },
    enumerable: true
  }
});
AS2Broadcaster.initialize(AS2Stage);

function AS2Rectangle(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}
AS2Rectangle.prototype = Object.create(Object.prototype, {
  // TODO methods
});

var AS2System = Object.create(Object.prototype, {
  capabilities: {
    get: function get$capabilities() {
      return avm2.systemDomain.getClass("flash.system.Capabilities");
    }
  }
});

// Built-in classes modifications

defineObjectProperties(Object.prototype, {
  watch: {
    get: function watch() { throw 'Not implemented: watch'; },
    enumerable: false
  },
  unwatch: {
    get: function unwatch() { throw 'Not implemented: unwatch'; },
    enumerable: false
  },
  addProperty: {
    value: function addProperty(name, getter, setter) {
      if (typeof name !== 'string' || name === '')
        return false;
      if (typeof getter !== 'function')
        return false;
      if (typeof setter !== 'function' && setter !== null)
        return false;
      Object.defineProperty(this, name, {
        get: getter,
        set: setter || void(0),
        configurable: true,
        enumerable: true
      });
      return true;
    },
    enumerable: false
  },
  registerClass: {
    value: function registerClass() { throw 'Not implemented: registerClass'; },
    enumerable: false
  }
});

defineObjectProperties(Array, {
  CASEINSENSITIVE: createConstant(1),
  DESCENDING: createConstant(2),
  UNIQUESORT: createConstant(4),
  RETURNINDEXEDARRAY: createConstant(8),
  NUMERIC: createConstant(16)
});
defineObjectProperties(Array.prototype, {
  sort: {
    value: (function() {
      var originalSort = Array.prototype.sort;
      return (function sort(compareFunction, options) {
        if (arguments.length <= 1 && typeof compareFunction !== 'number')
          return originalSort.apply(this, arguments);
        if (typeof compareFunction === 'number') {
          options = compareFunction;
          compareFunction = null;
        }
        var subject = !!(options & Array.UNIQUESORT) || !!(options & Array.RETURNINDEXEDARRAY) ?
          this.slice(0) : this;
        if (options & Array.CASEINSENSITIVE) {
          compareFunction = (function(x, y) {
            var valueX = String(x).toLowerCase();
            var valueY = String(y).toLowerCase();
            return valueX < valueY ? -1 : valueX == valueY ? 0 : 1;
          });
        }
        if (options & Array.NUMERIC) {
          compareFunction = (function(x, y) {
            var result = x - y;
            return result < 0 ? -1 : result > 0 ? 1 : 0;
          });
        }
        originalSort.call(subject, compareFunction);
        if (options & Array.UNIQUESORT) {
          var i;
          for (i = 1; i < subject.length; ++i) {
            if (subject[i - 1] !== subject[i])
              return; // keeping array unmodified
          }
          for (i = 0; i < subject.length; ++i)
            this[i] = subject[i];
          subject = this;
        }
        if (options.DESCENDING)
          subject.reverse();
        return subject;
      });
    })(),
    enumerable: false
  },
  sortOn: {
    value: function sortOn(fieldName, options) {
      var comparer;
      if (options & Array.NUMERIC) {
        comparer = (function(x, y) {
          var valueX = Number(x[fieldName]);
          var valueY = Number(y[fieldName]);
          return valueX < valueY ? -1 : valueX == valueY ? 0 : 1;
        });
      } else if (options & Array.CASEINSENSITIVE) {
        comparer = (function(x, y) {
          var valueX = String(x[fieldName]).toLowerCase();
          var valueY = String(y[fieldName]).toLowerCase();
          return valueX < valueY ? -1 : valueX == valueY ? 0 : 1;
        });
      } else {
        comparer = (function(x, y) {
          var valueX = String(x[fieldName]);
          var valueY = String(y[fieldName]);
          return valueX < valueY ? -1 : valueX == valueY ? 0 : 1;
        });
      }
      return arguments.length <= 1 ? this.sort(comparer) :
        this.sort(comparer, options & ~(Array.NUMERIC | Array.CASEINSENSITIVE));
    },
    enumerable: false
  }
});

function createBuiltinType(obj, args) {
  if (obj === Array) {
    // special case of array
    var result = args;
    if (args.length == 1 && typeof args[0] === 'number') {
      result = [];
      result.length = args[0];
    }
    return result;
  }
  if (obj === Boolean || obj === Number ||
      obj === String || obj === Function)
    return obj.apply(null, args);
  if (obj === Date) {
    switch (args.length) {
      case 0:
        return new Date();
      case 1:
        return new Date(args[0]);
      default:
        return new Date(args[0], args[1],
          args.length > 2 ? args[2] : 1,
          args.length > 3 ? args[3] : 0,
          args.length > 4 ? args[4] : 0,
          args.length > 5 ? args[5] : 0,
          args.length > 6 ? args[6] : 0);
    }
  }
  if (obj === Object)
    return {};
}

// exports for testing
if (typeof GLOBAL !== 'undefined') {
  GLOBAL.AS2MovieClip = AS2MovieClip;
  GLOBAL.AS2Button = AS2Button;
  GLOBAL.AS2TextField = AS2TextField;
  GLOBAL.AS2Broadcaster = AS2Broadcaster;
  GLOBAL.AS2Key = AS2Key;
  GLOBAL.AS2Mouse = AS2Mouse;
  GLOBAL.AS2Stage = AS2Stage;
  GLOBAL.AS2Rectangle = AS2Rectangle;
  GLOBAL.AS2System = AS2System;
  GLOBAL.createBuiltinType = createBuiltinType;
}
