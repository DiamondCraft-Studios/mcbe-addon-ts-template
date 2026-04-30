import { createIdGenerator } from "./abstract-id-generator";

/**
 * Code generation script.
 * Reads all resource pack sound definitions and generates an id map for ease of reference in scripting.
 */
export const generateSoundIds = createIdGenerator({
	glob: "resource_packs/*/sounds/sound_definitions.json",
	outputPath: "scripts/generated/definitions/sounds.ts",
	exportName: "AddonSoundIds",
	inputSelector: (json) => json.sound_definitions,
	typeName: "Sound",
});
