

describe("FileUtils", function() {
    
    beforeEach(function() {
        cmisSession = {
            getContentStreamURL: jasmine.createSpy('getContentStreamURL').andReturn("./test.txt")
        };
    });    
    
    describe("download action", function(){
        it("should download file if doesnt exist locally", function(){
            
        });
    });
});

