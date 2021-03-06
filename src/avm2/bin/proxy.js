load("../util.js");

var options = new OptionSet("option(s)");
var disassemble = options.register(new Option("disassemble", "d", false, "disassemble"));

load("../../../lib/DataView.js/DataView.js");

load("../constants.js");
load("../opcodes.js");
load("../parser.js");
load("../disassembler.js");
load("../analyze.js");
load("../compiler.js");
load("../native.js");
load("../runtime.js");
load("../viz.js");
load("../interpreter.js");

if (arguments.length === 0) {
  printUsage();
  quit();
}

var all = options.register(new Option("all", "a", false, "create stubs for all methods, not just native methods"));

function printUsage() {
  print("proxy: [option(s)] classQName");
  print("Generates JS source stubs for AS native methods.");
  options.trace(new IndentingWriter());
}

var classQName = arguments[arguments.length - 1];

options.parse(arguments.slice(0, arguments.length - 1));

if (help.value) {
  printUsage();
  quit();
}

for (var i = 0; i < 374; i++) {
  var path = "../playerGlobal/library-" + i + ".abc";
  prepareAbc(new AbcFile(snarf(path, "binary"), path), EXECUTION_MODE.INTERPRET);
}

var name = Multiname.fromQualifiedName(classQName);
var type = toplevel.getTypeByName(name, true, true);

var writer = new IndentingWriter();

writer.enter("function " + classQName + "$proxy(cls) {");
writer.enter("return {");
function writeTraits(name, traits, instance) {
  var members = [];
  for (var i = 0; i < traits.length; i++) {
    var trait = traits[i];
    if (trait.isMethod() || trait.isGetter() || trait.isSetter()) {
      var method = trait.method;
      if (method.isNative() || all.value) {
        var prefix = trait.isGetter() ? "get$" : trait.isSetter() ? "set$" : "";
        var methodQName = (instance ? "instance$" : "static$") + prefix + Multiname.getQualifiedName(method.name);
        var methodName = prefix + method.name.name;
        var signature = trait.method.parameters.map(function (p) { return p.name; }).join(", ");
        var comment = trait.method.parameters.map(function (p) {
          return p.name + (p.type ? ": " + p.type.name : "");
        }).join(", ") + (method.returnType ? " -> " + method.returnType.name : "");
        writer.writeLn("// " + (method.isNative() ? "Native, " : "") + "Arguments: " + comment);
        writer.enter(methodQName + ": function " + methodName + " (" + signature + ") {");
        writer.writeLn("notImplemented(\"" + methodQName + "\");");
        writer.leave("},");
      }
    }
  }
}

writeTraits("static", type.classInfo.traits.traits);
writeTraits("instance", type.instanceTraits.traits, true);

writer.leave("}");
writer.leave("}");
