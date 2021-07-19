import fsExtra from "fs-extra";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { Artifact, Artifacts, ProjectPathsConfig } from "hardhat/types";
import { localPathToSourceName } from "hardhat/utils/source-names";
import path from "path";
const fejs = require('@berlinvege/fejs');
import * as fs from 'fs';
import { FeConfig } from "./types";

const ARTIFACT_FORMAT_VERSION = "hh-fe-artifact-1";

export async function compile(
  feConfig: FeConfig,
  paths: ProjectPathsConfig,
  artifacts: Artifacts
) {
  const feVersion = feConfig.version;

  const files = await getFeSources(paths);

  let someContractFailed = false;

  for (const file of files) {
    const pathFromCWD = path.relative(process.cwd(), file);
    const pathFromSources = path.relative(paths.sources, file);
    console.log("Compiling with Fe...");

    const sourceName = await localPathToSourceName(paths.root, file);
    const compilerResult = fejs.compile(fs.readFileSync(sourceName, "utf8"))
  for (const [key, value] of Object.entries(compilerResult.Contracts)) {
    const artifact = getArtifactFromFeOutput(sourceName+'.'+key, value);
    await artifacts.saveArtifactAndDebugFile(artifact);
  }

}

  if (someContractFailed) {
    throw new NomicLabsHardhatPluginError(
      "@berlinvege/hardhat-fe",
      "Compilation failed"
    );
  }

  //await saveLastFeVersionUsed(feVersion, paths);
}

async function getFeSources(paths: ProjectPathsConfig) {
  const glob = await import("glob");
  const feFiles = glob.sync(path.join(paths.sources, "**", "*.fe"));

  return feFiles;
}

function pathToContractName(file: string) {
  const sourceName = path.basename(file);
  return sourceName.substring(0, sourceName.indexOf("."));
}

function getArtifactFromFeOutput(sourceName: string, output: any): Artifact {
  const contractName = pathToContractName(sourceName);

  return {
    _format: ARTIFACT_FORMAT_VERSION,
    contractName,
    sourceName,
    abi: output.abi,
    bytecode: add0xPrefixIfNecessary(output.bytecode),
    deployedBytecode: add0xPrefixIfNecessary(output.bytecode_runtime),
    linkReferences: {},
    deployedLinkReferences: {},
  };
}

function add0xPrefixIfNecessary(hex: string): string {
  hex = hex.toLowerCase();

  if (hex.slice(0, 2) === "0x") {
    return hex;
  }

  return `0x${hex}`;
}
/*
async function getLastFeVersionUsed(paths: ProjectPathsConfig) {
  const filePath = path.join(paths.cache, LAST_FE_VERSION_USED_FILENAME);
  if (!(await fsExtra.pathExists(filePath))) {
    return undefined;
  }

  return fsExtra.readFile(filePath, "utf8");
}

async function saveLastFeVersionUsed(
  version: string,
  paths: ProjectPathsConfig
) {
  const filePath = path.join(paths.cache, LAST_FE_VERSION_USED_FILENAME);
  await fsExtra.ensureDir(path.dirname(filePath));
  return fsExtra.writeFile(filePath, version, "utf8");
}
*/
