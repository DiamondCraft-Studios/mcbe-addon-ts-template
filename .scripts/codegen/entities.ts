import { createIdGenerator } from "./id-generator";

export const generateEntityIds = createIdGenerator({
	glob: "behavior_packs/*/entities/*.json",
	outputPath: "scripts/generated/definitions/entities.ts",
	exportName: "AddonEntityTypes",
	inputSelector: (json) => {
		const id = json["minecraft:entity"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Entity",
});
