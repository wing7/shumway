var USE_MEDIASOURCE_API = true;

var NetStreamDefinition = (function () {
  return {
    // (connection:NetConnection, peerID:String = "connectToFMS")
    __class__: "flash.net.NetStream",
    initialize: function () {
    },
    __glue__: {
      script: {
        instance: scriptProperties("public", ["appendBytes",
                                              "appendBytesAction"])
      },
      native: {
        static: {
        },
        instance: {
          ctor: function ctor(connection, peerID) {
            // (connection:NetConnection, peerID:String) -> void
            somewhatImplemented("NetStream.ctor");
            this._contentTypeHint = null;
            this._mediaSource = null;
            this._urlReady = new Promise();
          },
          onResult: function onResult(streamId) {
            // (streamId:int) -> void
            notImplemented("NetStream.onResult");
          },
          dispose: function dispose() {
            // (void) -> void
            notImplemented("NetStream.dispose");
          },
          play: function play(url) {
            // (void) -> void
            var isMediaSourceEnabled = USE_MEDIASOURCE_API;
            if (isMediaSourceEnabled && typeof MediaSource === 'undefined') {
              console.warn('MediaSource API is not enabled, falling back to regular playback');
              isMediaSourceEnabled = false;
            }
            if (!isMediaSourceEnabled) {
              this._urlReady.resolve(FileLoadingService.resolveUrl(url));
              somewhatImplemented("NetStream.play");
              return;
            }

            var mediaSource = new MediaSource();
            mediaSource.addEventListener('sourceopen', function(e) {
              this._mediaSource = mediaSource;
            }.bind(this));
            mediaSource.addEventListener('sourceend', function(e) {
              this._mediaSource = null;
            }.bind(this));
            this._urlReady.resolve(window.URL.createObjectURL(mediaSource));

            if (!url) {
              return;
            }

            var request = new flash.net.URLRequest(url);
            var stream = new flash.net.URLStream();
            stream.addEventListener('httpStatus', function (e) {
              var responseHeaders = e.public$responseHeaders;
              var contentTypeHeader = responseHeaders.filter(function (h) {
                return h.public$name === 'Content-Type';
              })[0];
              if (contentTypeHeader &&
                  contentTypeHeader.public$value !== 'application/octet-stream')
              {
                this._contentTypeHint = contentTypeHeader.public$value;
              }
            }.bind(this));
            stream.addEventListener('progress', function (e) {
              var available = stream.bytesAvailable;
              var ByteArrayClass = avm2.systemDomain.getClass("flash.utils.ByteArray");
              var data = ByteArrayClass.createInstance();
              stream.readBytes(data, 0, available);
              this.appendBytes(data);
            }.bind(this));
            stream.addEventListener('complete', function (e) {
              this.appendBytesAction('endSequence'); // NetStreamAppendBytesAction.END_SEQUENCE
            }.bind(this));
            stream.load(request);
          },
          play2: function play2(param) {
            // (param:NetStreamPlayOptions) -> void
            notImplemented("NetStream.play2");
          },
          invoke: function invoke(index) {
            // (index:uint) -> any
            notImplemented("NetStream.invoke");
          },
          invokeWithArgsArray: function invokeWithArgsArray(index, p_arguments) {
            // (index:uint, p_arguments:Array) -> any
            notImplemented("NetStream.invokeWithArgsArray");
          },
          appendBytes: function appendBytes(bytes) {
            if (this._mediaSource) {
              if (!this._mediaSourceBuffer) {
                this._mediaSourceBuffer = this._mediaSource.addSourceBuffer(this._contentTypeHint);
              }
              this._mediaSourceBuffer.appendBuffer(new Uint8Array(bytes.a, 0, bytes.length));
            }
            // (bytes:ByteArray) -> void
            somewhatImplemented("NetStream.appendBytes");
          },
          appendBytesAction: function appendBytesAction(netStreamAppendBytesAction) {
            // (netStreamAppendBytesAction:String) -> void
            if (netStreamAppendBytesAction === 'endSequence' && this._mediaSource) {
              this._mediaSource.endOfStream();
            }
            somewhatImplemented("NetStream.appendBytesAction");
          },
          info: {
            get: function info() {
              // (void) -> NetStreamInfo
              notImplemented("NetStream.info");
              return this._info;
            }
          },
          multicastInfo: {
            get: function multicastInfo() { // (void) -> NetStreamMulticastInfo
              notImplemented("NetStream.multicastInfo");
              return this._multicastInfo;
            }
          },
          soundTransform: {
            get: function soundTransform() {
              // (void) -> SoundTransform
              notImplemented("NetStream.soundTransform");
              return this._soundTransform;
            },
            set: function soundTransform(sndTransform) {
              // (sndTransform:SoundTransform) -> void
              notImplemented("NetStream.soundTransform");
              this._soundTransform = sndTransform;
            }
          },
          checkPolicyFile: {
            get: function checkPolicyFile() {
              // (void) -> Boolean
              notImplemented("NetStream.checkPolicyFile");
              return this._checkPolicyFile;
            },
            set: function checkPolicyFile(state) {
              // (state:Boolean) -> void
              notImplemented("NetStream.checkPolicyFile");
              this._checkPolicyFile = state;
            }
          },
          client: {
            get: function client() {
              // (void) -> Object
              somewhatImplemented("NetStream.client");
              return this._client;
            },
            set: function client(object) {
              // (object:Object) -> void
              somewhatImplemented("NetStream.client");
              this._client = object;
            }
          },
          objectEncoding: {
            get: function objectEncoding() {
              // (void) -> uint
              notImplemented("NetStream.objectEncoding");
              return this._objectEncoding;
            }
          },
          multicastPushNeighborLimit: {
            get: function multicastPushNeighborLimit() {
              // (void) -> Number
              notImplemented("NetStream.multicastPushNeighborLimit");
              return this._multicastPushNeighborLimit;
            },
            set: function multicastPushNeighborLimit(neighbors) {
              // (neighbors:Number) -> void
              notImplemented("NetStream.multicastPushNeighborLimit");
              this._multicastPushNeighborLimit = neighbors;
            }
          },
          multicastWindowDuration: {
            get: function multicastWindowDuration() {
              // (void) -> Number
              notImplemented("NetStream.multicastWindowDuration");
              return this._multicastWindowDuration;
            },
            set: function multicastWindowDuration(seconds) {
              // (seconds:Number) -> void
              notImplemented("NetStream.multicastWindowDuration");
              this._multicastWindowDuration = seconds;
            }
          },
          multicastRelayMarginDuration: {
            get: function multicastRelayMarginDuration() {
              // (void) -> Number
              notImplemented("NetStream.multicastRelayMarginDuration");
              return this._multicastRelayMarginDuration;
            },
            set: function multicastRelayMarginDuration(seconds) {
              // (seconds:Number) -> void
              notImplemented("NetStream.multicastRelayMarginDuration");
              this._multicastRelayMarginDuration = seconds;
            }
          },
          multicastAvailabilityUpdatePeriod: {
            get: function multicastAvailabilityUpdatePeriod() {
              // (void) -> Number
              notImplemented("NetStream.multicastAvailabilityUpdatePeriod");
              return this._multicastAvailabilityUpdatePeriod;
            },
            set: function multicastAvailabilityUpdatePeriod(seconds) {
              // (seconds:Number) -> void
              notImplemented("NetStream.multicastAvailabilityUpdatePeriod");
              this._multicastAvailabilityUpdatePeriod = seconds;
            }
          },
          multicastFetchPeriod: {
            get: function multicastFetchPeriod() {
              // (void) -> Number
              notImplemented("NetStream.multicastFetchPeriod");
              return this._multicastFetchPeriod;
            },
            set: function multicastFetchPeriod(seconds) { // (seconds:Number) -> void
              notImplemented("NetStream.multicastFetchPeriod");
              this._multicastFetchPeriod = seconds;
            }
          },
          multicastAvailabilitySendToAll: {
            get: function multicastAvailabilitySendToAll() {
              // (void) -> Boolean
              notImplemented("NetStream.multicastAvailabilitySendToAll");
              return this._multicastAvailabilitySendToAll;
            },
            set: function multicastAvailabilitySendToAll(value) {
              // (value:Boolean) -> void
              notImplemented("NetStream.multicastAvailabilitySendToAll");
              this._multicastAvailabilitySendToAll = value;
            }
          },
          farID: {
            get: function farID() {
              // (void) -> String
              notImplemented("NetStream.farID");
              return this._farID;
            }
          },
          nearNonce: {
            get: function nearNonce() {
              // (void) -> String
              notImplemented("NetStream.nearNonce");
              return this._nearNonce;
            }
          },
          farNonce: {
            get: function farNonce() {
              // (void) -> String
              notImplemented("NetStream.farNonce");
              return this._farNonce;
            }
          },
          peerStreams: {
            get: function peerStreams() {
              // (void) -> Array
              notImplemented("NetStream.peerStreams");
              return this._peerStreams;
            }
          },
          audioReliable: {
            get: function audioReliable() {
              // (void) -> Boolean
              notImplemented("NetStream.audioReliable");
              return this._audioReliable;
            },
            set: function audioReliable(reliable) {
              // (reliable:Boolean) -> void
              notImplemented("NetStream.audioReliable");
              this._audioReliable = reliable;
            }
          },
          videoReliable: {
            get: function videoReliable() {
              // (void) -> Boolean
              notImplemented("NetStream.videoReliable");
              return this._videoReliable;
            },
            set: function videoReliable(reliable) {
              // (reliable:Boolean) -> void
              notImplemented("NetStream.videoReliable");
              this._videoReliable = reliable;
            }
          },
          dataReliable: {
            get: function dataReliable() {
              // (void) -> Boolean
              notImplemented("NetStream.dataReliable");
              return this._dataReliable;
            },
            set: function dataReliable(reliable) {
              // (reliable:Boolean) -> void
              notImplemented("NetStream.dataReliable");
              this._dataReliable = reliable;
            }
          },
          audioSampleAccess: {
            get: function audioSampleAccess() {
              // (void) -> Boolean
              notImplemented("NetStream.audioSampleAccess");
              return this._audioSampleAccess;
            },
            set: function audioSampleAccess(reliable) {
              // (reliable:Boolean) -> void
              notImplemented("NetStream.audioSampleAccess");
              this._audioSampleAccess = reliable;
            }
          },
          videoSampleAccess: {
            get: function videoSampleAccess() {
              // (void) -> Boolean
              notImplemented("NetStream.videoSampleAccess");
              return this._videoSampleAccess;
            },
            set: function videoSampleAccess(reliable) {
              // (reliable:Boolean) -> void
              notImplemented("NetStream.videoSampleAccess");
              this._videoSampleAccess = reliable;
            }
          },
          useHardwareDecoder: {
            get: function useHardwareDecoder() {
              // (void) -> Boolean
              notImplemented("NetStream.useHardwareDecoder");
              return this._useHardwareDecoder;
            },
            set: function useHardwareDecoder(v) {
              // (v:Boolean) -> void
              notImplemented("NetStream.useHardwareDecoder");
              this._useHardwareDecoder = v;
            }
          },
          useJitterBuffer: {
            get: function useJitterBuffer() {
              // (void) -> Boolean
              notImplemented("NetStream.useJitterBuffer");
              return this._useJitterBuffer;
            },
            set: function useJitterBuffer(value) {
              // (value:Boolean) -> void
              notImplemented("NetStream.useJitterBuffer");
              this._useJitterBuffer = value;
            }
          },
          videoStreamSettings: {
            get: function videoStreamSettings() {
              // (void) -> VideoStreamSettings
              notImplemented("NetStream.videoStreamSettings");
              return this._videoStreamSettings;
            },
            set: function videoStreamSettings(settings) {
              // (settings:VideoStreamSettings) -> void
              notImplemented("NetStream.videoStreamSettings");
              this._videoStreamSettings = settings;
            }
          }
        }
      }
    }
  };
}).call(this);
