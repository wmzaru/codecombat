pug = require 'pug'
path = require 'path'
cheerio = require 'cheerio'
en = require './app/locale/en'
basePath = path.join(__dirname, 'app')

class BrunchStaticStuff
  constructor: (config) ->
    @locals = config.locals
    @locals ?= {}
  
  handles: /.static.pug$/
  compile: (contents, filename, cb) ->
    console.log "Compile", filename, basePath 
    out = pug.compileClientWithDependenciesTracked contents,
      pretty: true
      filename: filename
      basedir: basePath

    fn = new Function(out.body + '\n return template;')();
    str = fn(@locals);
    
    translate = (key) ->
      html = /^\[html\]/.test(key)
      key = key.substring(6) if html

      t = en.translation
      #TODO: Replace with _.property when we get modern lodash
      path = key.split(/[.]/)
      while path.length > 0
        k = path.shift()
        t = t[k]
        return key unless t?

      return out =
        text: t
        html: html    

    c = cheerio.load(str)
    elms = c('[data-i18n]')
    elms.each (i, e) ->
      i = c(@)
      t = translate(i.data('i18n'))
      if t.html
        i.html(t.text)
      else
        i.text(t.text);

    outFile = filename.replace /.static.pug$/, '.html'
    console.log "Wrote to #{outFile}", out.dependencies

    cb(null, [{filename: outFile, content: c.html()}], out.dependencies)

module.exports = (config) ->
  console.log "Loaded brunch static stuff"
  new BrunchStaticStuff(config)