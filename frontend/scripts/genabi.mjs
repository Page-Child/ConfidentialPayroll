import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "ConfidentialPayroll";

// <root>/packages/fhevm-hardhat-template
const rel = "../contract";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

// Basic mapping to infer chainId from common network names when not present in deployment json
const CHAIN_ID_BY_NAME = {
  localhost: 31337,
  hardhat: 31337,
  sepolia: 11155111,
  mainnet: 1,
  ethereum: 1,
};

function readDeployment(chainName, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractFile)) {
    return undefined;
  }

  const jsonString = fs.readFileSync(contractFile, "utf-8");
  const obj = JSON.parse(jsonString);
  // annotate convenience fields
  obj.chainName = chainName;
  obj.chainId = obj.chainId ?? CHAIN_ID_BY_NAME[chainName];
  return obj;
}

// Collect all available deployments
const deployments = {};
const available = [];

if (fs.existsSync(deploymentsDir)) {
  const networkDirs = fs
    .readdirSync(deploymentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const network of networkDirs) {
    const dep = readDeployment(network, CONTRACT_NAME);
    if (dep && dep.address && dep.abi && dep.chainId) {
      deployments[String(dep.chainId)] = dep;
      available.push(dep);
      console.log(`✓ Found ${network} deployment at ${dep.address}`);
    } else if (dep) {
      console.warn(`⚠ Skipping ${network}: missing address/abi/chainId`);
    }
  }
} else {
  console.warn(`⚠ Deployments directory not found: ${deploymentsDir}`);
}

// Decide ABI source:
// - Prefer ABI from the first available deployment
// - Warn (do not exit) if ABIs differ across deployments
// - Fallback to contract artifact if no deployments are available
let abi;
if (available.length > 0) {
  abi = available[0].abi;
  for (const dep of available) {
    if (JSON.stringify(dep.abi) !== JSON.stringify(abi)) {
      console.warn(
        `${line}ABI differs between deployments. Using ABI from '${available[0].chainName}'.${line}`
      );
      break;
    }
  }
} else {
  const artifactFile = path.join(
    dir,
    "artifacts",
    "contracts",
    `${CONTRACT_NAME}.sol`,
    `${CONTRACT_NAME}.json`
  );
  if (fs.existsSync(artifactFile)) {
    const artifact = JSON.parse(fs.readFileSync(artifactFile, "utf-8"));
    abi = artifact.abi ?? [];
    console.log(`✓ Using ABI from artifact: ${artifactFile}`);
  } else {
    console.warn(`⚠ No deployments and no artifact found. ABI will be empty array.`);
    abi = [];
  }
}


const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abi }, null, 2)} as const;
\n`;

// Generate addresses object with only available deployments
let addressesEntries = [];
for (const [chainId, deployment] of Object.entries(deployments)) {
  const chainName =
    deployment.chainName ??
    (chainId === "11155111"
      ? "sepolia"
      : chainId === "31337"
      ? "hardhat"
      : "unknown");
  addressesEntries.push(
    `  "${chainId}": { address: "${deployment.address}", chainId: ${deployment.chainId}, chainName: "${chainName}" }`
  );
}

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressesEntries.join(",\n")}
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

