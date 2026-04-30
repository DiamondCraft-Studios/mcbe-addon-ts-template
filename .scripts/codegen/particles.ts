import { createIdGenerator } from "./abstract-id-generator";

/**
 * Code generation script.
 * Reads all resource pack particle definitions and generates an id map for ease of reference in scripting.
 */
export const generateParticleIds = createIdGenerator({
	glob: "resource_packs/*/particles/**/*.json",
	outputPath: "scripts/generated/definitions/particles.ts",
	exportName: "AddonParticles",
	inputSelector: (json) => {
		const id = json["particle_effect"]?.description?.identifier;
		return id ? { [id]: true } : {};
	},
	typeName: "Particle",
});
