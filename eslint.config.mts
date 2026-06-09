import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
	{
		plugins: {
			...eslintReact.configs.recommended.plugins,
			"react-hooks": reactHooksPlugin,
		},
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	{
		files: ["**/*.{js,ts,tsx}"],
		rules: {
			...eslintReact.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
		},
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			"obsidianmd/no-plugin-as-component": "off",
			"obsidianmd/no-view-references-in-plugin": "off",
			"obsidianmd/no-unsupported-api": "off",
			"obsidianmd/prefer-file-manager-trash-file": "off",
			"obsidianmd/prefer-instanceof": "off",
		},
	},
	{
		files: ["**/*.{ts,tsx}"],
		rules: {
			"obsidianmd/no-plugin-as-component": "error",
			"obsidianmd/no-view-references-in-plugin": "error",
			"obsidianmd/no-unsupported-api": "error",
			"obsidianmd/prefer-file-manager-trash-file": "warn",
			"obsidianmd/prefer-instanceof": "error",
		},
	},
	{
		files: ["package.json"],
		rules: {
			"depend/ban-dependencies": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
);
