# grunt-cmiscopy

> Copy files and folders to and from CMS.
This plugin wraps [CmisJS](https://npmjs.org/package/cmis) library to provide an easy way to access content in Content Management Systems like Alfresco.
It can be used to author content (download - edit - upload), or to use in automated tests to dynamically download content.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-cmiscopy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cmiscopy');
```

## The "cmiscopy" task

### Overview
In your project's Gruntfile, add a section named `cmiscopy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  cmiscopy: {
    options: {
        url: 'http://alfresco-mycompany.com/alfresco/cmisbrowser',
        cmisRoot: '/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root',
        localRoot: 'src/webapp',
        username: 'admin',
        password: 'admin'
    }
  },
});
```

### Options

#### options.url
Type: `String`
Default value: n/a

A url to connect to your CMS

#### options.cmisRoot
Type: `String`
Default value: n/a

The root folder in CMS that will be mapped to the local folder

#### options.localRoot
Type: `String`
Default value: n/a

The local folder `cmisRoot` is mapped to

#### options.username
Type: `String`
Default value: n/a

username to be used when authenticating with CMS

#### options.password
Type: `String`
Default value: n/a

password to be used when authenticating with CMS

### Usage Examples
`grunt cmiscopy` takes two optional command line parametes: `grunt cmiscopy:path:action`
where 
- `path` is path to file or folder in CMS relative to `options.cmisRoot`
- `action` is an action flag. Currently only 'upload' action flag is supported. (default is 'download'). 

If no parameters provided it will download all content of root folder to local project:
`grunt cmiscopy`  

`grunt cmiscopy:path`           - will download file or entire folder from CMS to local project
`grunt cmiscopy:path:upload`    - will upload file or entire folder to CMS

#### Concrete examples
```grunt cmiscopy:pages```
will download `/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/pages` folder with it's sub-folders to local 
`src/webapp/pages`

```grunt cmiscopy:pages:upload```
will upload local `src/webapp/pages` to CMS `/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/pages`

```grunt cmiscopy:pages/faq.html```
will download `/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/pages/faq.html` file to local `src/webapp/pages/faq.html`

```grunt cmiscopy:pages/faq.html:upload```
will upload local `src/webapp/pages/faq.html` to `/Sites/sitename/documentLibrary/Alfresco Quick Start/Quick Start Editorial/root/pages/faq.html`

### Limitations:
- it will not create new content in CMS
- it will not delete anything

### TODO:
- support for 'checkout' and 'checkin' actions
- creating new content in CMS


## Release History
_(Nothing yet)_
