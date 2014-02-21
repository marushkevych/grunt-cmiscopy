var cmis = require('./cmis');
var util =  require('util');
var cmisSession = cmis.createSession('http://cmis.alfresco.com/cmisbrowser');
//var cmisSession = cmis.createSession('http://alfresco-www-dev.webdev.valuex.com/alfresco/cmisbrowser');
cmisSession.setCredentials('admin', 'admin');


// workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e;1.0
// workspace://SpacesStore/496d618c-82b8-459e-8d07-46053d8b6aa5;1.20

function defaultErrorHandler(err) {
    console.log(util.inspect(err,  { depth: null }))
}
cmisSession.setGlobalHandlers(defaultErrorHandler, defaultErrorHandler);

cmisSession.loadRepositories().ok(function() {
//    cmisSession.checkOut('workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e').ok(function(data) {
//        console.log(util.inspect(data,  { depth: null }))
//
//    });



    
    cmisSession.checkIn(
            'workspace://SpacesStore/6556375c-5d8f-4eb9-a662-c37fab12f04e;pwc', 
            true, 
            null, 
            'checking in... using corect mim type' ,
            'testing checking using corect mim type',
            null,
            null,
            null,
            null,
            'text/plain').ok(function(data) {
        console.log(util.inspect(data,  { depth: null }))

    });
    
//    cmisSession.getObjectByPath('/Sites/f2.txt').ok(function(data) {
//        console.log(util.inspect(data,  { depth: null }))
//
//    });
});


