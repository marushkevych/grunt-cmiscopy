// CmisRequestMock constractor 
module.exports = function(){
    
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



