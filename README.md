pancakes-angular
========

The purpose of this plugin is render HTML and generate JavaScript code that uses AngularJS syntax on
both the client and server. There are three major pieces to this repo:

1. transformers - A set of node.js modules that are used by a command line tool (i.e. gulp) to transform
pancakes modules to client side AngularJS code. See gulp-pancakes for details on how to run the command line tool.
1. ngapp - A set of AngularJS services and providers used by the generated pancakes code.
1. middleware - These modules are are used by the server side framework to generate HTML on the server side from
templates that contain AngularJS markup.

## Installation

TBD

```
npm install pancakes-angular
```

## Transformers

The idea behind the transformers is simple. Take isomorphic code and transform it into client side code.
The steps are as follows:

1. Have gulp (or another build tool) send in the file with some meta data about the type of tranformation that is needed.
1. Gulp will forward this to the appropriate transformer.
1. That transformer will then take combine data and code from the input file with a doT template.
1. The resulting code that is generated is outputed to a file.
1. Gulp can then concat and minify all the files into one package that is sent down to the client.

## ngapp

Much of the code here can/should be overriden by an app written on top of pancakes. However, there are a couple
key pieces that are used as the foundation of the generated code. This includes:

* tpl.helper - There are a number of patterns used which are simplified through the use of this utility. Instead
of generating duplicate code, common patterns are abstracted into this utility so that the generated code is just
the DRY input into this utility. For example, setting default values in a controller.
* state.loader - This utility is used within the config section to load a route configuration into the UI Router
* generic.directives - There are a number of auto-generated directives that are missing from Angular. These
directives are used to set the values of other attributes (or the inner HTML) and come in the following forms:
    * f- : These will run the string value through either the i18n or staticFile filter as appropriate.
    For example, f-src="/yo" would result in src="http://www.pathtocdn.com/yo" or f-placeholder="hello" in a spanish context would result in placeholder="hola".
    * b- : These will bind a value to the target attribute. This is similiar to ng-bind but for other values such as b-placeholder="variable1".
    * bf- : This does a bind and then does a filter.
    * bo- or bfo- : This will do the same as b- or bf- above except the bind will be a one time binding.
* ajax - Wraps $http and is used by generated service and model code to make API calls.
* client.event.bus - This service uses a scope to facilitate event communication throughout the app.

## middleware

The first thing to realize with rendering AngularJS on the server is that we are only interested in rendering
the initial page. We don't care about any AngularJS code executed after the initial load or which is only
used to help bootstrap AngularJS on the client.

Also, certain things like routing and utilities (i.e. AngularJS services) are developed in a generic way (see
panckes documentation for more details on these), so there is no need for doing an Angular-specific translation.

What is left then?

1. Filters - We need to use filters on the client and the server. lib/middleware/jng.filters will simply add all the
filters to the model so they are accessible as the page is rendered.
1. Directives - For performance and decoupling, all directives are registered with the template engine (Jangular)
as soon as the system starts. This means that the template objects for all partials in your app will be in memory at
all times. When a page renders, the template object will be married with a model in order to generate HTML.
1. Pages - Unlike directives, pages are not compiled until runtime. lib/middleware/jng.pages will render the page along
with any directives it uses and then (optionally) put the resulting HTML inside a layout. There are a couple variations
of how this can work.



