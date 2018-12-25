module.exports = {
  "compilerOptions": {
    "target": "es2017",
    "moduleResolution": "node",
    "jsx": "react-native",
    "noEmit": false,
    "outDir": "outputs",
    "sourceMap": true,
    "allowSyntheticDefaultImports": true,
    "preserveConstEnums": true,
    "allowJs": false,
    "noImplicitReturns": true,
    "noUnusedParameters": true,
    "noUnusedLocals": true,
    "traceResolution": false,
    "module": "esnext",
    "lib": [
      "es6",
      "dom",
      "es5"
    ],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "rootDir": "src",
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitThis": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "suppressImplicitAnyIndexErrors": true,
    "baseUrl": ".",
    "checkJs": false
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "node_modules",
    "**/node_modules/*",
    "android",
    "ios",
    "build",
    "node_modules"
  ]
};
