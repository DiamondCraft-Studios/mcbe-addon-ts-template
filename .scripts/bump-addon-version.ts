import fg from "fast-glob";
import fs from "fs";
import { parse } from "jsonc-parser";

/**
 * Updates the add-on version in the manifest.json files.
 */
export function bumpAddOnVersion(version: string | undefined) {
	const bpManifest = fg.sync("behavior_packs/*/manifest.json");
	const rpManifest = fg.sync("resource_packs/*/manifest.json");

	const worldBp = fg.sync("world/world_behavior_packs.json");
	const worldRp = fg.sync("world/world_resource_packs.json");

	const worldTestBp = fg.sync("world-test/world_behavior_packs.json");
	const worldTestRp = fg.sync("world-test/world_resource_packs.json");

	const bpManifestJson = parse(fs.readFileSync(bpManifest[0], "utf-8"));
	const rpManifestJson = parse(fs.readFileSync(rpManifest[0], "utf-8"));

	const currVer = (bpManifestJson.header.version as string).split(".").map((v) => parseInt(v));

	let nextVer = [...currVer];
	nextVer[2]++;

	if (version) {
		const versionArray = version.split(".").map((v) => parseInt(v));
		nextVer = versionArray;
	}

	bpManifestJson.header.version = nextVer.join(".");
	const bpGuid = bpManifestJson.header.uuid;

	rpManifestJson.header.version = nextVer.join(".");
	const rpGuid = rpManifestJson.header.uuid;
	console.info(`\tUpdated headers...`);

	// Update modules
	bpManifestJson.modules.forEach((m: any) => {
		if (m.type === "data" || m.type === "script") {
			m.version = nextVer.join(".");
		}
	});
	rpManifestJson.modules.forEach((m: any) => {
		if (m.type === "resources") {
			m.version = nextVer.join(".");
		}
	});
	console.info(`\tUpdated modules...`);

	// Update dependencies
	bpManifestJson.dependencies.forEach((d: any) => {
		if (d.uuid === rpGuid) {
			d.version = nextVer.join(".");
		}
	});
	// rpManifestJson.dependencies.forEach((d: any) => {
	// 	if (d.uuid === bpGuid) {
	// 		d.version = nextVer.join(".");
	// 	}
	// });
	console.info(`\tUpdated dependencies...`);

	// Update world packs
	if (worldBp.length !== 0) {
		const worldBpJson = parse(fs.readFileSync(worldBp[0], "utf-8")) as Array<any>;
		const bpVersionArray = worldBpJson.find((p) => p.pack_id === bpGuid).version as number[];
		bpVersionArray[0] = nextVer[0];
		bpVersionArray[1] = nextVer[1];
		bpVersionArray[2] = nextVer[2];
		fs.writeFileSync(worldBp[0], JSON.stringify(worldBpJson, null, "\t"));
	}

	if (worldTestBp.length !== 0) {
		const worldTestBpJson = parse(fs.readFileSync(worldTestBp[0], "utf-8")) as Array<any>;
		const testBpVersionArray = worldTestBpJson.find((p) => p.pack_id === bpGuid).version as number[];
		testBpVersionArray[0] = nextVer[0];
		testBpVersionArray[1] = nextVer[1];
		testBpVersionArray[2] = nextVer[2];
		fs.writeFileSync(worldTestBp[0], JSON.stringify(worldTestBpJson, null, "\t"));
	}

	if (worldTestRp.length !== 0) {
		const worldTestRpJson = parse(fs.readFileSync(worldTestRp[0], "utf-8")) as Array<any>;
		const testRpVersionArray = worldTestRpJson.find((p) => p.pack_id === rpGuid).version as number[];
		testRpVersionArray[0] = nextVer[0];
		testRpVersionArray[1] = nextVer[1];
		testRpVersionArray[2] = nextVer[2];
		fs.writeFileSync(worldTestRp[0], JSON.stringify(worldTestRpJson, null, "\t"));
	}

	if (worldRp.length !== 0) {
		const worldRpJson = parse(fs.readFileSync(worldRp[0], "utf-8")) as Array<any>;
		const rpVersionArray = worldRpJson.find((p) => p.pack_id === rpGuid).version as number[];
		rpVersionArray[0] = nextVer[0];
		rpVersionArray[1] = nextVer[1];
		rpVersionArray[2] = nextVer[2];
		fs.writeFileSync(worldRp[0], JSON.stringify(worldRpJson, null, "\t"));
	}

	console.info(`\tUpdated world packs...`);

	// Write
	fs.writeFileSync(bpManifest[0], JSON.stringify(bpManifestJson, null, "\t"));
	fs.writeFileSync(rpManifest[0], JSON.stringify(rpManifestJson, null, "\t"));

	console.info(`Bumped version to ${nextVer.join(".")}`);
}