const { compile, compileToWxml } = require('./build')
const loaderUtils = require('loader-utils');
const qs = require('querystring')
var format = require('pretty');

module.exports = function (source) {
  this.cacheable && this.cacheable();
  try {
    const options = loaderUtils.getOptions(this) || {}
    const query = qs.parse(this.resourceQuery)
    if(query && !query['lang']) {
      const compiled = compile(source, {})
      const output = compileToWxml(compiled, {})
      return parse_html_tag(format(output.code, {ocd: true}), options.publicPath);
      // return output.code
    }
    return source;
  }
  catch (err) {
    console.error(err)
    this.emitError(err);
    return null;
  }
};

function parse_html_tag( fileContent, publicPath ) {
  fileContent = fileContent.replace( /((<img[^<>]*?\s+src)|(<image[^<>]*?\s+src))=\\?["']?[^'"<>+]+?\\?['"][^<>]*?>/ig, function( str )
  {
    var reg = /((src)|(href))=\\?['"][^"']+\\?['"]/i;
    var regResult = reg.exec( str );
    if( !regResult ) return str;

    var attrName = /\w+=/.exec( regResult[ 0 ] )[ 0 ].replace( '=', '' );
    var imgUrl = regResult[ 0 ].replace( attrName + '=', '' ).replace( /[\\'"]/g, '' );

    if( !imgUrl ) return str; // 避免空src引起编译失败

    // 绝对路径的图片不处理 http://、 https://、 //
    if( /^(https?:)?[\/]{2}/.test( imgUrl ) ) {
      return str;
    }

    // 限制处理图片类型
    if( !/\.(png|jpe?g|gif|svg)/i.test( imgUrl ) ) {
      return str;
    }

    // 前置 ./
    if( !(/^[\.\/]/).test( imgUrl ) )
    {
      imgUrl = './' + imgUrl;
    }
    const res = str.replace( reg, attrName + '="' + publicPath + imgUrl + '"')
    return res;
  } );

  return fileContent;
}