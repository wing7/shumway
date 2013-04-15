var InteractiveObjectDefinition = (function () {
  var def = {
    initialize: function () {
      this._doubleClickEnabled = false;
      this._hitArea = null;
      this._mouseEnabled = true;

      this._tabEnabled = false;
      this._focusRect = null;
      this._contextMenu = null;
    },

    get accessibilityImplementation() {
      return null;
    },
    set accessibilityImplementation(val) {
      notImplemented();
    },
    get contextMenu() {
      somewhatImplemented("contextMenu");
      return this._contextMenu;
    },
    set contextMenu(val) {
      somewhatImplemented("contextMenu");
      this._contextMenu = val;
    },
    get doubleClickEnabled() {
      return this._doubleClickEnabled;
    },
    set doubleClickEnabled(val) {
      this._doubleClickEnabled = val;
    },
    get focusRect() {
      return this._focusRect;
    },
    set focusRect(val) {
      this._focusRect = val;
    },
    get mouseEnabled() {
      return this._mouseEnabled;
    },
    set mouseEnabled(val) {
      this._mouseEnabled = val;
    },
    get needsSoftKeyboard() {
      return false;
    },
    set needsSoftKeyboard(val) {
      notImplemented();
    },
    get softKeyboardInputAreaOfInterest() {
      return null;
    },
    set softKeyboardInputAreaOfInterest(val) {
      notImplemented();
    },
    get tabEnabled() {
      return this._tabEnabled;
    },
    set tabEnabled(val) {
      var old = this._tabEnabled;
      this._tabEnabled = val;
      if (old !== val) {
        var Event = flash.events.Event;
        this.dispatchEvent(new Event(Event.class.TAB_ENABLED_CHANGE, false, false));
      }
    },
    requestSoftKeyboard: function () {
      notImplemented();
    }
  };

  var desc = Object.getOwnPropertyDescriptor;

  def.__glue__ = {
    native: {
      instance: {
        tabEnabled: desc(def, "tabEnabled"),
        tabIndex: {
          get: function tabIndex() { // (void) -> int
            return this._tabIndex;
          },
          set: function tabIndex(index) { // (index:int) -> void
            this._tabIndex = index;
          }
        },
        focusRect: desc(def, "focusRect"),
        mouseEnabled: desc(def, "mouseEnabled"),
        doubleClickEnabled: desc(def, "doubleClickEnabled"),
        accessibilityImplementation: desc(def, "accessibilityImplementation"),
        softKeyboardInputAreaOfInterest: desc(def, "softKeyboardInputAreaOfInterest"),
        needsSoftKeyboard: desc(def, "needsSoftKeyboard"),
        contextMenu: desc(def, "contextMenu"),
        requestSoftKeyboard: def.requestSoftKeyboard
      }
    }
  };

  return def;
}).call(this);
