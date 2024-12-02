import { pascalCase } from "case-anything";
import type { PluginOption } from "vite";
import * as babel from "@babel/core";
import * as babelParser from "@babel/parser";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";

import * as ts from "recast/parsers/babel-ts";

const templateRegex = /<template>([\s\S]*?)<\/template>/gim;
const scriptRegex = /<script(?:\s+lang="[^"]*")?>([\s\S]*?)<\/script>/gim;
const styleRegex = /<style(?:\s+lang="[^"]*")?>([\s\S]*?)<\/style>/gim;

const importsRegex =
  /import\s+((?:[^\n{}]+|{[^}]*})\s+from\s+['"][^'"]+['"]|['"][^'"]+['"]);?/gim;

export default function reactSFC(): PluginOption {
  let styleModules: Record<string, string> = {};

  return {
    name: "vite:react-sfc",
    resolveId(id) {
      if (id.startsWith("virtual:")) {
        return "\0" + id;
      }

      return id;
    },
    load(id) {
      const moduleId = id.replace("\0", "");
      if (moduleId.startsWith("virtual:")) {
        return styleModules[moduleId];
      }

      return null;
    },
    transform(code, id) {
      if (!id.endsWith(".rc")) {
        return null;
      }

      let finalCode = "";

      const template = extractTemplates(code);
      let { imports, script, lang: scriptLang } = extractScripts(code);
      const styles = extractStyles(code);

      const componentName = pascalCase(
        id.split("/").pop()?.replace(".rc", "") || ""
      );

      /**
       * Styles
       */

      styleModules = {};

      if (styles) {
        for (const [index, { lang, style }] of styles.entries()) {
          const name = `virtual:${lang}-${index}.${lang.toLowerCase()}`;
          styleModules[name] = style;

          imports += `\nimport "${name}";`;
        }
      }

      /**
       * Script
       */

      // Process the template to handle $if attributes

      if (script.includes("/**__REACT_SFC_APP__**/")) {
        finalCode = `
import React from "react";
${imports}

const ${componentName} = () => {
  ${script.replace(
    "/**__REACT_SFC_APP__**/",
    `
  <>
    ${template}
  </>`
  )}
};

${componentName}();
`;
      } else {
        finalCode = `
import React from "react";
${imports}

const ${componentName} = () => {
  ${script}

  return (<>
    ${template}
  </>)
};

export default ${componentName};
        `;
      }

      finalCode = processTemplate(finalCode);

      console.debug("---------------------------------------------------");
      console.debug("---------------------------------------------------");
      console.debug("---------------------------------------------------");
      console.debug(id);
      console.debug(finalCode);

      const plugins = [];
      if (scriptLang === "ts") {
        plugins.push(["@babel/plugin-transform-typescript", { isTSX: true }]);
      }

      const result = babel.transformSync(finalCode, {
        filename: id,
        presets: ["@babel/preset-react", "@babel/preset-typescript"],
        plugins,
      });

      if (!result) {
        return null;
      }

      return {
        code: result.code?.toString(),
        map: null,
      };
    },
  };
}

export const processTemplate = (template: string): string => {
  const ast = recast.parse(template, { parser: ts });

  recast.visit(ast, {
    visitJSXElement(path) {
      this.traverse(path);

      const node = path.node;

      // Find $if attribute
      const ifAttrIndex = node.openingElement.attributes?.findIndex(
        (attr) => n.JSXAttribute.check(attr) && attr.name.name === "$if"
      );

      if (ifAttrIndex !== undefined && ifAttrIndex >= 0) {
        // Found $if attribute
        const ifAttr = node.openingElement.attributes?.[
          ifAttrIndex
        ] as n.JSXAttribute;

        // Get the condition expression
        let conditionExpression: n.Expression;

        if (n.JSXExpressionContainer.check(ifAttr.value)) {
          conditionExpression = ifAttr.value.expression as n.Expression;
        } else if (n.StringLiteral.check(ifAttr.value)) {
          conditionExpression = b.stringLiteral(ifAttr.value.value);
        } else {
          throw new Error("Invalid $if attribute value");
        }

        // Remove the $if attribute
        node.openingElement.attributes?.splice(ifAttrIndex, 1);

        // Wrap the element in a conditional expression
        const conditionalExpression = b.jsxExpressionContainer(
          b.logicalExpression("&&", conditionExpression, node)
        );

        // Replace the current node with the conditional expression
        path.replace(conditionalExpression);
      }

      // No need to traverse further; we already did at the beginning
      return false;
    },
  });

  const transformedCode = recast.print(ast).code;

  // Remove the outer fragment
  const codeWithoutFragment = transformedCode.replace(/^<>|<\/>$/g, "");

  return codeWithoutFragment;
};

export const extractTemplates = (code: string) => {
  const templates = code.matchAll(templateRegex);
  if (!templates) {
    return null;
  }

  return templates
    .map((t) => t[1])
    .toArray()
    .join("\n")
    .replace(/class="/g, 'className="');
};

export const removeDuplicateImports = (script: string) => {
  const importRegex =
    /import\s+(?:(\w+)|({[^}]*}))?(?:,\s*(\w+))?\s+from\s+['"]([^'"]+)['"];?/g;

  // Map to store imports grouped by module
  const importsMap: Record<string, { default?: string; named: Set<string> }> =
    {};
  const sideEffectImports: Set<string> = new Set();

  let match;

  while ((match = importRegex.exec(script)) !== null) {
    const defaultImport = match[1]?.trim(); // Default import (e.g., `React`)
    const namedImports = match[2]?.trim(); // Destructured imports (e.g., `{ useState }`)
    const mixedImport = match[3]?.trim(); // Mixed import (e.g., `ReactDOM`)
    const module = match[4]?.trim(); // Module name (e.g., `"react"`)

    if (module) {
      importsMap[module] = importsMap[module] || { named: new Set() };

      // Add default import
      if (defaultImport) {
        importsMap[module].default = defaultImport;
      }

      // Add mixed import
      if (mixedImport) {
        importsMap[module].default = mixedImport;
      }

      // Add named imports
      if (namedImports) {
        const imports = namedImports
          .replace(/[{}]/g, "")
          .split(",")
          .map((imp) => imp.trim());
        imports.forEach((imp) => importsMap[module].named.add(imp));
      }
    } else {
      // Side-effect import (e.g., `import "styles.css"`)
      sideEffectImports.add(match[0].trim());
    }
  }

  // Reconstruct the imports
  const mergedImports = Object.entries(importsMap)
    .map(([module, { default: defaultImport, named }]) => {
      const namedPart =
        named.size > 0 ? `{ ${Array.from(named).join(", ")} }` : "";
      if (defaultImport && namedPart) {
        return `import ${defaultImport}, ${namedPart} from "${module}";`;
      } else if (defaultImport) {
        return `import ${defaultImport} from "${module}";`;
      } else if (namedPart) {
        return `import ${namedPart} from "${module}";`;
      }
      return "";
    })
    .concat(Array.from(sideEffectImports)) // Add side-effect imports
    .filter(Boolean)
    .join("\n");

  return mergedImports;
};

export const scriptLang = (code: string) => {
  if (code.includes('lang="ts"') || code.includes("lang='ts'")) {
    return "ts";
  }

  return "js";
};

export const styleLang = (code: string) => {
  if (code.includes('lang="scss"') || code.includes("lang='scss'")) {
    return "scss";
  } else if (code.includes('lang="less"') || code.includes("lang='less'")) {
    return "less";
  } else if (code.includes('lang="stylus"') || code.includes("lang='stylus'")) {
    return "stylus";
  }

  return "css";
};

export const extractScripts = (code: string) => {
  const result = code.matchAll(scriptRegex) || [];

  const scripts = result.toArray();

  let imports = "";
  const data = scripts.map((t) => ({ script: t[1], lang: scriptLang(t[0]) }));

  let script = data.map((t) => t.script).join("\n");

  const importsResult = script.matchAll(importsRegex);
  if (importsResult) {
    imports = removeDuplicateImports(
      importsResult
        .toArray()
        .map((i) => i[0])
        .join("\n")
    );
    script = script.replace(importsRegex, "");
  }

  const isTs = data.some((t) => t.lang === "ts");

  return { imports, script, lang: isTs ? "ts" : "js" };
};

export const extractStyles = (code: string) => {
  const result = code.matchAll(styleRegex);
  if (!result) {
    return null;
  }

  return result.toArray().map((t) => {
    return { style: t[1], lang: styleLang(t[0]) };
  });
};
