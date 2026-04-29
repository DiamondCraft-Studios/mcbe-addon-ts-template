import { createIdGenerator } from "./id-generator";

export const generateItemIds = createIdGenerator({
	glob: "behavior_packs/*/items/*.json",
	outputPath: "scripts/generated/definitions/items.ts",
	exportName: "AddonItemTypes",
	inputSelector: (json) => {
		const id = json["minecraft:item"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Item",
});
