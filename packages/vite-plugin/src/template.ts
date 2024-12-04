import {
  JSXAttribute,
  JSXChild,
  JSXElement,
  JSXExpression,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  parseAsync,
  ParseResult,
  Program,
  Statement,
} from 'oxc-parser';
import { generate } from 'escodegen';
import MagicString from 'magic-string';

interface CodeUpdate {
  type: 'if' | 'for';
  block: {
    start: number;
    end: number;
  };
  target: {
    start: number;
    end: number;
  };
  expression: {
    start: number;
    end: number;
  };
}

const templateRegex = /<template>([\s\S]*?)<\/template>/gim;

const IF = '$if';
const FOR = '$for';

/**
 * Extracts template content from the provided code string using a regular expression.
 *
 * @param code - The code string from which to extract the template content.
 * @returns The extracted template content as a single string, with each match joined by a newline character.
 */
export const extractTemplate = (code: string) => {
  const matches = code.matchAll(templateRegex);
  if (!matches) {
    return '';
  }
  return matches
    .map(match => match[1])
    .toArray()
    .join('\n');
};

/**
 * Extracts the data for `$if` or `$for` directives from a given JSX element.
 *
 * This function filters the attributes of the JSX element to find any that match
 * the `$if` or `$for` directives. It ensures that only one of these directives
 * is present on the element and returns the relevant data for the directive.
 *
 * @param ast - The JSX element node to extract directive data from.
 * @returns An object containing the directive attribute and its expression's
 *          start and end positions, or `undefined` if no directive is found.
 * @throws Will throw an error if more than one `$if` or `$for` directive is found.
 */
const getIfOrForDirectiveData = (node: JSXElement) => {
  const attrs = node.openingElement.attributes.filter(
    attr =>
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      (attr.name.name === IF || attr.name.name === FOR),
  );

  if (attrs.length === 0) {
    return;
  }

  if (attrs.length > 1) {
    throw new Error('Only one $if or $for directive is allowed per element, and you cannot have both at the same time');
  }

  const attribute = attrs[0] as JSXAttribute;
  const { start: expressionStart, end: expressionEnd } = (attribute.value as JSXExpressionContainer).expression;

  return {
    directive: attribute,
    target: {
      start: attribute.start,
      end: attribute.end,
    },
    expression: {
      start: expressionStart,
      end: expressionEnd,
    },
  };
};

/**
 * Traverses a JSX element node and collects code updates based on specific directives.
 *
 * @param node - The JSX element node to traverse.
 * @returns An array of code updates found within the node and its children.
 */
const traverseElement = (node: JSXElement) => {
  const codeUpdates: Array<CodeUpdate> = [];

  if ((node.type === 'JSXElement' || node.type === 'JSXFragment') && node.children.length > 0) {
    const childrenUpdates = node.children.map(child => traverseElement(child as JSXElement)).flat();
    codeUpdates.push(...childrenUpdates);
  }

  if (node.type === 'JSXElement') {
    const directiveData = getIfOrForDirectiveData(node);

    if (directiveData) {
      const { directive, target, expression } = directiveData;
      const isIf = (directive.name as JSXIdentifier).name === IF;
      codeUpdates.push({
        type: isIf ? 'if' : 'for',
        block: {
          start: node.start,
          end: node.end,
        },
        target,
        expression,
      });
    }
  }

  return codeUpdates;
};

/**
 * Traverses a given statement node and collects code updates.
 *
 * This function processes different types of statement nodes and recursively
 * traverses their child nodes to gather all necessary code updates.
 *
 * @param node - The statement node to traverse.
 * @returns An array of code updates collected from the traversal.
 */
const traverseStatement = (node: Statement) => {
  const codeUpdates: Array<CodeUpdate> = [];

  if (node.type === 'ExpressionStatement') {
    const statementUpdates = traverseElement(node.expression as JSXElement);
    codeUpdates.push(...statementUpdates);
  } else if (node.type === 'BlockStatement') {
    const statementUpdates = node.body.map(traverseStatement).flat();
    codeUpdates.push(...statementUpdates);
  }

  return codeUpdates;
};

export default async (code: string, isTs = false) => {
  const template = code.trim().startsWith('<>') ? extractTemplate(code) : `<>${extractTemplate(code)}</>`;

  // Parse the template
  const ast = await parseAsync(template, {
    sourceType: 'module',
    sourceFilename: `template.${isTs ? 'tsx' : 'jsx'}`,
  });

  if (ast.errors.length > 0) {
    throw new Error(ast.errors.join('\n'));
  }

  // Traverse the AST to find all the code updates needed
  const codeUpdates = ast.program.body.map(traverseStatement).flat();

  // Apply the code updates to the template
  const magicString = new MagicString(template);
  for (const { block, target, expression, type } of codeUpdates) {
    // Remove the directive
    magicString.remove(target.start - 1, target.end);

    // Extract the expression content
    const expressionContent = template.slice(expression.start, expression.end);

    // Replace the block with the correct syntax
    if (type === 'if') {
      // Remove the expression
      magicString.prependLeft(block.start, `{(${expressionContent}) && (`);
      magicString.appendRight(block.end, ')}');
    } else if (type === 'for') {
      // Remove the expression
      const [leftPart, rightPart] = expressionContent.split(' in ');
      magicString.prependLeft(block.start, `{${rightPart}.map(${leftPart} => (`);
      magicString.appendRight(block.end, '))}');
    }
  }

  // Replace class with className
  magicString.replace(/[\s]class=(["'])/g, ' className=$1');

  return magicString.toString();
};
