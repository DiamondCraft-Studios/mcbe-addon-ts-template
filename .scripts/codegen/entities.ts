import { createIdGenerator } from "./abstract-id-generator";

/**
 * Code generation script.
 * Reads all behavior pack entities and generates an id map for ease of reference in scripting.
 */
export const generateEntityIds = createIdGenerator({
	glob: "behavior_packs/*/entities/**/*.json",
	outputPath: "scripts/generated/definitions/entities.ts",
	exportName: "AddonEntityTypes",
	inputSelector: (json) => {
		const id = json["minecraft:entity"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Entity",
});
