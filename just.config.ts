import { argv, parallel, series, task, tscTask } from "just-scripts";
import {
	BundleTaskParameters,
	CopyTaskParameters,
	bundleTask,
	cleanTask,
	cleanCollateralTask,
	copyTask,
	coreLint,
	mcaddonTask,
	setupEnvironment,
	ZipTaskParameters,
	STANDARD_CLEAN_PATHS,
	DEFAULT_CLEAN_DIRECTORIES,
	getOrThrowFromProcess,
	watchTask,
} from "@minecraft/core-build-tasks";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { generateBlockIds } from "./.scripts/codegen/blocks";
import { generateBlockStateIds } from "./.scripts/codegen/block-states";
import { generateEntityIds } from "./.scripts/codegen/entities";
import { generateEntityEventIds } from "./.scripts/codegen/entity-events";
import { generateEntityPropertyIds } from "./.scripts/codegen/entity-properties";
import { generateItemIds } from "./.scripts/codegen/items";
import { generateSoundIds } from "./.scripts/codegen/sounds";

// Setup env variables
setupEnvironment(path.resolve(__dirname, ".env"));

const PROJECT_NAME = getOrThrowFromProcess("PROJECT_NAME");
const BP_PACK_NAME = getOrThrowFromProcess("BP_PACK_NAME");
const RP_PACK_NAME = getOrThrowFromProcess("RP_PACK_NAME");
const MCWORLD_NAME = getOrThrowFromProcess("MCWORLD_NAME");
const ADD_ON_VERSION = getOrThrowFromProcess("ADD_ON_VERSION");
const WORLD_DEPLOYMENT_PATH = getOrThrowFromProcess("WORLD_DEPLOYMENT_PATH");
const SERVER_WORLD_DEPLOYMENT_PATH = getOrThrowFromProcess("SERVER_WORLD_DEPLOYMENT_PATH");
const SERVER_WORLD_NAME = getOrThrowFromProcess("SERVER_WORLD_NAME");
const WORLD_TEMPLATE_PATH = getOrThrowFromProcess("WORLD_TEMPLATE_PATH");
const TEST_WORLD_PATH = getOrThrowFromProcess("TEST_WORLD_PATH");
const DIST_PATH = "./dist";

const DEPLOYED_WORLD_NAME = "deployed_world";

const bundleTaskOptions: BundleTaskParameters = {
	entryPoint: path.join(__dirname, "./scripts/main.ts"),
	external: ["@minecraft/server", "@minecraft/server-ui"],
	outfile: path.resolve(__dirname, "./dist/scripts/main.js"),
	minifyWhitespace: false,
	sourcemap: true,
	outputSourcemapPath: path.resolve(__dirname, "./dist/debug"),
};

const copyTaskOptions: CopyTaskParameters = {
	copyToBehaviorPacks: [`./behavior_packs/${PROJECT_NAME}`],
	copyToScripts: ["./dist/scripts"],
	copyToResourcePacks: [`./resource_packs/${PROJECT_NAME}`],
};

const mcaddonTaskOptions: ZipTaskParameters = {
	...copyTaskOptions,
	outputFile: `./dist/packages/${MCWORLD_NAME}.mcaddon`,
};

export type McworldTaskParameters = ZipTaskParameters & {
	isTestWorld: boolean;
};

export type LocalDeployWorldParameters = {
	worldName: string;
	isTestWorld: boolean;
	server: boolean;
};

// Lint
task("lint", coreLint(["scripts/**/*.ts"], argv().fix));

// Build
task("typescript", tscTask());
task("bundle", bundleTask(bundleTaskOptions));
task("build", series("typescript", "bundle"));

// Clean
task("clean-local", cleanTask(DEFAULT_CLEAN_DIRECTORIES));
task("clean-collateral", cleanCollateralTask(STANDARD_CLEAN_PATHS));
task("clean", parallel("clean-local", "clean-collateral"));

// Package
task("copyArtifacts", copyTask(copyTaskOptions));
task("package", series("clean-collateral", "copyArtifacts"));

// Local Deploy used for deploying local changes directly to output via the bundler. It does a full build and package first just in case.
task(
	"local-deploy",
	watchTask(
		["scripts/**/*.ts", "behavior_packs/**/*.{json,lang,png}", "resource_packs/**/*.{json,lang,png}"],
		series("clean-local", "build", "package")
	)
);

// Creates .mcaddon file
task("createMcaddonFile", mcaddonTask(mcaddonTaskOptions));
task("mcaddon", series("clean-local", "build", "createMcaddonFile"));

const mcworldTaskOptions: McworldTaskParameters = {
	...copyTaskOptions,
	outputFile: `./dist/packages/${MCWORLD_NAME} ${ADD_ON_VERSION}.mcworld`,
	isTestWorld: false,
};

const mcworldTestTaskOptions: McworldTaskParameters = {
	...copyTaskOptions,
	outputFile: `./dist/packages/${MCWORLD_NAME}-test ${ADD_ON_VERSION}.mcworld`,
	isTestWorld: true,
};

// Creates .mcworld file
task("createMcworldFile", mcworldTask(mcworldTaskOptions));
task("mcworld", series("clean-local", "build", "createMcworldFile"));

// Creates an mcworld based from a testing world
task("createMcworldFile", mcworldTask(mcworldTestTaskOptions));
task("mcworld-test", series("clean-local", "build", "createMcworldFile"));

// Deploys target world to local minecraft worlds directory
task(
	"ldp-world",
	localDeployWorldTask({
		worldName: DEPLOYED_WORLD_NAME,
		isTestWorld: false,
		server: false,
	})
);

// Deploys target world to local minecraft worlds directory
task(
	"ldp-world-test",
	localDeployWorldTask({
		worldName: DEPLOYED_WORLD_NAME,
		isTestWorld: true,
		server: false,
	})
);

task(
	"ldp-world-server",
	localDeployWorldTask({
		worldName: DEPLOYED_WORLD_NAME,
		isTestWorld: false,
		server: true,
	})
);

task(
	"ldp-world-test-server",
	localDeployWorldTask({
		worldName: DEPLOYED_WORLD_NAME,
		isTestWorld: true,
		server: true,
	})
);

task("clean-all", cleanAllTask());
task("codegen-ids", codegenIdsTask());

function mcworldTask(options: McworldTaskParameters) {
	return async (context: any) => {
		// World template folder
		const distDir = DIST_PATH;
		const worldDir = options.isTestWorld ? TEST_WORLD_PATH : WORLD_TEMPLATE_PATH;

		if (!fs.existsSync(worldDir)) {
			console.error(`World template not found. Please create a directory '${worldDir}' in the project.`);
		}
		if (fs.readdirSync(worldDir).length === 0) {
			console.warn(`World template directory '${worldDir}' is empty!`);
		}

		const worldTemplatePath = path.join(distDir, "packages/world_template");
		const bpPath = path.join(worldTemplatePath, "behavior_packs", PROJECT_NAME);
		const rpPath = path.join(worldTemplatePath, "resource_packs", PROJECT_NAME);

		// Copy world template
		console.log(`... Copying world template from '${worldDir}' to '${worldTemplatePath}'`);
		copyRecursiveSync(worldDir, worldTemplatePath);
		console.log(`Done copying world template`);

		// Copy packs into dist
		console.log(`... Copying scripts`);
		const scriptSource = path.join(distDir, "scripts", "main.js");
		const scriptDest = path.join(`./behavior_packs/${PROJECT_NAME}/scripts/main.js`);
		copyRecursiveSync(scriptSource, scriptDest);
		console.log(`Done copying scripts`);

		console.log(`... Copying behavior packs`);
		copyRecursiveSync(`./behavior_packs/${PROJECT_NAME}`, bpPath);
		console.log(`Copied behavior packs`);

		console.log(`... Copying resource packs`);
		copyRecursiveSync(`./resource_packs/${PROJECT_NAME}`, rpPath);
		console.log(`Copied resource packs`);

		const outputMcwFile = path.resolve(options.outputFile);
		fs.mkdirSync(path.dirname(outputMcwFile), { recursive: true });

		const zip = new AdmZip();
		zip.addLocalFolder(worldTemplatePath);
		zip.writeZip(outputMcwFile);

		console.log(`Created .mcworld ${outputMcwFile}`);

		return Promise.resolve();
	};
}

/**
 * Deploys a target world to the Minecraft worlds directory.
 */
function localDeployWorldTask(options: LocalDeployWorldParameters) {
	return async (context: any) => {
		const worldDir = path.resolve(__dirname, options.isTestWorld ? TEST_WORLD_PATH : WORLD_TEMPLATE_PATH);

		if (!fs.existsSync(worldDir)) {
			console.error("World folder not found");
		}
		if (!fs.existsSync(worldDir)) {
			console.error(`World template not found. Please create a directory '${worldDir}' in the project.`);
		}
		if (fs.readdirSync(worldDir).length === 0) {
			console.warn(`World template directory '${worldDir}' is empty!`);
		}

		const destPath = path.resolve(
			options.server ? SERVER_WORLD_DEPLOYMENT_PATH : WORLD_DEPLOYMENT_PATH,
			options.server ? SERVER_WORLD_NAME : options.worldName
		);

		if (fs.existsSync(destPath)) {
			console.error(`Found existing world at '${destPath}'`);
			fs.rmSync(destPath, { recursive: true, force: true });
		}

		console.log(`... Deploying world to '${destPath}'`);
		copyRecursiveSync(worldDir, destPath);
		console.log(`Deployed world to '${destPath}'`);

		return Promise.resolve();
	};
}

function cleanAllTask() {
	return async (context: any) => {
		const deployedWorldPath = path.resolve(WORLD_DEPLOYMENT_PATH, DEPLOYED_WORLD_NAME);

		if (fs.existsSync(deployedWorldPath)) {
			console.error(`Found deployed world at '${deployedWorldPath}', removing...`);
			fs.rmSync(deployedWorldPath, { recursive: true, force: true });
			console.error(`Removed deployed world at '${deployedWorldPath}'`);
		}

		console.log(`Finished clean all`);
		return Promise.resolve();
	};
}

function codegenIdsTask() {
	return async (context: any) => {
		await generateBlockIds();
		await generateBlockStateIds();
		await generateEntityIds();
		await generateEntityEventIds();
		await generateEntityPropertyIds();
		await generateItemIds();
		await generateSoundIds();
	};
}

function copyRecursiveSync(src: string, dest: string) {
	if (!fs.existsSync(src)) return;
	const stats = fs.statSync(src);

	if (stats.isDirectory()) {
		fs.mkdirSync(dest, { recursive: true });
		for (const file of fs.readdirSync(src)) {
			copyRecursiveSync(path.join(src, file), path.join(dest, file));
		}
	} else {
		fs.copyFileSync(src, dest);
	}
}
