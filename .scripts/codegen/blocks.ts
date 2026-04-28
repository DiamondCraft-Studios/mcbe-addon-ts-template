import { createIdGenerator } from "./id-generator";

export const generateBlockIds = createIdGenerator({
	glob: "behavior_packs/*/blocks/*.json",
	outputPath: "scripts/generated/definitions/blocks.ts",
	exportName: "BlockTypes",
	inputSelector: (json) => {
		const id = json["minecraft:block"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Block",
});
