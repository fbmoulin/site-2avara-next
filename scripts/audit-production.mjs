import JSON5 from "json5"
import semver from "semver"

// Bun audits the entire lockfile. Gate the declared production graph separately,
// retaining visibility of development-only findings instead of treating them as passes.
export function auditProduction(lock, advisories) {
  if (!advisories || typeof advisories !== "object" || Array.isArray(advisories))
    throw new Error("Invalid dependency audit response")
  const visited = new Set()
  const findings = []
  function resolveDependency(from, name) {
    let parent = from
    while (parent) {
      if (lock.packages[`${parent}/${name}`]) return `${parent}/${name}`
      const slash = parent.lastIndexOf("/")
      if (slash < 0) break
      parent = parent.slice(0, slash)
      if (!parent.includes("/") && parent.startsWith("@")) break
    }
    return name
  }
  function visit(key, via = []) {
    if (visited.has(key) || !lock.packages[key]) return
    visited.add(key)
    const [identity, , metadata = {}] = lock.packages[key]
    const separator = identity.lastIndexOf("@")
    const name = identity.slice(0, separator)
    const version = identity.slice(separator + 1)
    for (const advisory of advisories[name] ?? []) {
      if (!semver.validRange(advisory.vulnerable_versions))
        throw new Error(`Cannot classify advisory for ${name}`)
      if (semver.satisfies(version, advisory.vulnerable_versions)) {
        findings.push({ name, version, severity: advisory.severity, url: advisory.url, via })
      }
    }
    const dependencies = {
      ...metadata.dependencies,
      ...metadata.optionalDependencies,
      // Bun stores optional peer metadata separately. These are integrations, not
      // production edges; explicit dependency/optionalDependency edges still count.
      ...Object.fromEntries(
        Object.entries(metadata.peerDependencies ?? {}).filter(
          ([name]) => !metadata.optionalPeers?.includes(name),
        ),
      ),
    }
    for (const dependency of Object.keys(dependencies))
      visit(resolveDependency(key, dependency), [...via, name])
  }
  for (const dependency of Object.keys(lock.workspaces[""].dependencies)) visit(dependency)
  const total = new Set(
    Object.values(advisories)
      .flat()
      .map((advisory) => advisory.url),
  ).size
  return {
    productionEntriesChecked: visited.size,
    productionFindings: findings,
    totalLockfileAdvisories: total,
  }
}

if (import.meta.main) {
  const lock = JSON5.parse(await Bun.file("bun.lock").text())
  const audit = Bun.spawn(["bun", "audit", "--json"], { stdout: "pipe", stderr: "inherit" })
  const output = await new Response(audit.stdout).text()
  const code = await audit.exited
  if (code !== 0 && code !== 1) throw new Error("Dependency audit could not be completed")
  const result = auditProduction(lock, JSON.parse(output))
  console.log(JSON.stringify(result, null, 2))
  if (result.productionFindings.length) process.exitCode = 1
}
