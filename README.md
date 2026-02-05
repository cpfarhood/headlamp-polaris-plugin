# polaris-headlamp-plugin

A [Headlamp](https://headlamp.dev/) plugin that surfaces [Fairwinds Polaris](https://polaris.docs.fairwinds.com/) audit results directly in the Headlamp UI.

## What It Does

Adds a **Polaris** sidebar entry to Headlamp that displays:

- **Cluster Score** -- overall Polaris score as a percentage (color-coded green/amber/red)
- **Check Summary** -- total, pass, warning, and danger counts across all workloads
- **Cluster Info** -- node, pod, namespace, and controller counts

Data is read from the `ConfigMap/polaris-dashboard` in the `polaris` namespace (key: `dashboard.json`), which is created by the standard Polaris Helm chart. The plugin is read-only -- it never writes to the cluster.

Results are cached and refreshed on a user-configurable interval (1 / 5 / 10 / 30 minutes, default 5). The setting persists in the browser's localStorage.

Error states are handled explicitly: RBAC denied (403), Polaris not installed (404), malformed JSON, and loading.

## Prerequisites

- **Headlamp** >= v0.26 deployed in your cluster
- **Polaris** installed via the [official Helm chart](https://github.com/FairwindsOps/polaris) with the dashboard component enabled
- The Headlamp service account must have RBAC permission to `get` ConfigMaps in the `polaris` namespace

## Development

### Setup

```bash
git clone https://git.farh.net/farhoodliquor/polaris-headlamp-plugin.git
cd polaris-headlamp-plugin
npm install
```

### Run locally (hot reload)

```bash
npm start
```

This starts the Headlamp plugin dev server. Point a running Headlamp instance at the dev server to see changes live.

### Build for production

```bash
npm run build        # outputs dist/main.js
npm run package      # creates polaris-headlamp-plugin-<version>.tar.gz
```

### Type-check

```bash
npm run tsc
```

## Project Structure

```
src/
  index.tsx                  -- Entry point. Registers sidebar entry and route at /polaris.
  api/
    polaris.ts               -- TypeScript types matching the Polaris AuditData schema,
                                usePolarisData() hook with caching, countResults() utility,
                                and refresh interval settings (localStorage).
  components/
    PolarisView.tsx          -- Main page component. Score badge, check summary cards,
                                cluster info, error states, refresh interval selector.
```

## Deploying to Headlamp

### Option 1: Docker init container (recommended for Kubernetes)

The plugin ships as a container image at `git.farh.net/farhoodliquor/polaris-headlamp-plugin`.

Add it as an init container in your Headlamp Helm values:

```yaml
initContainers:
  - name: polaris-plugin
    image: git.farh.net/farhoodliquor/polaris-headlamp-plugin:v0.0.1
    command: ["sh", "-c", "cp -r /plugins/* /headlamp/plugins/"]
    volumeMounts:
      - name: plugins
        mountPath: /headlamp/plugins

volumes:
  - name: plugins
    emptyDir: {}

volumeMounts:
  - name: plugins
    mountPath: /headlamp/plugins
```

### Option 2: Manual tarball install

Download the `.tar.gz` from the [releases page](https://git.farh.net/farhoodliquor/polaris-headlamp-plugin/releases), then extract into Headlamp's plugin directory:

```bash
tar xzf polaris-headlamp-plugin-0.0.1.tar.gz -C /headlamp/plugins/
```

### Option 3: Build from source

```bash
npm install
npm run build
npx @kinvolk/headlamp-plugin extract . /headlamp/plugins
```

## Releasing

Releases are automated via Gitea Actions. To cut a release:

```bash
# Bump version in package.json, then:
git add package.json package-lock.json
git commit -m "chore: bump version to 0.0.2"
git tag v0.0.2
git push origin main v0.0.2
```

The CI pipeline (`.gitea/workflows/release.yaml`) will:

1. Build the plugin in a `node:20` container
2. Package a `.tar.gz` tarball
3. Build and push a Docker image to `git.farh.net/farhoodliquor/polaris-headlamp-plugin:{tag}` and `:latest`
4. Create a Gitea release with the tarball attached

### CI secrets

| Secret | Purpose |
|---|---|
| `REGISTRY_TOKEN` | Gitea personal access token with `package:write` scope, used to push Docker images to the container registry |

The release creation itself uses the built-in `github.token` -- no extra secret needed for that.

## RBAC

The plugin reads a single ConfigMap. Minimum RBAC required for the Headlamp service account:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: headlamp-polaris-reader
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["polaris-dashboard"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: headlamp-polaris-reader
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: headlamp-polaris-reader
subjects:
  - kind: ServiceAccount
    name: headlamp
    namespace: headlamp
```

## Data Source

The plugin reads from:

- **ConfigMap**: `polaris-dashboard`
- **Namespace**: `polaris`
- **Key**: `dashboard.json`

This ConfigMap is created automatically when Polaris is installed with the dashboard enabled. The JSON structure matches Polaris's `AuditData` schema (`pkg/validator/output.go`):

```
AuditData
  Score            -- cluster score (0-100)
  ClusterInfo      -- nodes, pods, namespaces, controllers
  Results[]        -- per-workload results
    Results{}      -- top-level check results (ResultSet)
    PodResult
      Results{}    -- pod-level check results
      ContainerResults[]
        Results{}  -- container-level check results
```

Each check in a `ResultSet` has `Success` (bool) and `Severity` (`"warning"` or `"danger"`).

## License

MIT
