const fs = require('fs');
const path = require('fs');
const ts = require('typescript');

const VN_REGEX =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÙÚỦŨỤƯỪỨỬỮỰÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢỲÝỶỸỴĐ]/;

const STRING_NODE_TYPE = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.TemplateExpression,
  ts.SyntaxKind.JsxText,
]);

const tFunc = 't';

/**
 * @param {string} indir
 * @param {string} path
 * @returns {string}
 */
const depImport = (indir, path) => {
  path = path.replace(`${indir}/`, '');
  const level = path.split('/').length - 2;
  return `import { t } from '${'../'.repeat(level)}i18n';`;
};

/**
 * @param {string} namespace
 * @returns {string}
 */
const getTFuncFrompackage = (namespace) => `
import i18next, { TOptions, StringMap } from 'i18next';

export const NAMESPACE = '${namespace}';

export const t = (keys: string | string[], options?: TOptions<StringMap>): string => {
  return i18next.t(keys, {...options, ns: NAMESPACE})
}`;

/**
 * @param {string} namespace
 * @returns {string}
 */
function normalizeText(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\n/g, '')
    .replace(/^\"(.*)\"$/, '$1')
    .replace(/^\'(.*)\'$/, '$1')
    .replace(/`/g, '')
    .trim();
}

/**
 * @param {import('typescript').Node} _
 * @param {import('typescript').Node} parent
 * @returns {boolean}
 */
function isJsxExpression(_, parent) {
  return [
    ts.SyntaxKind.JsxAttribute,
    ts.SyntaxKind.JsxElement,
    ts.SyntaxKind.JsxFragment,
  ].includes(parent.kind);
}

/**
 * @param {import('typescript').NodeFactory} factory
 * @param {string} key
 * @returns {import('typescript').Expression}
 */
function handleStringLiteral(factory, key) {
  return factory.createCallExpression(
    factory.createIdentifier(tFunc),
    undefined,
    [factory.createStringLiteral(`${key}`)],
  );
}

/**
 * @param {import('typescript').NodeFactory} factory
 * @param {import('typescript').Node} node
 * @param {import('typescript').SourceFile} sourceFile
 * @typedef {Object} Dict
 * @property {string} text
 * @property {import('typescript').Expression} t
 * @returns {Dict}
 */
function handleTemplateExpression(factory, node, sourceFile) {
  let text = normalizeText(node.getText(sourceFile));
  let idx = 0;
  const vars = node.templateSpans.map((item) => item.expression);

  const mapping = new Map();
  for (const v of vars) {
    const expName = normalizeText(v.getText(sourceFile));
    let newName = expName;
    if (expName.includes(' ')) {
      newName = `var${idx++}`;
    } else if (newName.includes('.')) {
      newName = expName
        .replace(/\?/g, '')
        .split('.')
        .map((item) => item[0].toUpperCase() + item.slice(1))
        .join('');
    }
    mapping.set(v, newName);
    text = text
      .replace(`\${${expName}}`, `{{${newName}}}`)
      .replace(`\${ ${expName} }`, `{{${newName}}}`);
  }

  return {
    t: factory.createCallExpression(
      factory.createIdentifier(tFunc),
      undefined,
      [
        factory.createStringLiteral(`${text}`),
        factory.createObjectLiteralExpression(
          vars.map((v) =>
            factory.createPropertyAssignment(
              factory.createStringLiteral(mapping.get(v)),
              v,
            ),
          ),
        ),
      ],
    ),
    text,
  };
}

/**
 * @param {string} indir
 * @param {string} fileName
 * @param {string} outdir
 * @returns {{[key: string]: string}}
 */
function transform(fileName, indir, outdir) {
  let idx = 0;
  let needTFunc = false;
  const prefixKey = fileName
    .replace(`${indir}/`, '')
    .replace(/\//g, '.')
    .replace('.tsx', '')
    .replace('.ts', '');

  const program = ts.createProgram([fileName], {});
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    return;
  }
  const bulk = {};

  function getKey(value, isTemplate) {
    return value.split(' ').length > 10 && !isTemplate
      ? `${prefixKey}.${idx++}`
      : value;
  }

  /**
   * @param {import('typescript').TransformationContext} context
   * @returns {import('typescript').Transformer<T>}
   */
  function transformerFactory(context) {
    const { factory } = context;
    // sh!t property: node.parent?.kind, it's always undefined
    let parent;

    function visitNode(node) {
      const kind = node.kind;
      if (STRING_NODE_TYPE.has(kind)) {
        const rawText = node.getText(sourceFile);
        if (rawText.match(VN_REGEX)) {
          needTFunc = true;
          const text = normalizeText(rawText);
          let t;
          if (
            kind === SyntaxKind.StringLiteral ||
            kind === SyntaxKind.JsxText
          ) {
            const key = getKey(text, false);
            t = handleStringLiteral(factory, key);
            bulk[key] = text;
          } else {
            const ret = handleTemplateExpression(factory, node, sourceFile);
            bulk[ret.text] = ret.text;
            t = ret.t;
          }

          return isJsxExpression(node, parent)
            ? ts.factory.createJsxExpression(undefined, t)
            : t;
        }
      }

      const oldNode = parent;
      parent = node;
      const ret = ts.visitEachChild(node, visitNode, context);
      parent = oldNode;
      return ret;
    }
    return (rootNode) => ts.visitNode(rootNode, visitNode);
  }

  const result = ts.transform(sourceFile, [transformerFactory]);
  fs.mkdirSync(path.join(outdir, path.dirname(fileName)), {
    recursive: true,
  });
  if (needTFunc) {
    const printer = ts.createPrinter();
    let output = unescape(
      printer.printFile(result.transformed[0]).replace(/\\u/g, '%u'),
    );
    output = `${depImport(fileName)}\n${output}`;
    fs.writeFileSync(path.join(outdir, fileName), output);
  } else {
    fs.copyFileSync(fileName, path.join(outdir, fileName));
  }

  return bulk;
}

/**
 * @param {string} dir
 * @param {string} out
 * @returns {{[key: string]: string}}
 */
function walk(dir, out, ctx) {
  let bulk = {};
  try {
    const entities = fs
      .readdirSync(dir)
      .map((entity) => path.join(dir, entity));

    entities
      .filter(
        (entity) =>
          entity.match(/^.*(\.ts[x]?)$/) &&
          !entity.includes('.stories') &&
          !entity.includes('.test') &&
          !entity.includes('__mocks__') &&
          fs.statSync(entity).isFile(),
      )
      .forEach((entity) => {
        const local = transform(entity, ctx, out);
        bulk = { ...bulk, ...local };
      });

    entities
      .filter((entity) => fs.statSync(entity).isDirectory())
      .forEach((entity) => {
        const ret = walk(entity, out);
        bulk = { ...bulk, ...ret };
      });
    return bulk;
  } catch (e) {
    console.log(`Error when walk on ${dir}`, e);
    return {};
  }
}

function extractTranslation(args) {
  const [src, dest, ns] = args;
  const trans = walk(src, dest, src);
  fs.writeFileSync(
    path.join(dest, 'translation.json'),
    JSON.stringify(trans, null, 2),
  );
  fs.writeFileSync(path.join(dest, 'i18n.ts'), getTFuncFrompackage(ns));
}

module.exports = {
  extractTranslation,
};
