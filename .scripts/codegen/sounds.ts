import { createIdGenerator } from "./id-generator";

export const generateSoundIds = createIdGenerator({
    glob: "resource_packs/*/sounds/sound_definitions.json",
    outputPath: "scripts/generated/definitions/sounds.ts",
    exportName: "SoundIds",
    inputSelector: (json) => json.sound_definitions,
    typeName: "Sound",
});