# ⚡ Vite Plugin Redux HMR (Hot Module Reloading)

## 📗 Description
Implements Hot Module Reloading (HMR) for your Redux library when in development.<br />
**NOTE: HMR only works when there are no circular dependencies between your files, otherwise Vite will fallback to full reload.**

## 🧪 Important
1. In order for this plugin to work you need to have your reducers exported as a default export in a seprate reducers file.
2. The reducers file needs to be imported in your main redux index file (the file that calls `configureStore()` or `createStore()` and defines your `store` variable).

## 🚀 Install
```bash
npm i vite-plugin-redux-hmr -D

# yarn
yarn add vite-plugin-redux-hmr -D

# pnpm
pnpm add vite-plugin-redux-hmr -D
```

## 🧑‍💻 Usage (`vite.config.ts` / `vite.config.js`)
```ts
import { defineConfig } from 'vite';
import reduxHmr from 'vite-plugin-redux-hmr';

export default defineConfig({
  plugins: [
    reduxHmr({
      // Required:
      storeIndexFilePath: 'src/store/index.ts';
      storeReducersFilePath: 'src/store/reducers/index.ts',

      // Optional, defaults given for reference:
      storeVariableName: 'store', // change this to "myCustomStoreVar" in case you assigned your configureStore()/createStore() result to something different from "store"
      wrapReducersFunction: '(reducers) => reducers' // change this to something else like "(reducers) => rememberReducer(reducers)" in case you have a top-level reducer like the one from the "redux-rememeber" library
    })
  ]
});
```
