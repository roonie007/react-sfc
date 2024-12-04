import handleTemplateBlock from './template';
import handleScriptBlock from './script';
import handleStyleBlock from './style';

import type { PluginOption } from 'vite';
import { transform } from 'oxc-transform';

export default function reactSFC(): PluginOption {
  let styleModules: Record<string, string> = {};

  return {
    name: 'vite:react-sfc',
    config(conf) {
      return {
        resolve: {
          extensions: [...(conf.resolve?.extensions || []), '.rc', '.react'],
        },
      };
    },
    configureServer(server) {
      // Add middleware to set the correct Content-Type
      server.middlewares.use((req, res, next) => {
        if (
          req.url &&
          (req.url.endsWith('.rc') ||
            req.url.includes('.rc?import') ||
            req.url.endsWith('.react') ||
            req.url.includes('.react?import'))
        ) {
          res.setHeader('Content-Type', 'text/javascript');
        }
        next();
      });
    },
    resolveId(id) {
      if (id.startsWith('virtual:')) {
        return '\0' + id;
      }

      return null;
    },
    load(id) {
      const moduleId = id.replace('\0', '');
      if (moduleId.startsWith('virtual:')) {
        return styleModules[moduleId];
      }

      return null;
    },
    async transform(code, id) {
      if (!id.endsWith('.rc') && !id.endsWith('.react')) {
        return null;
      }

      const componentName = id.split('/').pop()!.replace('.rc', '').replace('.react', '') + `__SFC`;
      const template = await handleTemplateBlock(code);

      /**
       * Style
       */
      const styles = await handleStyleBlock(code);
      const styleImports: string[] = [];
      styleModules = {};

      if (styles.length > 0) {
        for (const [index, { lang, style }] of styles.entries()) {
          const name = `virtual:${lang}-${index}.${lang.toLowerCase()}`;
          styleModules[name] = style;

          styleImports.push(`import "${name}";`);
        }
      }
      /**
       * Script
       */

      const { script = '', imports = [], lang = 'js' } = handleScriptBlock(code);

      let finalCode = `${imports}
${styleImports.join('\n')}
`;

      if (script.includes('/**__REACT_SFC_APP__**/')) {
        finalCode += script.replace('/**__REACT_SFC_APP__**/', template);
      } else {
        finalCode += `
const ${componentName} = () => {
  ${script}

  return ( ${template} );
};

export default ${componentName};
`;
      }

      /**
       * Transform the code
       */
      const transformedCode = transform(`${componentName}.${lang[0]}sx`, finalCode);

      if (transformedCode.errors.length > 0) {
        throw new Error(transformedCode.errors.join('\n'));
      }

      return {
        code: transformedCode.code,
        map: null,
      };
    },
  };
}
