const fs = require('fs-extra');

const dir = './public/vs';

fs.emptyDirSync(dir);

Promise.all([
    fs.copy('./node_modules/monaco-editor/min/vs/base', './public/vs/base'),
    fs.copy('./node_modules/monaco-editor/min/vs/editor/', './public/vs/editor', {
        filter: (src) => {
            const files = ['editor.main.css', 'editor.main.js', 'editor.main.nls.js'];
            return !/\.(js|css)?$/.test(src) || files.some(file => src.includes(file));
        },
    }),
    fs.copy('./node_modules/monaco-editor/min/vs/language/json', './public/vs/language/json'),
    fs.copy('./node_modules/monaco-editor/min/vs/loader.js', './public/vs/loader.js'),
]).catch(() => {
    throw new Error('Failed to copy editor files');
});
