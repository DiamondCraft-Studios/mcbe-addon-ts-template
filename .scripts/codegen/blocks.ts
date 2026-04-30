import { createIdGenerator } from "./abstract-id-generator";

/**
 * Code generation script.
 * Reads all behavior pack blocks and generates an id map for ease of reference in scripting.
 */
export const generateBlockIds = createIdGenerator({
	glob: "behavior_packs/*/blocks/*.json",
	outputPath: "scripts/generated/definitions/blocks.ts",
	exportName: "AddonBlockTypes",
	inputSelector: (json) => {
		const id = json["minecraft:block"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Block",
});
