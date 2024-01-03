#! /usr/bin/env node

import chalk from "chalk";
import cliProgress from "cli-progress";
import { rimrafSync } from "rimraf";
import ora from "ora";
import fs from "fs";
import path from "path";

const isDirNodeProject = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) return false;

  const files = fs.readdirSync(dirPath);
  return files.includes("package.json");
};

const getAllNodeProjects = (dirPath: string): string[] => {
  if (path.basename(dirPath) === "node_modules") return [];

  const dirs = fs
    .readdirSync(dirPath)
    .filter((file) => fs.statSync(path.join(dirPath, file)).isDirectory());

  const nodeProjects = dirs.filter((dir) =>
    isDirNodeProject(path.join(dirPath, dir))
  );

  const subProjects = dirs.map((dir) =>
    getAllNodeProjects(path.join(dirPath, dir))
  );

  if (fs.readdirSync(dirPath).includes("package.json"))
    nodeProjects.push(dirPath);

  nodeProjects.push(...subProjects.flat());

  return nodeProjects;
};

console.time("execution time");
const cwd = process.cwd();

const spinner = ora("Searching for node projects...").start();
const nodeProjects = getAllNodeProjects(cwd);
spinner.succeed(`Found ${chalk.yellow(nodeProjects.length)} node projects`);

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

bar.start(nodeProjects.length, 0);

nodeProjects.forEach((project, i) => {
  rimrafSync(path.join(project, "node_modules"));

  if (process.argv.includes("-l") || process.argv.includes("--lock")) {
    rimrafSync(path.join(project, "package-lock.json"));
    rimrafSync(path.join(project, "yarn.lock"));
    rimrafSync(path.join(project, "pnpm-lock.yaml"));
  }

  bar.update(i + 1);
});

bar.stop();
console.log(chalk.green("Done!"));
console.timeEnd("execution time");
