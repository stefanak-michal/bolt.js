const path = require('path');
const fs = require('fs');
const { generateDtsBundle } = require('dts-bundle-generator');

class DtsBundlePlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('DtsBundlePlugin', compilation => {
            try {
                const result = generateDtsBundle(
                    [
                        {
                            filePath: './src/index.ts',
                            libraries: {
                                importedLibraries: [],
                                inlinedLibraries: [],
                            },
                        },
                    ],
                    { preferredConfigPath: './tsconfig.json' }
                );

                if (!Array.isArray(result) || result.length === 0 || typeof result[0] !== 'string') {
                    throw new Error('generateDtsBundle did not produce a declaration bundle.');
                }

                fs.mkdirSync('./dist', { recursive: true });
                fs.writeFileSync('./dist/bolt.d.ts', result[0]);
            } catch (error) {
                const pluginError =
                    error instanceof Error
                        ? new Error(`DtsBundlePlugin failed: ${error.message}`)
                        : new Error(`DtsBundlePlugin failed: ${String(error)}`);
                compilation.errors.push(pluginError);
            }
        });
    }
}

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'bolt.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'BoltDriver',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [new DtsBundlePlugin()],
};
