var cmis = require('cmis');
var util =  require('util');
var cmisSession = cmis.createSession('http://cmis.alfresco.com/cmisbrowser');
cmisSession.setCredentials('admin', 'admin');


// workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e;1.0
// workspace://SpacesStore/496d618c-82b8-459e-8d07-46053d8b6aa5;1.20

function defaultErrorHandler(err) {
    console.log(util.inspect(err.body,  { depth: null }));
}
cmisSession.setGlobalHandlers(defaultErrorHandler, defaultErrorHandler);

cmisSession.loadRepositories().ok(function() {
    
    
    cmisSession.checkOut('workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e').ok(function(object) {
        console.log(util.inspect(object,  { depth: null }));

        cmisSession.checkIn(
                'workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e;pwc', 
                true, 
                null, 
                'checking in... using correct mime type' + new Date(),
                'testing checking using correct mime type' + new Date(),
                null,
                null,
                null,
                {mimeType: object.succinctProperties['cmis:contentStreamMimeType']}).ok(function(data) {
            console.log(util.inspect(data,  { depth: null }));

        });
    });
    
});


