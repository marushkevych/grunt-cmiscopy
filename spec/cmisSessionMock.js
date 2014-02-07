var CmisRequestMock = require('./CmisRequestMock');

exports.setCredentials = function(username, password){};

exports.loadRepositories = function(){ return new CmisRequestMock(true)};

exports.getObjectByPath = function(){};