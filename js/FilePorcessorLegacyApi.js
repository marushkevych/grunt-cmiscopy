module.exports = function(cmisSession, fileUtils, options, cmisPath, localPath, action) {

    function process(object, callback) {
        if (object.objects == null) {
            // if collection is empty - it must be a file
            processSingleFile(callback);
        } else {
            // its a folder
            processFolder(cmisPath, object, callback);
        }
    }

};


