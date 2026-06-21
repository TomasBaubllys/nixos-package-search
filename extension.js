// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log("NixOS Package autocomplete is active");
	const provider = vscode.languages.registerCompletionItemProvider({language: 'nix'}, {async provideCompletionItems(document, position, token, context) {
		const range = document.getWordRangeAtPosition(position);
		const query = document.getText(range);

		if(!query || query.length < 3) {
			return [];
		}

		if(query.startsWith('pkgs.')) {
			query.replace('pkgs.', '');
		}

		console.log(query);

		try {
			const { stdout } = await execFileAsync('nix-search', ['--json', query]);
			// 1. Split safely handling different line breaks
			const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
			//console.log(`Total raw lines found: ${lines.length}`);
			const searchResults = lines.map(lines => JSON.parse(lines));

			return searchResults.map(pkg => {
                const name = pkg.package_attr_name || "unknown";
                const version = pkg.package_pversion || "unknown";
                const description = pkg.package_description || "";

                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Value);
                item.detail = version;
                
                if (description) {
                    item.documentation = new vscode.MarkdownString(description);
                }
                return item;
            });
		} catch(error) {
			console.log('Nix Autocomplete Error: ', error);
			return [];
		}

	}});

	context.subscriptions.push(provider);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
