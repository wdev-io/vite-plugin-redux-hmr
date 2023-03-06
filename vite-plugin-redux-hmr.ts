import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import { normalizePath, Plugin, PluginOption } from 'vite';
import MagicString from 'magic-string';

export type ReduxHmrOptions = {
  /**
   * Path of your store index file, including file extension, relative to your project root (required).
   * @example "src/store/index.ts"
   */
  storeIndexFilePath: string;

  /**
   * Path of your store reducers index file, including file extension, relative to your project root (required).
   * @example "src/store/reducers/index.ts"
   */
  storeReducersFilePath: string;

  /**
   * Name of your store variable. In case this option is not provided defaults to "store".
   * @default "store"
   * @example "myCustomStore"
   */
  storeVariableName?: string;

  /**
   * Stringified version of your reducers wrapping function.
   * Used in case you use some top-level reducer wrapping your reducers (like with Redux Remember's rememberReducer()).
   * @note This can use your imported variables on top of your file. See example for more details.
   * @default "(reducers) => reducers"
   * @example "(reducers) => rememberReducer(reducers)"
   */
  wrapReducersFunction?: string;
};

const header = 'import { combineReducers } from \'redux\';';
const footer = `
if (import.meta.hot) {
  import.meta.hot.accept('__SOURCE__', (reducers) => {
    const wrappedReducers = (__WRAP__)(reducers.default);
    __VAR__.replaceReducer(typeof wrappedReducers === 'function'
      ? wrappedReducers
      : combineReducers(wrappedReducers)
    );
  });
}
`.replace(/\n+/g, '');

const vitePluginReduxHmr = (options: ReduxHmrOptions): PluginOption => {
  let storeIndexFilePath: string;
  let storeReducersFilePath: string;

  const pluginInstance: Plugin = {
    name: 'vite:redux-hmr-refresh',
    enforce: 'pre',
    config(userConfig) {
      const projectRoot = userConfig.root
        ? path.resolve(userConfig.root)
        : process.cwd();

      storeIndexFilePath = path.isAbsolute(options.storeIndexFilePath)
        ? options.storeIndexFilePath
        : normalizePath(
          path.resolve(`${projectRoot}/${options.storeIndexFilePath}`)
        );

      storeReducersFilePath = path.isAbsolute(options.storeReducersFilePath)
        ? options.storeIndexFilePath
        : normalizePath(
          path.resolve(`${projectRoot}/${options.storeReducersFilePath}`)
        );
    },
    configResolved(config) {
      if (!fs.existsSync(storeIndexFilePath)) {
        config.logger.warn(
          `[vite-plugin-redux-hmr] Store index file "${storeIndexFilePath}" not found.`
          + '\n[vite-plugin-redux-hmr] Make sure to fix the "storeIndexFilePath" in the vite.config.ts file, otherwise HMR will be disabled.',
        );
        process.exit(1);
      }

      if (!fs.existsSync(storeReducersFilePath)) {
        config.logger.warn(
          `[vite-plugin-redux-hmr] HMR disabled - store reducers index file "${storeReducersFilePath}" not found.`
          + '\n[vite-plugin-redux-hmr] Make sure to fix the "storeReducersFilePath" in the vite.config.ts file, otherwise HMR will be disabled.'
        );
        process.exit(1);
      }
    },
    async transform(code, id) {
      const [filePath] = id.split('?');

      if (filePath !== storeIndexFilePath) {
        return { code };
      }

      const magicString = new MagicString(code)
        .prepend(header)
        .append((footer
          .replace('__SOURCE__', storeReducersFilePath)
          .replace('__VAR__', options.storeVariableName || 'store')
          .replace('__WRAP__', options.wrapReducersFunction || '(reducers) => reducers')
        ));

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true, source: id })
      };
    }
  };

  return pluginInstance;
};

export default vitePluginReduxHmr;
