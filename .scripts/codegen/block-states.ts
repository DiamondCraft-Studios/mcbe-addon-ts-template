import fs from "fs";
import path from "path";
import { parse } from "jsonc-parser";
import fg from "fast-glob";

/**
 * Code generation script.
 * Reads all behavior pack block states and generates an id map for ease of reference in scripting.
 */
export async function generateBlockStateIds() {
	const matches = fg.sync("behavior_packs/*/blocks/*.json");

	const globalStates = new Set<string>();
	const blockMap: Record<string, Record<string, string>> = {};

	for (const file of matches) {
		const json = parse(fs.readFileSync(file, "utf-8"));

		const block = json["minecraft:block"];
		if (!block) continue;

		const identifier = block.description?.identifier;
		const states = block.description?.states;

		if (!identifier || !states) continue;

		const blockName = extractNameFromIdentifier(identifier);

		blockMap[blockName] = {};

		for (const stateId of Object.keys(states)) {
			if (!stateId || stateId.trim() === "") continue;

			globalStates.add(stateId);

			const stateName = extractStateName(stateId);

			blockMap[blockName][stateName] = stateId;
		}
	}

	const supersetFields = Array.from(globalStates)
		.map((s) => `\t['${s}']?: number;`)
		.join("\n");

	const blockEntries = Object.entries(blockMap)
		.map(([blockName, states]) => {
			const stateEntries = Object.entries(states)
				.map(([k, v]) => `\t\t${k}: "${v}",`)
				.join("\n");

			return `\t${blockName}: {\n${stateEntries}\n\t},`;
		})
		.join("\n");

	const output = `import { BlockStateSuperset } from "@minecraft/vanilla-data";

export type AddonBlockStateSuperset = BlockStateSuperset & {
${supersetFields}
};

export const AddonBlockStates = {
${blockEntries}
} as const;
`;

	const outputPath = path.resolve("scripts/generated/definitions/block-states.ts");

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, output);

	console.log(`Generated ${outputPath}`);
}

function extractNameFromIdentifier(id: string) {
	const name = id.split(":")[1] ?? id;
	return toPascalCase(name);
}

function extractStateName(stateId: string) {
	const name = stateId.split(":")[1] ?? stateId;
	return toPascalCase(name);
}

function toPascalCase(str: string) {
	return str
		.split(/[_\-]/g)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}
