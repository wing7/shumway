SWF.embed = function(file, doc, container, options) {
  var canvas = doc.createElement('canvas');
  var ctx = canvas.getContext('kanvas-2d');
  var loader = new flash.display.Loader;
  var loaderInfo = loader.contentLoaderInfo;
  var stage = new flash.display.Stage;

  stage._loader = loader;
  loaderInfo._parameters = options.movieParams;

  // HACK support of HiDPI displays
  var pixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;
  var canvasHolder = null;
  if (pixelRatio > 1) {
    var cssScale = 'scale(' + (1 / pixelRatio) + ', ' + (1 / pixelRatio) + ')';
    canvas.setAttribute('style', '-moz-transform: ' + cssScale + ';' +
                                 '-webkit-transform: ' + cssScale + ';' +
                                 'transform: ' + cssScale + ';' +
                                 '-moz-transform-origin: 0% 0%;' +
                                 '-webkit-transform-origin: 0% 0%;' +
                                 'transform-origin: 0% 0%;');
    canvasHolder = doc.createElement('div');
    canvasHolder.setAttribute('style', 'display: inline-block; overflow: hidden;');
    canvasHolder.appendChild(canvas);
  }

  loader._parent = stage;
  loader._stage = stage;
  stage._loader = loader;

  function fitCanvas(container, canvas) {
    if (canvasHolder) {
      canvasHolder.style.width = container.clientWidth + 'px';
      canvasHolder.style.height = container.clientHeight + 'px';
    }
    canvas.width = container.clientWidth * pixelRatio;
    canvas.height = container.clientHeight * pixelRatio;
  }

  loaderInfo.addEventListener('init', function () {
    if (container.clientHeight) {
      fitCanvas(container, canvas);
      window.addEventListener('resize', function () {
        fitCanvas.bind(container, canvas);
      });
    } else {
      if (canvasHolder) {
        canvasHolder.style.width = stage._stageWidth + 'px';
        canvasHolder.style.height = stage._stageHeight + 'px';
      }
      canvas.width = stage._stageWidth * pixelRatio;
      canvas.height = stage._stageHeight * pixelRatio;
    }

    container.setAttribute("style", "position: relative");

    canvas.addEventListener('click', function () {
      ShumwayKeyboardListener.focus = stage;

      if (stage._clickTarget) {
        stage._clickTarget.dispatchEvent(new flash.events.MouseEvent('click'));
      }
    });
    canvas.addEventListener('dblclick', function () {
      if (stage._clickTarget && stage._clickTarget._doubleClickEnabled) {
        stage._clickTarget.dispatchEvent(new flash.events.MouseEvent('doubleClick'));
      }
    });
    canvas.addEventListener('mousedown', function () {
      if (stage._clickTarget) {
        stage._clickTarget.dispatchEvent(new flash.events.MouseEvent('mouseDown'));
      }
    });
    canvas.addEventListener('mousemove', function (domEvt) {
      var node = this;
      var left = 0;
      var top = 0;
      if (node.offsetParent) {
        do {
          left += node.offsetLeft;
          top += node.offsetTop;
        } while (node = node.offsetParent);
      }

      var canvasState = stage._canvasState;
      stage._mouseX = ((domEvt.pageX - left) * pixelRatio - canvasState.offsetX) /
        canvasState.scale;
      stage._mouseY = ((domEvt.pageY - top) * pixelRatio - canvasState.offsetY) /
        canvasState.scale;
    });
    canvas.addEventListener('mouseup', function () {
      if (stage._clickTarget) {
        stage._clickTarget.dispatchEvent(new flash.events.MouseEvent('mouseUp'));
      }
    });
    canvas.addEventListener('mouseover', function () {
      stage._mouseOver = true;
      stage._mouseJustLeft = false;
    });
    canvas.addEventListener('mouseout', function () {
      stage._mouseOver = false;
      stage._mouseJustLeft = true;
    });

    var bgcolor = loaderInfo._backgroundColor;
    stage._color = bgcolor;

    ctx.fillStyle = toStringRgba(bgcolor);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var root = loader._content;
    stage._children[0] = root;
    stage._control.appendChild(root._control);

    root.dispatchEvent(new flash.events.Event("added"));
    root.dispatchEvent(new flash.events.Event("addedToStage"));

    var cursorVisible = true;
    function syncCursor() {
      var newCursor;
      if (!cursorVisible) {
        newCursor = 'none';
      } else if (stage._clickTarget &&
                 stage._clickTarget.shouldHaveHandCursor) {
        newCursor = 'pointer';
      } else {
        newCursor = 'auto';
      }

      container.style.cursor = newCursor;
    }

    stage._setCursorVisible = function(val) {
      cursorVisible = val;
      syncCursor();
    };
    stage._syncCursor = syncCursor;
    syncCursor();

    container.appendChild(canvasHolder || canvas);

    if (options.onStageInitialized) {
      options.onStageInitialized(stage);
    }

    renderStage(stage, ctx, options.onBeforeFrame, options.onFrame);
  });

  if (options.onComplete) {
    loaderInfo.addEventListener("complete", function () {
      options.onComplete();
    });
  }

  loader._loadFrom(file);
};
