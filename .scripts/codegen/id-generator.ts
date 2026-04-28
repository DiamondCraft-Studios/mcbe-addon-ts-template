import fs from "fs";
import fg from "fast-glob";
import path from "path";
import { parse } from "jsonc-parser";
import { toPascalCase } from "./utils";

type GeneratorOptions = {
	glob: string;
	outputPath: string;
	exportName: string;
	inputSelector: (json: any) => Record<string, any>;
	keyTransform?: (key: string, value: any) => string;
	typeName?: string;
};

export function createIdGenerator(options: GeneratorOptions) {
	return async () => {

		const matches = fg.sync(options.glob);

		if (matches.length === 0) {
			throw new Error(`No files found for glob: ${options.glob}`);
		}

		const allEntries: string[] = [];

		for (const file of matches) {
			try {
				const json = parse(fs.readFileSync(file, "utf-8"));
				const data = options.inputSelector(json);

				for (const key of Object.keys(data)) {
					const varName = options.keyTransform?.(key, data[key]) ?? toPascalCase(key);

					allEntries.push(`\t${varName}: "${key}",`);
				}
			}
			catch (e) {
				console.error(`Error parsing ${file}`);
				console.error(e);
			}
		}

		const output = `export const ${options.exportName} = {
${allEntries.join("\n")}
} as const;

export const ${options.exportName}Set = new Set(Object.values(${options.exportName}));
`;

		fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
		fs.writeFileSync(options.outputPath, output);

		console.log(`Generated ${options.outputPath}`);
	};
}
