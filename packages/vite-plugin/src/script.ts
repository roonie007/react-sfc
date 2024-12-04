const scriptRegex = /<script(?:\s+lang="[^"]*")?>([\s\S]*?)<\/script>/gim;
const importRegex =
  /import\s+(?:type\s+)?(?:(\*\s+as\s+\w+)|(\w+)|({[^}]*}))?(?:,\s*(\w+))?\s+from\s+['"]([^'"]+)['"];?/g;

export const scriptLang = (code: string) => {
  return /[\s]lang=["']ts["']/i.test(code) ? 'ts' : 'js';
};

export const extractScripts = (code: string) => {
  const result = code.matchAll(scriptRegex) || [];
  if (!result) {
    return;
  }

  const scripts = result.toArray().map(t => ({ script: t[1], lang: scriptLang(t[0]) }));

  const isTs = scripts.some(t => t.lang === 'ts');
  const script = scripts.map(t => t.script).join('\n');

  return { script, lang: isTs ? 'ts' : 'js' };
};

export const removeDuplicateImports = (script: string) => {
  // Map to store imports grouped by module
  const importsMap: Record<string, { default?: string; named: Set<string> }> = {};
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
          .replace(/[{}]/g, '')
          .split(',')
          .map(imp => imp.trim());
        imports.forEach(imp => importsMap[module].named.add(imp));
      }
    } else {
      // Side-effect import (e.g., `import "styles.css"`)
      sideEffectImports.add(match[0].trim());
    }
  }

  // Reconstruct the imports
  const mergedImports = Object.entries(importsMap)
    .map(([module, { default: defaultImport, named }]) => {
      const namedPart = named.size > 0 ? `{ ${Array.from(named).join(', ')} }` : '';
      if (defaultImport && namedPart) {
        return `import ${defaultImport}, ${namedPart} from "${module}";`;
      } else if (defaultImport) {
        return `import ${defaultImport} from "${module}";`;
      } else if (namedPart) {
        return `import ${namedPart} from "${module}";`;
      }
      return '';
    })
    .concat(Array.from(sideEffectImports)) // Add side-effect imports
    .filter(Boolean)
    .join('\n');

  return mergedImports;
};

export const extractImports = (code: string) =>
  code
    .matchAll(importRegex)
    .map(t => t[0])
    .toArray();

export const removeImportsFromCode = (code: string, imports: string[]) => {
  return imports.reduce((acc, imp) => acc.replace(imp, ''), code);
};

export default (code: string) => {
  const { script, lang } = extractScripts(code) || {};
  if (!script) {
    return { imports: [], script: '', lang: 'js' };
  }

  const imports = extractImports(script);
  const cleanScript = removeImportsFromCode(script, imports);
  const cleanImports = removeDuplicateImports([`import React from 'react';`, ...imports].join('\n'));

  return { imports: cleanImports, script: cleanScript, lang };
};
