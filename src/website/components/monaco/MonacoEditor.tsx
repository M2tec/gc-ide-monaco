import * as React from "react";
import { getLoadedMonaco } from "../../../monaco-loader";
import { withLoadedMonaco } from "./MonacoLoader";

@withLoadedMonaco
export class ControlledMonacoEditor extends React.Component<{
	value: string;
	onDidValueChange?: (newValue: string) => void;

	language?: string;
	theme?: string;
}> {
	private readonly model = getLoadedMonaco().editor.createModel(
		this.props.value,
		this.props.language
	);

	private lastSubscription: monaco.IDisposable | undefined;

	componentDidUpdate(lastProps: this["props"]) {
		const newOnDidValueChange = this.props.onDidValueChange;
		if (newOnDidValueChange !== lastProps.onDidValueChange) {
			if (this.lastSubscription) {
				this.lastSubscription.dispose();
				this.lastSubscription = undefined;
			}
			if (newOnDidValueChange) {
				this.lastSubscription = this.model.onDidChangeContent((e) => {
					newOnDidValueChange(this.model.getValue());
				});
			}
		}

		if (this.props.value !== this.model.getValue()) {
			this.model.setValue(this.props.value);
		}
		if (this.model.getLanguageId() !== this.props.language) {
			getLoadedMonaco().editor.setModelLanguage(
				this.model,
				this.props.language || "plaintext"
			);
		}

		if (this.props.onDidValueChange) {
			this.model.setValue(this.props.value);
		}
	}

	render() {
		return (
			<MonacoEditor
				readOnly={!this.props.onDidValueChange}
				model={this.model}
				theme={this.props.theme}
			/>
		);
	}
}

@withLoadedMonaco
export class ControlledMonacoDiffEditor extends React.Component<{
	originalValue: string;
	modifiedValue: string;
	language?: string;
}> {
	private readonly originalModel = getLoadedMonaco().editor.createModel(
		this.props.originalValue,
		this.props.language
	);
	private readonly modifiedModel = getLoadedMonaco().editor.createModel(
		this.props.modifiedValue,
		this.props.language
	);

	componentDidUpdate() {
		if (this.props.originalValue !== this.originalModel.getValue()) {
			this.originalModel.setValue(this.props.originalValue);
		}
		if (this.originalModel.getLanguageId() !== this.props.language) {
			getLoadedMonaco().editor.setModelLanguage(
				this.originalModel,
				this.props.language || "plaintext"
			);
		}

		if (this.props.modifiedValue !== this.modifiedModel.getValue()) {
			this.modifiedModel.setValue(this.props.modifiedValue);
		}
		if (this.modifiedModel.getLanguageId() !== this.props.language) {
			getLoadedMonaco().editor.setModelLanguage(
				this.modifiedModel,
				this.props.language || "plaintext"
			);
		}
	}

	render() {
		return (
			<MonacoDiffEditor
				originalModel={this.originalModel}
				modifiedModel={this.modifiedModel}
			/>
		);
	}
}

export type MonacoEditorHeight =
	| { /* Fills the entire space. */ kind: "fill" }
	| {
			/* Use the content as height. */ kind: "dynamic";
			maxHeight?: number;
	  };

@withLoadedMonaco
export class MonacoEditor extends React.Component<
	{
		model: monaco.editor.ITextModel;
		onEditorLoaded?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
		height?: MonacoEditorHeight;
		theme?: string;
		readOnly?: boolean;
		className?: string;
	},
	{ contentHeight: number | undefined }
> {
	public editor: monaco.editor.IStandaloneCodeEditor | undefined;
	private get height() {
		if (this.state.contentHeight === undefined) {
			return undefined;
		}
		return Math.min(200, this.state.contentHeight);
	}
	private readonly divRef = React.createRef<HTMLDivElement>();
	private readonly resizeObserver = new ResizeObserver(() => {
		if (this.editor) {
			this.editor.layout();
		}
	});
	constructor(props: any) {
		super(props);
		this.state = { contentHeight: undefined };

		monaco.languages.register({id:'helios'})

		let keywords = ['spending', 'struct', 'func', 'Int']
		monaco.languages.setMonarchTokensProvider('helios', {
			keywords: [
				'break', 'case', 'catch', 'class', 'continue', 'const',
				'constructor', 'debugger', 'default', 'delete', 'do', 'else',
				'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
				'get', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null',
				'return', 'set', 'super', 'switch', 'symbol', 'this', 'throw', 'true',
				'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield',
				'async', 'await', 'of', 'spending', 'func'
			],
		
			typeKeywords: [
				'any', 'boolean', 'number', 'object', 'string', 'undefined'
			],
		
			operators: [
				'<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
				'*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&',
				'|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',
				'*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=',
				'^=', '@',
			],
		
			// we include these common regular expressions
			symbols: /[=><!~?:&|+\-*\/\^%]+/,
			escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
			digits: /\d+(_+\d+)*/,
			octaldigits: /[0-7]+(_+[0-7]+)*/,
			binarydigits: /[0-1]+(_+[0-1]+)*/,
			hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
		
			regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
			regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
		
			// The main tokenizer for our languages
			tokenizer: {
				root: [
					[/[{}]/, 'delimiter.bracket'],
					{ include: 'common' }
				],
		
				common: [
					// identifiers and keywords
					[/[a-z_$][\w$]*/, {
						cases: {
							'@typeKeywords': 'keyword',
							'@keywords': 'keyword',
							'@default': 'identifier'
						}
					}],
					[/[A-Z][\w\$]*/, 'type.identifier'],  // to show class names nicely
					// [/[A-Z][\w\$]*/, 'identifier'],
		
					// whitespace
					{ include: '@whitespace' },
		
					// regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
					[/\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],
		
					// delimiters and operators
					[/[()\[\]]/, '@brackets'],
					[/[<>](?!@symbols)/, '@brackets'],
					[/@symbols/, {
						cases: {
							'@operators': 'delimiter',
							'@default': ''
						}
					}],
		
					// numbers
					[/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
					[/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
					[/0[xX](@hexdigits)/, 'number.hex'],
					[/0[oO]?(@octaldigits)/, 'number.octal'],
					[/0[bB](@binarydigits)/, 'number.binary'],
					[/(@digits)/, 'number'],
		
					// delimiter: after number because of .\d floats
					[/[;,.]/, 'delimiter'],
		
					// strings
					[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
					[/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
					[/"/, 'string', '@string_double'],
					[/'/, 'string', '@string_single'],
					[/`/, 'string', '@string_backtick'],
				],
		
				whitespace: [
					[/[ \t\r\n]+/, ''],
					[/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
					[/\/\*/, 'comment', '@comment'],
					[/\/\/.*$/, 'comment'],
				],
		
				comment: [
					[/[^\/*]+/, 'comment'],
					[/\*\//, 'comment', '@pop'],
					[/[\/*]/, 'comment']
				],
		
				jsdoc: [
					[/[^\/*]+/, 'comment.doc'],
					[/\*\//, 'comment.doc', '@pop'],
					[/[\/*]/, 'comment.doc']
				],
		
				// We match regular expression quite precisely
				regexp: [
					[/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
					[/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
					[/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
					[/[()]/, 'regexp.escape.control'],
					[/@regexpctl/, 'regexp.escape.control'],
					[/[^\\\/]/, 'regexp'],
					[/@regexpesc/, 'regexp.escape'],
					[/\\\./, 'regexp.invalid'],
					[/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
				],
		
				regexrange: [
					[/-/, 'regexp.escape.control'],
					[/\^/, 'regexp.invalid'],
					[/@regexpesc/, 'regexp.escape'],
					[/[^\]]/, 'regexp'],
					[/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
				],
		
				string_double: [
					[/[^\\"]+/, 'string'],
					[/@escapes/, 'string.escape'],
					[/\\./, 'string.escape.invalid'],
					[/"/, 'string', '@pop']
				],
		
				string_single: [
					[/[^\\']+/, 'string'],
					[/@escapes/, 'string.escape'],
					[/\\./, 'string.escape.invalid'],
					[/'/, 'string', '@pop']
				],
		
				string_backtick: [
					[/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
					[/[^\\`$]+/, 'string'],
					[/@escapes/, 'string.escape'],
					[/\\./, 'string.escape.invalid'],
					[/`/, 'string', '@pop']
				],
		
				bracketCounting: [
					[/\{/, 'delimiter.bracket', '@bracketCounting'],
					[/\}/, 'delimiter.bracket', '@pop'],
					{ include: 'common' }
				],
			},})
	}
	render() {
		const heightInfo = this.props.height || { kind: "fill" };
		const height = heightInfo.kind === "fill" ? "100%" : this.height;
		return (
			<div
				style={{
					height,
					minHeight: 0,
					minWidth: 0,
				}}
				className={"monaco-editor-react " + this.props.className}
				ref={this.divRef}
			/>
		);
	}
	componentDidMount() {
		const div = this.divRef.current;
		if (!div) {
			throw new Error("unexpected");
		}
		this.resizeObserver.observe(div);
		this.editor = getLoadedMonaco().editor.create(div, {
			model: this.props.model,
			scrollBeyondLastLine: false,
			minimap: { enabled: false },
			automaticLayout: false,
			theme: this.props.theme,
			readOnly: this.props.readOnly,
		});
		this.editor.onDidContentSizeChange((e) => {
			this.setState({ contentHeight: e.contentHeight });
		});
		if (this.props.onEditorLoaded) {
			this.props.onEditorLoaded(this.editor);
		}
	}
	componentDidUpdate(oldProps: this["props"]) {
		if (oldProps.model !== this.props.model) {
			this.editor!.setModel(this.props.model);
		}
		if (oldProps.theme !== this.props.theme && this.props.theme) {
			getLoadedMonaco().editor.setTheme(this.props.theme);
		}
		if (oldProps.readOnly !== this.props.readOnly) {
			this.editor!.updateOptions({ readOnly: this.props.readOnly });
		}
	}
	componentWillUnmount() {
		if (!this.editor) {
			console.error("unexpected state");
		} else {
			this.editor.dispose();
		}
	}
}

@withLoadedMonaco
export class MonacoDiffEditor extends React.Component<
	{
		originalModel: monaco.editor.ITextModel;
		modifiedModel: monaco.editor.ITextModel;
		onEditorLoaded?: (editor: monaco.editor.IStandaloneDiffEditor) => void;
		/**
		 * Initial theme to be used for rendering.
		 * The current out-of-the-box available themes are: 'vs' (default), 'vs-dark', 'hc-black'.
		 * You can create custom themes via `monaco.editor.defineTheme`.
		 * To switch a theme, use `monaco.editor.setTheme`
		 */
		theme?: string;
	},
	{ contentHeight: number | undefined }
> {
	public editor: monaco.editor.IStandaloneDiffEditor | undefined;

	private readonly divRef = React.createRef<HTMLDivElement>();
	private readonly resizeObserver = new ResizeObserver(() => {
		if (this.editor) {
			this.editor.layout();
		}
	});
	constructor(props: any) {
		super(props);
		this.state = { contentHeight: undefined };
	}
	render() {
		const height = "100%";
		return (
			<div
				style={{
					height,
					minHeight: 0,
					minWidth: 0,
				}}
				className="monaco-editor-react"
				ref={this.divRef}
			/>
		);
	}
	componentDidMount() {
		const div = this.divRef.current;
		if (!div) {
			throw new Error("unexpected");
		}
		this.resizeObserver.observe(div);
		this.editor = getLoadedMonaco().editor.createDiffEditor(div, {
			scrollBeyondLastLine: false,
			minimap: { enabled: false },
			automaticLayout: false,
			theme: this.props.theme,
			originalEditable: true,
		});
		this.editor.setModel({
			original: this.props.originalModel,
			modified: this.props.modifiedModel,
		});

		if (this.props.onEditorLoaded) {
			this.props.onEditorLoaded(this.editor);
		}
	}

	componentWillUnmount() {
		if (!this.editor) {
			console.error("unexpected state");
		} else {
			this.editor.dispose();
		}
	}
}
