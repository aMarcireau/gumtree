const fs = require('fs');
const path = require('path');

class File {
    constructor(filename) {
        this.filename = filename;
        this.newFilename = filename;
    }

    rm() {
        this.newFilename = null;
    }

    mv(filename) {
        this.newFilename = filename;
    }

    rename(name) {
        this.newFilename = path.format({...path.parse(filename), name});
    }
}

const buildTree = directory => Object.fromEntries(
    fs.readdirSync(directory,  {withFileTypes: true}).map(entry => [
        entry.name,
        entry.isDirectory() ?
            buildTree(path.join(directory, entry.name))
            : new File(path.join(directory, entry.name))
    ])
);

const commitTree = (tree, dryRun) => {
    for (const [name, entry] of Object.entries(tree)) {
        if (entry instanceof File) {
            if (entry.newFilename === null) {
                if (dryRun) {
                    console.log(`rm ${entry.filename}`);
                } else {
                    fs.rmSync(entry.filename);
                }
            } else if (entry.filename !== entry.newFilename) {
                if (dryRun) {
                    console.log(`mv ${entry.filename} ${entry.newFilename}`);
                } else {
                    fs.renameSync(entry.filename, entry.newFilename);
                }
            }
        } else {
            commitTree(entry, dryRun);
        }
    }
};

class Gumtree {
    constructor(directory) {
        this.directory = (directory == null ? process.cwd() : path.resolve(directory));
        this.tree = buildTree(this.directory);
    }

    commit(options) {
        options = {
            dryRun: false,
            ...options,
        };
        commitTree(this.tree, options.dryRun);
        this.tree = buildTree(this.directory);
    }
}

module.exports = {
    build: directory => new Gumtree(directory),
};
