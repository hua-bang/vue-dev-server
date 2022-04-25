const { readSource } = require('./readSource');
const core = require('@babel/core');
const { transformModuleImports } = require('./transformModuleImports');

class TsxCompiler {
  compile(sourceCode) {
    const { code } = core.transformSync(sourceCode, {
      filename: 'sourceCode.tsx',
      presets: ["@babel/preset-react", "@babel/preset-typescript"],
    });
    return code;
  }

  async compileFileByPath(req) {
    const { source } = await readSource(req);
    const code = transformModuleImports(this.compile(source));
    return code;
  }
}

module.exports = TsxCompiler;