function Loader() {
  if (Loader.BASE_CLASS)
    Loader.BASE_CLASS.call(this);

  this._contentLoaderInfo = null;
  this._dictionary = { };
  this._symbols = { };
  this._timeline = [];
}

Loader.BASE_CLASS = null;
Loader.LOADER_PATH = './Loader.js';
Loader.BUILTIN_PATH = '../../src/avm2/generated/builtin/builtin.abc';
Loader.PLAYER_GLOBAL_PATH = '../../src/flash/playerGlobal.min.abc';
Loader.WORKERS_ENABLED = true;
Loader.WORKER_SCRIPTS = [
  '../../../lib/DataView.js/DataView.js',

  '../util.js',

  '../../swf/util.js',
  '../../swf/swf.js',
  '../../swf/types.js',
  '../../swf/structs.js',
  '../../swf/tags.js',
  '../../swf/inflate.js',
  '../../swf/stream.js',
  '../../swf/templates.js',
  '../../swf/generator.js',
  '../../swf/parser.js',
  '../../swf/bitmap.js',
  '../../swf/button.js',
  '../../swf/font.js',
  '../../swf/image.js',
  '../../swf/label.js',
  '../../swf/shape.js',
  '../../swf/text.js'
];

if (typeof window === 'undefined') {
  importScripts.apply(null, Loader.WORKER_SCRIPTS);

  self.onmessage = function (evt) {
    var loader = new Loader;
    loader.loadFrom(loader, evt.data);
  };
} else {
  var head = document.head;
  head.insertBefore(document.createElement('style'), head.firstChild);
  var style = document.styleSheets[0];

  Loader.BASE_CLASS = DisplayObjectContainer;
}

Loader.prototype = Object.create((Loader.BASE_CLASS || Object).prototype, {
  __class__: describeInternalProperty('flash.display.Loader'),

  content: describeAccessor(function () {
    return this._content;
  }),
  contentLoaderInfo: describeAccessor(function () {
    var loaderInfo = this._contentLoaderInfo;
    if (!loaderInfo) {
      loaderInfo = new LoaderInfo;
      loaderInfo._loader = this;
      this._contentLoaderInfo = loaderInfo;
    }
    return loaderInfo;
  }),
  createSymbolClass: describeMethod(function (baseClass, props) {
    var symbolClass = function () {
      var scriptClass = this._avm2.applicationDomain.getProperty(
        Multiname.fromSimpleName('public ' + this.__class__),
        true,
        true
      );
      scriptClass.createInstanceWithBoundNative(this, true);
    };
    symbolClass.prototype = Object.create(new baseClass, props || { });

    return symbolClass;
  }),
  uncaughtErrorEvents: describeAccessor(function () {
    notImplemented();
  }),

  addChild: describeMethod(function (child) {
    illegalOperation();
  }),
  addChildAt: describeMethod(function (child, index) {
    illegalOperation();
  }),
  close: describeMethod(function () {
    notImplemented();
  }),
  commitData: describeMethod(function (data) {
    if (typeof window === 'undefined') {
      self.postMessage(data);
      return;
    }

    var loaderInfo = this.contentLoaderInfo;

    loaderInfo.dispatchEvent(new Event(Event.PROGRESS));

    if (!this._dictionary[0]) {
      this.setup(data);
    } else if (data) {
      if (data.id)
        this.commitSymbol(data);
      else if (data.type === 'frame')
        this.commitFrame(data);
    } else {
      loaderInfo.dispatchEvent(new Event(Event.COMPLETE));
    }
  }),
  commitFrame: describeMethod(function (frame) {
    var abcBlocks = frame.abcBlocks;
    var depths = frame.depths;
    var exports = frame.exports;
    var loader = this;
    var dictionary = loader._dictionary;
    var displayList = Object.create(null);
    var loaderInfo = loader.contentLoaderInfo;
    var timeline = loader._timeline;
    var frameNum = timeline.length + 1;
    var framePromise = new Promise;
    var labelName = frame.labelName;
    var prevPromise = frameNum > 1 ? timeline[frameNum - 2] : dictionary[0];
    var promiseQueue = [prevPromise];

    if (depths) {
      for (var depth in depths) {
        var cmd = depths[depth];
        if (cmd && cmd.symbolId) {
          var symbolPromise = dictionary[cmd.symbolId];
          if (symbolPromise && !symbolPromise.resolved)
            promiseQueue.push(symbolPromise);
        }
        displayList[depth] = cmd;
      }
    }

    if (exports) {
      for (var i = 0, n = exports.length; i < n; i++) {
        var asset = exports[i];
        var className = asset.className;
        var symbolPromise = dictionary[asset.symbolId];
        if (symbolClass) {
          symbolPromise.then(function () {
            var symbolClass = symbolPromise.value;
            symbolClass.prototype.__class__ = className;
          });
        }
      }
    }

    if (frame.bgcolor)
      loaderInfo._backgroundColor = frame.bgcolor;

    Promise.when.apply(Promise, promiseQueue).then(function (val) {
      if (abcBlocks) {
        var appDomain = loader._avm2.applicationDomain;
        for (var i = 0, n = abcBlocks.length; i < n; i++) {
          var abc = new AbcFile(abcBlocks[i]);
          appDomain.executeAbc(abc);
        }
      }

      var root = loader._content;

      if (!root) {
        root = new val(loader._avm1);
        //root.name = '_root';
        //var globals = root._as2Context.globals;
        //globals._root = globals._level0 = root.$as2Object;

        loader._content = root;
      } else {
        displayList.__proto__ = val;
      }

      framePromise.resolve(displayList);
      root._framesLoaded++;

      if (labelName) {
        root._frameLabels[labelName] = {
          __class__: 'flash.display.FrameLabel',
          frame: frameNum,
          name: labelName
        };
      }

      if (frameNum === 1)
        loaderInfo.dispatchEvent(new Event(Event.INIT));
    });

    var i = frame.repeat || 1;
    while (i--)
      timeline.push(framePromise);
  }),
  commitSymbol: describeMethod(function (symbol) {
    var dictionary = this._dictionary;
    var promiseQueue = [];
    var require = symbol.require;
    var symbolClass = null;
    var symbolPromise = new Promise;

    if (require && require.length) {
      for (var i = 0, n = require.length; i < n; i++) {
        var symbolId = require[i];
        var symbolPromise = dictionary[symbolId];
        if (symbolPromise && !symbolPromise.resolved)
          promiseQueue.push(symbolPromise);
      }
    }

    switch (symbol.type) {
    case 'button':
      symbolClass = this.createSymbolClass(SimpleButton);
      break;
    case 'font':
      var charset = fromCharCode.apply(null, symbol.codes);
      if (charset) {
        style.insertRule(
          '@font-face{' +
            'font-family:"' + symbol.name + '";' +
            'src:url(data:font/opentype;base64,' + btoa(symbol.data) + ')' +
          '}',
          style.cssRules.length
        );
        //var ctx = (document.createElement('canvas')).getContext('2d');
        //ctx.font = '1024px "' + symbol.name + '"';
        //var defaultWidth = ctx.measureText(charset).width;
        symbolClass = this.createSymbolClass(Font);
      }
      break;
    case 'image':
      var img = new Image;
      img.src = 'data:' + symbol.mimeType + ';base64,' + btoa(symbol.data);
      symbolClass = this.createSymbolClass(BitmapData, { img: describeProperty(img) });
      requirePromise = Promise.when(requirePromise);
      img.onload = function () {
        requirePromise.resolve();
      };
      break;
    case 'label':
      var drawFn = new Function('d,c,r', symbol.data);
      symbolClass = this.createSymbolClass(StaticText, {
        draw: describeMethod(function (c, r) {
          return drawFn.call(this, dictionary, c, r);
        })
      });
      break;
    case 'text':
      var drawFn = new Function('d,c,r', symbol.data);
      symbolClass = this.createSymbolClass(TextField, {
        draw: describeMethod(function (c, r) {
          return drawFn.call(this, dictionary, c, r);
        })
      });
      break;
    case 'shape':
      var bounds = symbol.bounds;
      var createGraphicsData = new Function('d,r', 'return ' + symbol.data);
      symbolClass = this.createSymbolClass(Shape, {
        graphics: describeAccessor(function () {
          throw Error();
        }),
        _bounds: describeProperty(new Rectangle(
          bounds.x / 20,
          bounds.y / 20,
          bounds.width / 20,
          bounds.height / 20
        ))
      });
      symbolClass.prototype._graphics.drawGraphicsData(createGraphicsData(dictionary, 0));
      break;
    case 'sprite':
      var displayList = null;
      var frameCount = symbol.frameCount;
      var frameLabels = { };
      var frames = symbol.frames;
      var timeline = [];

      for (var i = 0, n = frames.length; i < n; i++) {
        var frame = frames[i];
        var frameNum = i + 1;
        var framePromise = new Promise;
        var depths = frame.depth;

        displayList = Object.create(displayList);

        if (depths) {
          for (var depth in depths) {
            var cmd = depths[depth];
            if (cmd && cmd.symbolId) {
              var symbolPromise = dictionary[cmd.symbolId];
              if (symbolPromise && !symbolPromise.resolved)
                promiseQueue.push(symbolPromise);
            }
            displayList[depth] = cmd;
          }
        }

        if (frame.labelName) {
          frameLabels[frame.labelName] = {
            __class__: 'flash.display.FrameLabel',
            frame: frameNum,
            name: frame.labelName
          };
        }

        var j = frame.repeat || 1;
        while (j--)
          timeline.push(framePromise);

        framePromise.resolve(displayList);
      }

      symbolClass = this.createSymbolClass(MovieClip, {
        graphics: describeAccessor(function () {
          throw Error();
        }),
        _children: describeLazyProperty('_children', function () {
          return [];
        }),
        _timeline: describeProperty(timeline),
        _framesLoaded: describeProperty(frameCount),
        _frameLabels: describeProperty(frameLabels),
        _totalFrames: describeProperty(frameCount)
      });
      break;
    }

    dictionary[symbol.id] = symbolPromise;
    Promise.when.apply(Promise, promiseQueue).then(function () {
      symbolPromise.resolve(symbolClass);
    });
  }),
  defineSymbol: describeMethod(function (swfTag) {
    var loader = this;
    var symbol;
    var symbols = this._symbols;

    switch (swfTag.code) {
    case SWF_TAG_CODE_DEFINE_BITS:
    case SWF_TAG_CODE_DEFINE_BITS_JPEG2:
    case SWF_TAG_CODE_DEFINE_BITS_JPEG3:
    case SWF_TAG_CODE_DEFINE_BITS_JPEG4:
    case SWF_TAG_CODE_JPEG_TABLES:
      symbol = defineImage(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_BITS_LOSSLESS:
    case SWF_TAG_CODE_DEFINE_BITS_LOSSLESS2:
      symbol = defineBitmap(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_BUTTON:
    case SWF_TAG_CODE_DEFINE_BUTTON2:
      symbol = defineButton(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_EDIT_TEXT:
      symbol = defineText(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_FONT:
    case SWF_TAG_CODE_DEFINE_FONT2:
    case SWF_TAG_CODE_DEFINE_FONT3:
    case SWF_TAG_CODE_DEFINE_FONT4:
      symbol = defineFont(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_MORPH_SHAPE:
    case SWF_TAG_CODE_DEFINE_MORPH_SHAPE2:
    case SWF_TAG_CODE_DEFINE_SHAPE:
    case SWF_TAG_CODE_DEFINE_SHAPE2:
    case SWF_TAG_CODE_DEFINE_SHAPE3:
    case SWF_TAG_CODE_DEFINE_SHAPE4:
      symbol = defineShape(swfTag, symbols);
      break;
    case SWF_TAG_CODE_DEFINE_SPRITE:
      var depths = { };
      var frame = { type: 'frame' };
      var frames = [];
      var tags = swfTag.tags;
      for (var i = 0, n = tags.length; i < n; i++) {
        var tag = tags[i];
        switch (tag.code) {
        case SWF_TAG_CODE_DO_ACTION:
          if (!frame.actionsData)
            frame.actionsData = [];
          frame.actionsData.push(tag.actionsData);
          break;
        case SWF_TAG_CODE_FRAME_LABEL:
          frame.labelName = tag.name;
          break;
        case SWF_TAG_CODE_PLACE_OBJECT:
        case SWF_TAG_CODE_PLACE_OBJECT2:
        case SWF_TAG_CODE_PLACE_OBJECT3:
          depths[tag.depth] = tag;
          break;
        case SWF_TAG_CODE_REMOVE_OBJECT:
        case SWF_TAG_CODE_REMOVE_OBJECT2:
          depths[tag.depth] = null;
          break;
        case SWF_TAG_CODE_SHOW_FRAME:
          var repeat = 1;
          while (i < n) {
            var nextTag = tags[i + 1];
            if (nextTag.code !== SWF_TAG_CODE_SHOW_FRAME)
              break;
            i++;
            repeat++;
          }
          if (repeat > 1)
            frame.repeat = repeat;
          frame.depths = depths;
          frames.push(frame);
          depths = { };
          frame = { type: 'frame' };
          break;
        }
      }
      symbol = {
        type: 'sprite',
        id: swfTag.id,
        frameCount: swfTag.frameCount,
        frames: frames
      };
      break;
    case SWF_TAG_CODE_DEFINE_TEXT:
    case SWF_TAG_CODE_DEFINE_TEXT2:
      symbol = defineLabel(swfTag, symbols);
      break;
    }

    symbols[swfTag.id] = symbol;
    loader.commitData(symbol);
  }),
  getSymbolClassByName: describeMethod(function (className) {
    var dictionary = this._dictionary;
    for (var id in dictionary) {
      var promise = dictionary[id];
      var symbolClass = promise.value;
      if (symbolClass && symbolClass.__class__ === className)
        return symbolClass;
    }
    return null;
  }),
  getSymbolClassById: describeMethod(function (id) {
    var promise = this._dictionary[id];
    return promise ? promise.value : null;
  }),
  load: describeMethod(function (request, context) {
    this.loadFrom(request.url);
  }),
  loadBytes: describeMethod(function (bytes, context) {
    if (!bytes.length)
      throw ArgumentError();

    this.loadFrom(bytes);
  }),
  loadFrom: describeMethod(function (input, context) {
    var loader = this;
    if (typeof window === 'undefined' && Loader.WORKERS_ENABLED) {
      var worker = new Worker(Loader.LOADER_PATH);
      worker.onmessage = function (evt) {
        loader.commitData(evt.data);
      };
      worker.postMessage(input);
      return;
    }

    if (typeof input === 'object') {
      if (input instanceof ArrayBuffer) {
        this.parseBytes(input);
      } else if (typeof FileReaderSync !== 'undefined') {
        var reader = new FileReaderSync;
        var buffer = reader.readAsArrayBuffer(input);
        loader.parseBytes(buffer);
      } else {
        var reader = new FileReader;
        reader.onload = function () {
          loader.parseBytes(this.result);
        };
        reader.readAsArrayBuffer(input);
      }
    } else {
      var xhr = new XMLHttpRequest;
      xhr.open('GET', input);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        loader.parseBytes(this.response);
      };
      xhr.send();
    }
  }),
  parseBytes: describeMethod(function (bytes) {
    var depths = { };
    var loader = this;
    var frame = { type: 'frame' };
    var symbols = this._symbols;
    var tagsProcessed = 0;

    SWF.parse(bytes, {
      onstart: function(result) {
        loader.commitData(result);
      },
      onprogress: function(result) {
        var tags = result.tags;
        for (var n = tags.length; tagsProcessed < n; tagsProcessed++) {
          var tag = tags[tagsProcessed];
          if ('id' in tag) {
            loader.defineSymbol(tag);
            continue;
          }

          switch (tag.code) {
          case SWF_TAG_CODE_DO_ABC:
            if (!frame.abcBlocks)
              frame.abcBlocks = [];
            frame.abcBlocks.push(tag.data);
            break;
          case SWF_TAG_CODE_DO_ACTION:
          case SWF_TAG_CODE_DO_INIT_ACTION:
            if (!frame.actionsData) {
              frame.initActionsData = { };
              frame.actionsData = [];
            }
            if (tag.spriteId)
              frame.initActionsData[tag.spriteId] = tag.actionsData;
            else
              frame.actionsData.push(tag.actionsData);
            break;
          case SWF_TAG_CODE_EXPORT_ASSETS:
          case SWF_TAG_CODE_SYMBOL_CLASS:
            if (!frame.exports)
              frame.exports = [];
            frame.exports = frame.exports.concat(tag.exports);
            break;
          case SWF_TAG_CODE_FRAME_LABEL:
            frame.labelName = tag.name;
            break;
          case SWF_TAG_CODE_PLACE_OBJECT:
          case SWF_TAG_CODE_PLACE_OBJECT2:
          case SWF_TAG_CODE_PLACE_OBJECT3:
            depths[tag.depth] = tag;
            break;
          case SWF_TAG_CODE_REMOVE_OBJECT:
          case SWF_TAG_CODE_REMOVE_OBJECT2:
            depths[tag.depth] = null;
            break;
          case SWF_TAG_CODE_SET_BACKGROUND_COLOR:
            frame.bgcolor = tag.color;
            break;
          case SWF_TAG_CODE_SHOW_FRAME:
            var repeat = 1;
            while (tagsProcessed < n) {
              var nextTag = tags[tagsProcessed + 1];
              if (!nextTag || nextTag.code !== SWF_TAG_CODE_SHOW_FRAME)
                break;
              tagsProcessed++;
              repeat++;
            }
            if (repeat > 1)
              frame.repeat = repeat;
            frame.depths = depths;
            loader.commitData(frame);
            depths = { };
            frame = { type: 'frame' };
            break;
          }
        }
      },
      oncomplete: function(result) {
        loader.commitData(result);
        loader.commitData(null);
      }
    });
  }),
  removeChild: describeMethod(function (child) {
    illegalOperation();
  }),
  removeChildAt: describeMethod(function (child, index) {
    illegalOperation();
  }),
  setChildIndex: describeMethod(function (child, index) {
    illegalOperation();
  }),
  setup: describeMethod(function (info) {
    var loader = this;
    var loaderInfo = loader.contentLoaderInfo;

    loaderInfo._swfVersion = info.swfVersion;

    var bounds = info.bounds;
    loaderInfo._width = (bounds.xMax - bounds.xMin) / 20;
    loaderInfo._height = (bounds.yMax - bounds.yMin) / 20;

    loaderInfo._frameRate = info.frameRate;

    // TODO disable AVM1 if AVM2 is enabled
    //var avm1 = new AS2Context(info.swfVersion);
    //loader._avm1 = avm1;

    var timeline = [];
    var documentClass = loader.createSymbolClass(MovieClip, {
      _frameLabels: describeProperty({ }),
      _timeline: describeProperty(timeline),
      _totalFrames: describeProperty(info.frameCount)
    });

    var documentPromise = new Promise;
    documentPromise.resolve(documentClass);
    loader._dictionary = { 0: documentPromise };
    loader._timeline = timeline;
  }),
  unload: describeMethod(function () {
    notImplemented();
  }),
  unloadAndStop: describeMethod(function (gc) {
    notImplemented();
  })
});
