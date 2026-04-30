import fs from "fs";
import fg from "fast-glob";
import { parse } from "jsonc-parser";
import { createHeader } from "./utils";

/**
 * Code generation script.
 * Reads all behavior pack entity properties and generates an id map for ease of reference in scripting.
 */
export async function generateEntityPropertyIds() {
	const matches = fg.sync("behavior_packs/*/entities/*.json");
	const outputPath = "scripts/generated/definitions/entity-properties.ts";

	const tree: Record<string, any> = {};

	for (const file of matches) {
		const json = parse(fs.readFileSync(file, "utf-8"));

		const events = json["minecraft:entity"]?.description.properties;
		if (!events) continue;

		for (const key of Object.keys(events)) {
			if (typeof key !== "string") continue;
			if (key.trim().length === 0) continue;
			if (!key.includes(":")) continue;

			const { entity, path } = parseEventId(key);

			const entityName = toPascalCase(entity);

			tree[entityName] ??= {};

			insert(tree[entityName], path, key);
		}
	}

	const output = `${createHeader(".scripts/codegen/entity-properties.ts")}

export const AddonEntityProperties = ${JSON.stringify(tree, null, 4)} as const;
`;

	fs.mkdirSync("scripts/generated/definitions", { recursive: true });
	fs.writeFileSync(outputPath, output);

	console.log(`Generated ${outputPath}`);
}

function parseEventId(id: string) {
	const [namespaceAndEntity, ...rest] = id.split(":");
	const parts = rest.join(":").split(".");

	const entity = parts[0];
	const path = parts.slice(1);

	return { entity, path };
}

type Tree = Record<string, any>;

function insert(tree: Tree, path: string[], value: string) {
	let current = tree;

	for (let i = 0; i < path.length; i++) {
		const key = toPascalCase(path[i]);

		if (i === path.length - 1) {
			current[key] = value;
		} else {
			current[key] ??= {};
			current = current[key];
		}
	}
}

function toPascalCase(str: string) {
	return str
		.split(/[_\s]/g)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}
