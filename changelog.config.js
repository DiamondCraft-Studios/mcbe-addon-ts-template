module.exports = {
	parserOpts: {
		headerPattern: /^(\w+)(?:\(([^)]+)\))?:\s(.+)$/,
		headerCorrespondence: ["type", "scope", "subject"],
		headerPartial: `# v{{version}}\n`,
	},

	writerOpts: {
		transform: (commit) => {
			const headerMap = {
				build: "🏗 Builds",
				dev: "💻 Development",
				model: "🧱 Models",
				asset: "🎨 Assets",
				design: "🧠 Design",
				qa: "🧪 QA",
			};

			const normalizedType = commit.type?.toLowerCase();
			const mappedType = headerMap[normalizedType];
			let subject = commit.subject || commit.header || commit.message;
			subject = subject.trim().charAt(0).toUpperCase() + subject.slice(1);

			return {
				...commit,
				subject: subject || "No message",
				type: mappedType || "📦 Uncategorized",
			};
		},

		groupBy: "type",

		commitGroupsSort: (a, b) => a.title.localeCompare(b.title),
		commitsSort: ["subject"],

		mainTemplate: `
{{> header}}

{{#each commitGroups}}

## {{title}}

{{#each commits}}
- {{subject}}
{{/each}}

{{/each}}
`,
	},
};
