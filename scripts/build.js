import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const entryFile = path.resolve(projectRoot, 'src/main.js');
const outputFile = path.resolve(projectRoot, 'dist/app.js');

const moduleCache = new Map();
const order = [];

function toModuleId(file) {
  return path.relative(projectRoot, file).split(path.sep).join('/');
}

function resolveImport(specifier, fromFile) {
  const baseDir = path.dirname(fromFile);
  let resolved = specifier;
  if (!specifier.endsWith('.js')) {
    resolved = `${specifier}.js`;
  }
  const absPath = path.resolve(baseDir, resolved);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Impossibile risolvere l'import ${specifier} da ${fromFile}`);
  }
  return absPath;
}

function transformModule(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let code = raw;
  const deps = [];

  const importRegex = /import\s+([\s\S]*?)\s+from\s+['\"]([^'\"]+)['\"];?/g;
  code = code.replace(importRegex, (match, clause, spec) => {
    const depPath = resolveImport(spec, file);
    deps.push(depPath);
    const depId = toModuleId(depPath);
    const normalizedClause = clause.replace(/\s+/g, ' ').trim();
    return `const ${normalizedClause} = require('${depId}');`;
  });

  const hoisted = new Set();

  const exportFunctionRegex = /export\s+(async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  code = code.replace(exportFunctionRegex, (match, asyncPart = '', name) => {
    hoisted.add(name);
    const asyncKeyword = asyncPart ? 'async ' : '';
    return `${asyncKeyword}function ${name}(`;
  });

  const exportClassRegex = /export\s+class\s+([a-zA-Z0-9_$]+)/g;
  code = code.replace(exportClassRegex, (match, name) => {
    hoisted.add(name);
    return `class ${name}`;
  });

  const exportVarRegex = /export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)(\s*=)/g;
  code = code.replace(exportVarRegex, (match, kind, name, rest) => {
    hoisted.add(name);
    return `${kind} ${name}${rest}`;
  });

  const exportDestructureRegex = /export\s+(const|let|var)\s+\{([^}]+)\}\s*=\s*/g;
  code = code.replace(exportDestructureRegex, (match, kind, names) => {
    const parts = names.split(',').map((p) => p.trim()).filter(Boolean);
    parts.forEach((name) => hoisted.add(name));
    return `${kind} {${names}} = `;
  });

  const exportListRegex = /export\s*\{\s*([^}]+)\s*\};?/g;
  code = code.replace(exportListRegex, (match, names) => {
    const parts = names.split(',').map((p) => p.trim()).filter(Boolean);
    const statements = parts.map((part) => {
      if (!part) {
        return '';
      }
      if (part.includes(' as ')) {
        const [orig, alias] = part.split(/\s+as\s+/);
        return `exports.${alias.trim()} = ${orig.trim()};`;
      }
      return `exports.${part} = ${part};`;
    });
    return statements.filter(Boolean).join('\n');
  });

  if (hoisted.size > 0) {
    const lines = Array.from(hoisted).map((name) => `exports.${name} = ${name};`);
    code += `\n${lines.join('\n')}\n`;
  }

  return { code, deps };
}

function collect(file) {
  const abs = path.resolve(file);
  if (moduleCache.has(abs)) {
    return moduleCache.get(abs).id;
  }
  const id = toModuleId(abs);
  const { code, deps } = transformModule(abs);
  moduleCache.set(abs, { id, code, deps });
  order.push(abs);
  deps.forEach((dep) => collect(dep));
  return id;
}

function build() {
  if (!fs.existsSync(path.dirname(outputFile))) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  }

  const entryId = collect(entryFile);

  const modules = order.map((file) => {
    const { id, code } = moduleCache.get(file);
    return { id, code };
  });

  const indentLines = (lines, indent = '    ') =>
    lines
      .map((line) => `${indent}${line}`)
      .join('\n');

  const moduleBlocks = modules.map(({ id, code }) => {
    const blockLines = [`'${id}': function(require, exports) {`];
    const codeLines = code.split('\n');
    blockLines.push(...codeLines);
    blockLines.push('}');
    return indentLines(blockLines);
  });

  const bundleLines = [
    '(() => {',
    '  const modules = {',
    moduleBlocks.join(',\n'),
    '  };',
    '  const cache = {};',
    '  function localRequire(id) {',
    '    if (cache[id]) {',
    '      return cache[id];',
    '    }',
    '    if (!modules[id]) {',
    "      throw new Error('Modulo non trovato: ' + id);",
    '    }',
    '    const module = { exports: {} };',
    '    cache[id] = module.exports;',
    '    modules[id](localRequire, module.exports);',
    '    return module.exports;',
    '  }',
    `  localRequire('${entryId}');`,
    '})();',
    ''
  ];

  fs.writeFileSync(outputFile, bundleLines.join('\n'), 'utf8');
}

build();
