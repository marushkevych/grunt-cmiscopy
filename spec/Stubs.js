var BufferReader = require('../js/BufferStreams').BufferReader;

// CmisRequestMock constructor 
exports.CmisRequestMock = function(){
    
//    this.notOkCallback = function(reason){
//        console.log('default error handler', reason);
//    }
    
    this.ok = function(callback){
        this.okCallback = callback;
        return this;
    };
    
    this.notOk = function(callback){
        this.notOkCallback = callback;
        return this;
    };

    this.error = function(callback){
        this.errorCallback = callback;
        return this;
    };
    
    this.resolve = function(result){
        var that = this;
        process.nextTick(function(){
            that.okCallback(result);
        });
        return this;
    };
    
    this.reject = function (reason){
        var that = this;
        process.nextTick(function (){
            that.notOkCallback(reason);
        });
        return this;
    };
    
    this.fail = function(error){
        var that = this;
        process.nextTick(function(){
            that.errorCallback(error);
        });
        return this;
    };
    
};


exports.httpStub = {
    eventHandlers: {},
    get: function(options, callback) {
        this.callback = callback;
        var that = this;
        return {
            on: function(event, handler) {
                that.eventHandlers[event] = handler;
            }
        };
    },
    resolve: function(content, statusCode) {
        // stream content
        var stream = new BufferReader(new Buffer(content));
        stream.statusCode = statusCode;
        this.callback(stream);
    },
    reject: function(reason) {
        // call 'error' even handler
        this.eventHandlers.error({message: reason});
    },
    reset: function() {
        this.eventHandlers = {};
        this.callback = null;
    }
};

exports.fsStub = {
    readFile: function(path, callback) {
        this.callback = callback;
    },
    resolve: function(content) {
        this.callback(null, content);
    },
    reject: function(reason) {
        this.callback(reason);
    },
    reset: function() {
        this.callback = null;
    }
};

