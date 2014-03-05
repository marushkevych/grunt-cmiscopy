var resumer = require('resumer');

// CmisRequestMock constractor 
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
    
    this.reject = function(reason){
        var that = this;
        process.nextTick(function(){
            that.notOkCallback(reason);
        });
        return this;
    };
    
};


exports.httpStub = {
    heventHandlers: {},
    get: function(options, callback) {
        this.callback = callback;
        var that = this;
        return {
            on: function(event, handler) {
                that.heventHandlers[event] = handler;
            }
        };
    },
    resolve: function(content, statusCode) {
        // stream content
        var stream = resumer().queue(content).end();
        stream.statusCode = statusCode;
        this.callback(stream);
    },
    reject: function(reason) {
        // call 'error' even handler
        this.heventHandlers.error({message: reason});
    },
    reset: function() {
        this.heventHandlers = {};
        this.callback = null;
    }

};



