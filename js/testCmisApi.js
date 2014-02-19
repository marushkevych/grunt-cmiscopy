var cmis = require('cmis');

var cmisSession = cmis.createSession('http://cmis.alfresco.com/cmisbrowser');
cmisSession.setCredentials('admin', 'admin');

function defaultErrorHandler(err) {
    console.log(err);
}
cmisSession.setGlobalHandlers(defaultErrorHandler, defaultErrorHandler);

cmisSession.loadRepositories().ok(function() {
    cmisSession.getObjectByPath('/Sites/f1.txt').ok(function(data) {
        console.log(require('util').inspect(data,  { depth: null }))

    });
});


