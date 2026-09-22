import fg from "fast-glob";
import fs from "fs";
import { parse } from "jsonc-parser";

/**
 * Updates the min_engine_version in the manifest.json files.
 */
export function bumpEngineVersion(version: string) {
	const bpManifest = fg.sync("behavior_packs/*/manifest.json");
	const rpManifest = fg.sync("resource_packs/*/manifest.json");
	
	const bpManifestJson =  parse(fs.readFileSync(bpManifest[0], "utf-8"));
	const rpManifestJson =  parse(fs.readFileSync(rpManifest[0], "utf-8"));

	try {
		const versionArray = version.split(".").map((v) => parseInt(v));

		bpManifestJson.header.min_engine_version = versionArray;
		rpManifestJson.header.min_engine_version = versionArray;
	}
	catch (e) {
		console.error(`Invalid version: ${version}`);
		return;
	}

	// Write
	fs.writeFileSync(bpManifest[0], JSON.stringify(bpManifestJson, null, "\t"));
	fs.writeFileSync(rpManifest[0], JSON.stringify(rpManifestJson, null, "\t"));

	console.info(`Bumped engine version to ${version}`);
}