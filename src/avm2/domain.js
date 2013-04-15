/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 4 -*- */
var domainOptions = systemOptions.register(new OptionSet("Domain Options"));
var traceClasses = domainOptions.register(new Option("tc", "traceClasses", "boolean", false, "trace class creation"));
var traceDomain = domainOptions.register(new Option("tdpa", "traceDomain", "boolean", false, "trace domain property access"));

var EXECUTION_MODE = {
  INTERPRET: 0x1,
  COMPILE: 0x2
};

function executeScript(script) {
  var abc = script.abc;
  if (disassemble.value) {
    abc.trace(new IndentingWriter());
  }
  if (traceExecution.value) {
    print("Executing: " + abc.name + " " + script);
  }
  release || assert(!script.executing && !script.executed);
  var global = new Global(abc.runtime, script);
  if (abc.domain.allowNatives) {
    global[Multiname.getPublicQualifiedName("unsafeJSNative")] = getNative;
  }
  script.executing = true;
  var scope = new Scope(null, script.global);
  // XXX interpreted methods populate stack with every call, compiled don't
  // pushing current runtime to the stack, so Runtime.currentDomain is successful
  Runtime.stack.push(abc.runtime);
  abc.runtime.createFunction(script.init, scope).call(script.global);
  Runtime.stack.pop();
  script.executed = true;
}

function ensureScriptIsExecuted(script, reason) {
  if (!script.executed && !script.executing) {
    if (traceExecution.value >= 2) {
      print("Executing Script For: " + reason);
    }
    executeScript(script);
  }
}

var Domain = (function () {

  function Domain(vm, base, mode, allowNatives) {

    this.vm = vm;

    // ABCs that belong to this domain.
    this.abcs = [];

    // ABCs that have been loaded
    this.loadedAbcs = {};

    // Classes that have been loaded.
    this.loadedClasses = [];

    // Classes cache.
    this.classCache = Object.create(null);

    // Script cache.
    this.scriptCache = Object.create(null);

    // Class Info cache.
    this.classInfoCache = Object.create(null);

    // Our parent.
    this.base = base;

    // Do we allow natives?
    this.allowNatives = allowNatives;

    // Do we compile or interpret?
    this.mode = mode;

    // Storage for custom natives
    this.natives = {};

    // If we are the system domain (the root), we should initialize the Class
    // and MethodClosure classes.
    if (base) {
      this.system = base.system;
    } else {
      this.system = this;

      var OWN_INITIALIZE   = 0x1;
      var SUPER_INITIALIZE = 0x2;

      var Class = this.Class = function Class(name, instance, callable) {
        this.debugName = name;

        if (instance) {
          release || assert(instance.prototype);
          this.instance = instance;
          this.instanceNoInitialize = instance;
          this.hasInitialize = 0;
          this.instance.class = this;
        }

        if (!callable) {
          callable = Domain.coerceCallable(this);
        } else if (callable === Domain.coerceCallable) {
          callable = Domain.coerceCallable(this);
        }
        defineNonEnumerableProperty(this, "call", callable.call);
        defineNonEnumerableProperty(this, "apply", callable.apply);
      };

      Class.prototype = {
        forceConstify: true,

        setSymbol: function setSymbol(props) {
          this.instance.prototype.symbol = props;
        },

        getSymbol: function getSymbol() {
          return this.instance.prototype.symbol;
        },

        initializeInstance: function initializeInstance(obj) {
          // Initialize should be nullary and nonrecursive. If the script
          // needs to pass in script objects to native land, there's usually a
          // ctor function.
          var c = this;
          var initializes = [];
          while (c) {
            if (c.hasInitialize & OWN_INITIALIZE) {
              initializes.push(c.instance.prototype.initialize);
            }
            c = c.baseClass;
          }
          var s;
          while ((s = initializes.pop())) {
            s.call(obj);
          }
          Counter.count("Initialize: " + this.classInfo.instanceInfo.name);
        },

        createInstance: function createInstance(args) {
          var o = Object.create(this.instance.prototype);
          this.instance.apply(o, args);
          return o;
        },

        createAsSymbol: function createAsSymbol(props) {
          var o = Object.create(this.instance.prototype);
          // Custom classes will have already have .symbol linked.
          if (o.symbol) {
            var symbol = Object.create(o.symbol);
            for (var prop in props) {
              symbol[prop] = props[prop];
            }
            o.symbol = symbol;
          } else {
            o.symbol = props;
          }
          return o;
        },

        extendBuiltin: function(baseClass) {
          // Some natives handle their own prototypes/it's impossible to do the
          // traits/public prototype BS, e.g. Object, Array, etc.
          // FIXME: This is technically non-semantics preserving.
          this.baseClass = baseClass;
          this.dynamicPrototype = this.instance.prototype;
          defineNonEnumerableProperty(this.dynamicPrototype, Multiname.getPublicQualifiedName("constructor"), this);
        },

        extend: function (baseClass) {
          release || assert (baseClass);
          this.baseClass = baseClass;
          this.dynamicPrototype = Object.create(baseClass.dynamicPrototype);
          if (baseClass.hasInitialize) {
            var instanceNoInitialize = this.instance;
            var self = this;
            this.instance = function () {
              self.initializeInstance(this);
              instanceNoInitialize.apply(this, arguments);
            };
            this.instance.class = instanceNoInitialize.class;
            this.hasInitialize |= SUPER_INITIALIZE;
          }
          this.instance.prototype = Object.create(this.dynamicPrototype);
          defineNonEnumerableProperty(this.dynamicPrototype, Multiname.getPublicQualifiedName("constructor"), this);
          defineReadOnlyProperty(this.instance.prototype, "class", this);
        },

        link: function (definition) {
          release || assert(this.dynamicPrototype);

          function glueProperties(obj, props) {
            var keys = Object.keys(props);
            for (var i = 0, j = keys.length; i < j; i++) {
              var p = keys[i];
              var propName = props[p];
              assert (typeof propName === "string", "Make sure it's not a function.");
              var qn = Multiname.getQualifiedName(Multiname.fromSimpleName(propName));
              release || assert(typeof qn === "string");
              var desc = Object.getOwnPropertyDescriptor(obj, qn);
              if (desc && desc.get) {
                Object.defineProperty(obj, p, desc);
              } else {
                Object.defineProperty(obj, p, {
                  get: new Function("", "return this." + qn),
                  set: new Function("v", "this." + qn + " = v")
                });
              }
            }
          }

          if (definition.initialize) {
            if (!this.hasInitialize) {
              var instanceNoInitialize = this.instance;
              var self = this;
              this.instance = function () {
                self.initializeInstance(this);
                instanceNoInitialize.apply(this, arguments);
              };
              this.instance.class = instanceNoInitialize.class;
              this.instance.prototype = instanceNoInitialize.prototype;
            }
            this.hasInitialize |= OWN_INITIALIZE;
          }

          var proto = this.dynamicPrototype;
          var keys = Object.keys(definition);
          for (var i = 0, j = keys.length; i < j; i++) {
            var p = keys[i];
            Object.defineProperty(proto, p, Object.getOwnPropertyDescriptor(definition, p));
          }

          var glue = definition.__glue__;
          if (!glue)
            return;

          // Accessors for script properties from within AVM2.
          if (glue.script) {
            if (glue.script.instance) {
              glueProperties(proto, glue.script.instance);
            }
            if (glue.script.static) {
              glueProperties(this, glue.script.static);
            }
          }

          // Binding to member methods marked as [native].
          this.native = glue.native;
        },

        extendNative: function (baseClass, native) {
          this.baseClass = baseClass;
          this.dynamicPrototype = Object.getPrototypeOf(native.prototype);
          this.instance.prototype = native.prototype;
          defineNonEnumerableProperty(this.dynamicPrototype, Multiname.getPublicQualifiedName("constructor"), this);
          defineReadOnlyProperty(this.instance.prototype, "class", this);
        },

        coerce: function (value) {
          return value;
        },

        isInstanceOf: function (value) {
          // TODO: Fix me.
          return this.isInstance(value);
        },

        isInstance: function (value) {
          if (value === null || typeof value !== "object") {
            return false;
          }
          return this.dynamicPrototype.isPrototypeOf(value);
        },

        toString: function () {
          return "[class " + this.debugName + "]";
        }
      };

      var callable = Domain.coerceCallable(Class);
      defineNonEnumerableProperty(Class, "call", callable.call);
      defineNonEnumerableProperty(Class, "apply", callable.apply);

      Class.instance = Class;
      Class.toString = Class.prototype.toString;

      // Traits are below the dynamic instant prototypes,
      // i.e. this.dynamicPrototype === Object.getPrototypeOf(this.instance.prototype)
      // and we cache the dynamic instant prototype as this.dynamicPrototype.
      //
      // Traits are not visible to the AVM script.
      Class.native = {
        instance: {
          prototype: {
            get: function () { return this.dynamicPrototype; }
          }
        }
      };

      var MethodClosure = this.MethodClosure = function MethodClosure($this, fn) {
        var bound = fn.bind($this);
        defineNonEnumerableProperty(this, "call", bound.call.bind(bound));
        defineNonEnumerableProperty(this, "apply", bound.apply.bind(bound));
      };

      MethodClosure.prototype = {
        toString: function () {
          return "function Function() {}";
        }
      };
    }
  }

  Domain.passthroughCallable = function passthroughCallable(f) {
    return {
      call: function ($this) {
        Array.prototype.shift.call(arguments);
        return f.apply($this, arguments);
      },
      apply: function ($this, args) {
        return f.apply($this, args);
      }
    };
  };

  Domain.coerceCallable = function coerceCallable(type) {
    return {
      call: function ($this, value) {
        return coerce(value, type);
      },
      apply: function ($this, args) {
        return coerce(args[0], type);
      }
    };
  };

  Domain.constructingCallable = function constructingCallable(instance) {
    return {
      call: function ($this) {
        return new Function.bind.apply(instance, arguments);
      },
      apply: function ($this, args) {
        return new Function.bind.apply(instance, [$this].concat(args));
      }
    };
  };

  Domain.prototype = {
    getProperty: function getProperty(multiname, strict, execute) {
      var resolved = this.findDefiningScript(multiname, execute);
      if (resolved) {
        if (!resolved.script.executing) {
          // console.info("Getting " + multiname + " but script is not executed");
          return undefined;
        }
        return resolved.script.global[Multiname.getQualifiedName(resolved.name)];
      }
      if (strict) {
        return unexpected("Cannot find property " + multiname);
      }

      return undefined;
    },

    getClass: function getClass(simpleName) {
      var cache = this.classCache;
      var c = cache[simpleName];
      if (!c) {
        c = cache[simpleName] = this.getProperty(Multiname.fromSimpleName(simpleName), true, true);
      }
      release || assert(c instanceof this.system.Class);
      return c;
    },

    findClass: function findClass(simpleName) {
      if (simpleName in this.classCache) {
        return true;
      }
      return this.findProperty(Multiname.fromSimpleName(simpleName), false, true);
    },

    findProperty: function findProperty(multiname, strict, execute) {
      if (traceDomain.value) {
        print("Domain.findProperty: " + multiname);
      }
      var resolved = this.findDefiningScript(multiname, execute);
      if (resolved) {
        return resolved.script.global;
      }
      if (strict) {
        return unexpected("Cannot find property " + multiname);
      } else {
        return undefined;
      }
      return undefined;
    },

    findClassInfo: function findClassInfo(mn) {
      release || Multiname.isQName(mn);
      var qn = Multiname.getQualifiedName(mn);

      var ci = this.classInfoCache[qn];
      if (ci) {
        return ci;
      }
      if (this.base) {
        ci = this.base.findClassInfo(mn);
        if (ci) {
          return ci;
        }
      }
      var abcs = this.abcs;
      for (var i = 0; i < abcs.length; i++) {
        var abc = abcs[i];
        var scripts = abc.scripts;
        for (var j = 0; j < scripts.length; j++) {
          var script = scripts[j];
          var traits = script.traits;
          for (var k = 0; k < traits.length; k++) {
            var trait = traits[k];
            if (trait.isClass() && Multiname.getQualifiedName(trait.name) == qn) {
              return (this.classInfoCache[qn] = trait.classInfo);
            }
          }
        }
      }

      // Ask host to load the defining ABC
      if (!this.base && this.vm.findDefiningAbc) {
        var abc = this.vm.findDefiningAbc(mn);
        if (abc !== null && !this.loadedAbcs[abc.name]) {
          this.loadedAbcs[abc.name] = true;
          this.loadAbc(abc);
          return this.findClassInfo(mn);
        }
      }

      return undefined;
    },

    installNative: function(name, func) {
      natives[name] = function() {
        return func;
      };
    },

    /**
     * Find the first script that defines a multiname.
     *
     * ABCs are added to the list in load order, so a later loaded ABC with a
     * definition of conflicting name will never be resolved.
     */
    findDefiningScript: function findDefiningScript(mn, execute) {
      var resolved = this.scriptCache[mn.id];
      if (resolved && (resolved.script.executed || !execute)) {
        return resolved;
      }

      if (this.base) {
        resolved = this.base.findDefiningScript(mn, execute);
        if (resolved) {
          return resolved;
        }
      }

      Counter.count("Domain: findDefiningScript");

      var abcs = this.abcs;
      for (var i = 0; i < abcs.length; i++) {
        var abc = abcs[i];
        var scripts = abc.scripts;
        for (var j = 0; j < scripts.length; j++) {
          var script = scripts[j];
          var traits = script.traits;
          if (mn instanceof Multiname) {
            for (var k = 0; k < traits.length; k++) {
              var trait = traits[k];
              if (mn.hasQName(trait.name)) {
                if (execute) {
                  ensureScriptIsExecuted(script, trait.name);
                }
                return (this.scriptCache[mn.id] = { script: script, name: trait.name });
              }
            }
          } else {
            unexpected();
          }
        }
      }

      // Ask host to execute the defining ABC
      if (!this.base && this.vm.findDefiningAbc) {
        var abc = this.vm.findDefiningAbc(mn);
        if (abc !== null && !this.loadedAbcs[abc.name]) {
          this.loadedAbcs[abc.name] = true;
          this.loadAbc(abc);
          return this.findDefiningScript(mn, execute);
        }
      }

      return undefined;
    },

    executeAbc: function executeAbc(abc) {
      console.time("Execute ABC: " + abc.name);
      this.loadAbc(abc);
      executeScript(abc.lastScript);
      if (traceClasses.value) {
        this.traceLoadedClasses();
      }
      console.timeEnd("Execute ABC: " + abc.name);
    },

    loadAbc: function loadAbc(abc) {
      if (traceExecution.value) {
        print("Loading: " + abc.name);
      }
      abc.domain = this;
      this.abcs.push(abc);
      abc.runtime = new Runtime(abc);
    },

    _getScriptObject: function () {
      if (!this.scriptObject) {
        var ApplicationDomainClass = avm2.systemDomain.getClass("flash.system.ApplicationDomain");
        var dom = ApplicationDomainClass.createInstance([this]); // wrapping native Domain
        release || assert(dom === this.scriptObject);
      }
      return this.scriptObject;
    },

    traceLoadedClasses: function () {
      var writer = new IndentingWriter();
      function traceProperties(obj) {
        for (var key in obj) {
          var str = key;
          var descriptor = Object.getOwnPropertyDescriptor(obj, key);
          if (descriptor) {
            if (descriptor.get) {
              str += " getter";
            }
            if (descriptor.set) {
              str += " setter";
            }
            if (descriptor.value) {
              var value = obj[key];
              if (value instanceof Scope) {
                str += ": ";
                var scope = value;
                while (scope) {
                  release || assert(scope.object);
                  str += scope.object.debugName || "T";
                  if ((scope = scope.parent)) {
                    str += " <: ";
                  }
                }
              } else if (value instanceof Function) {
                str += ": " + (value.name ? value.name : "anonymous");
              } else if (value) {
                str += ": " + value;
              }
            }
          }
          writer.writeLn(str);
        }
      }
      writer.enter("Loaded Classes");
      this.loadedClasses.forEach(function (cls) {
        var description = cls.debugName + (cls.baseClass ? " extends " + cls.baseClass.debugName : "");
        writer.enter(description + " {");
        writer.enter("instance");
        traceProperties(cls.prototype);
        writer.leave("");
        writer.enter("static");
        traceProperties(cls);
        writer.leave("");
        writer.leave("}");
      });
      writer.leave("");
    }
  };

  return Domain;

})();
