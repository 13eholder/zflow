---
name: ci-cd-and-automation
description: 自动化 CI/CD 流水线设置。在设置或修改构建和部署流水线时使用。当需要自动化质量门禁、在 CI 中配置测试运行器，或建立部署策略时使用。当需要处理 CI 上不稳定（flaky）的测试时使用。
---

# CI/CD 与自动化

## 概述

自动化质量门禁，确保没有任何变更在未通过测试、lint、类型检查和构建的情况下到达生产环境。CI/CD 是每个其他技能的强制执行机制——它捕获人类和智能体遗漏的问题，并且在每一次变更上都一致地做到这一点。

**左移：** 尽可能在流水线的早期阶段捕获问题。在 lint 中捕获的缺陷成本是几分钟；同样的缺陷在生产环境中捕获的成本是数小时。将检查向上游移动——静态分析在测试之前，测试在预发布之前，预发布在生产之前。

**更快即更安全：** 更小的批次和更频繁的发布降低风险，而非增加风险。包含 3 个变更的部署比包含 30 个变更的部署更容易调试。频繁发布能建立对发布过程本身的信心。

## 何时使用

- 设置新项目的 CI 流水线
- 添加或修改自动化检查
- 配置部署流水线
- 当变更应触发自动化验证时
- 调试 CI 失败

## 质量门禁流水线

每个变更在合并之前都要通过这些门禁：

```
Pull Request 已创建
    │
    ▼
┌─────────────────┐
│   LINT 检查      │  golangci-lint / clippy
│   ↓ 通过         │
│   静态检查       │  go vet / cargo check
│   ↓ 通过         │
│   单元测试       │  go test / cargo nextest
│   ↓ 通过         │
│   构建           │  go build / cargo build
│   ↓ 通过         │
│   集成测试       │  存储/数据库 集成测试
│   ↓ 通过         │
│   集群测试（可选）│  多节点集成 + 故障注入
│   ↓ 通过         │
│   安全审计       │  govulncheck / cargo audit
│   ↓ 通过         │
│   二进制体积检查 │  二进制体积基线
└─────────────────┘
    │
    ▼
  准备好接受审查
```

**任何门禁都不能跳过。** 如果 lint 失败，修复 lint——不要禁用规则。如果测试失败，修复代码——不要跳过测试。

## GitHub Actions 配置

### 基本 CI 流水线

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true

      - name: Lint
        uses: golangci/golangci-lint-action@v6

      - name: Vet
        run: go vet ./...

      - name: Test
        run: go test -race -coverprofile=coverage.out ./...

      - name: Build
        run: go build ./...

      - name: Vulnerability check
        run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

### 包含数据库集成测试

```yaml
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: ci_user
          POSTGRES_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true
      - name: Run migrations
        run: goose -dir migrations postgres "$DATABASE_URL" up
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
      - name: Integration tests
        run: go test -tags=integration ./internal/store/...
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
```

> **注意：** 即使对于仅用于 CI 的测试数据库，也应使用 GitHub Secrets 管理凭证而非硬编码值。这能培养良好习惯，并防止测试凭证在其他上下文中被意外复用。

### 集群集成测试

```yaml
  cluster-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true
      - name: Build binaries
        run: make build
      - name: Start 3-node test cluster
        run: ./scripts/test-cluster.sh up --nodes 3
      - name: Run cluster integration tests
        run: go test -tags=cluster ./tests/cluster/...
      - name: Collect cluster logs
        if: failure()
        run: ./scripts/test-cluster.sh collect-logs
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cluster-logs
          path: test-cluster-logs/
```

### 故障注入与 Soak 测试（nightly）

慢速、长耗时的测试不进 PR 关键路径，改为按计划运行：

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨运行

jobs:
  nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - name: Start test cluster
        run: ./scripts/test-cluster.sh up --nodes 5
      - name: Fault-injection suite
        run: go test -tags=faultinjection ./tests/fault/...
      - name: Soak test
        run: ./scripts/soak-test.sh --duration 4h --workload mixed
```

## 将 CI 失败反馈给智能体

AI 智能体与 CI 结合的力量在于反馈循环。当 CI 失败时：

```
CI 失败
    │
    ▼
复制失败输出
    │
    ▼
将其提供给智能体：
"CI 流水线因以下错误而失败：
[粘贴具体错误]
修复问题并在再次推送前在本地验证。"
    │
    ▼
智能体修复 → 推送 → CI 再次运行
```

**关键模式：**

```
Lint 失败 → 智能体运行 `golangci-lint run --fix` 并提交
静态检查错误 → 智能体读取错误位置并修复
测试失败 → 智能体遵循 debugging-and-error-recovery 技能
构建错误 → 智能体检查配置和依赖项
```

## 部署策略

### 预发布部署

每个 PR 将构建产物部署到预发布集群，用于手动验证：

```yaml
# 在 PR 上将构建产物部署到预发布节点
deploy-staging:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-go@v5
      with:
        go-version: '1.23'
    - name: Build
      run: make build
    - name: Deploy to staging cluster
      run: ./scripts/rolling-deploy.sh --env staging --batch 1
```

### 功能标志

功能标志将部署与发布解耦。将不完整或有风险的功能部署在标志后面，从而可以：

- **不启用就发布代码。** 尽早合并到 main，准备好时再启用。
- **无需重新部署即可回滚。** 禁用标志而非回滚代码。
- **灰度发布新功能。** 先对 1% 用户启用，然后 10%，然后 100%。
- **运行 A/B 测试。** 比较有和没有该功能时的行为。

```go
// 简单的功能标志模式
if featureFlags.IsEnabled("new-replication-protocol", nodeID) {
	return newReplicator.Replicate(ctx, entries)
}
return legacyReplicator.Replicate(ctx, entries)
```

**标志生命周期：** 创建 → 为测试启用 → 灰度 → 全量上线 → 移除标志和死代码。永远存在的标志会变成技术债务——在创建标志时就设置清理日期。

### 分阶段上线

```
PR 合并到 main
    │
    ▼
  预发布部署（自动）
    │ 手动验证
    ▼
  生产部署（手动触发或预发布后自动）
    │
    ▼
  监控错误（15 分钟窗口期）
    │
    ├── 检测到错误 → 回滚
    └── 干净 → 完成
```

### 回滚计划

每次部署都应该是可逆的：

```yaml
# 手动回滚工作流
name: Rollback
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        run: |
          # 从包仓库安装指定旧版本，逐节点滚动回退
          ./scripts/rolling-deploy.sh \
            --pkg myservice=${{ inputs.version }} \
            --strategy rolling --batch 1
```

## 环境管理

```
.env.example       → 已提交（开发者的模板）
.env                → 不提交（本地开发）
.env.test           → 已提交（测试环境，无真实机密）
CI 机密             → 存储在 GitHub Secrets / vault 中
生产机密            → 存储在部署平台 / vault 中
```

CI 永远不应拥有生产机密。为 CI 测试使用单独的机密。

## CI 之外的自动化

### Dependabot / Renovate

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: gomod
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: cargo
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### 构建值守角色

指定某人负责保持 CI 绿色。当构建失败时，构建值守者的工作是修复或回滚——而不是导致构建失败的变更的作者。这可以防止在每个人都认为别人会修复时，失败的构建不断积累。

### PR 检查

- **必须审查：** 合并前至少 1 人批准
- **必须状态检查：** 合并前 CI 必须通过
- **分支保护：** 不允许 force-push 到 main
- **自动合并：** 如果所有检查通过且已批准，自动合并

## CI 优化

当流水线超过 10 分钟时，按影响顺序应用以下策略：

```
CI 流水线太慢？
├── 缓存依赖项
│   └── 使用 setup-go 的 cache 选项缓存模块与构建产物，Rust 项目用 sccache
├── 并行运行作业
│   └── 将 lint、vet、test、build 拆分为独立的并行作业
├── 只运行变更相关的部分
│   └── 使用路径过滤器跳过不相关的作业（例如，跳过仅文档 PR 的集群测试）
├── 使用矩阵构建
│   └── 将测试套件分片到多个运行器上
├── 优化测试套件
│   └── 从关键路径中移除慢速测试，改为按计划运行
└── 使用更大的运行器
    └── GitHub 托管的更大运行器或自托管运行器用于 CPU 密集型构建
```

**示例：缓存和并行**
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23', cache: true }
      - uses: golangci/golangci-lint-action@v6

  vet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23', cache: true }
      - run: go vet ./...

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.23', cache: true }
      - run: go test -race -coverprofile=coverage.out ./...
```

## 常见合理化借口

| 合理化借口 | 现实 |
|---|---|
| "CI 太慢了" | 优化流水线（见下方 CI 优化），不要跳过它。一个 5 分钟的流水线可以防止数小时的调试。 |
| "这个变更是小事，跳过 CI" | 小变更也会破坏构建。对小变更来说 CI 本来也很快。 |
| "这个测试不稳定，重新运行就行" | 不稳定的测试掩盖了真正的缺陷，浪费了所有人的时间。修复不稳定性。 |
| "我们以后再加 CI" | 没有 CI 的项目会累积损坏状态。从第一天就设置好它。 |
| "手动测试就够了" | 手动测试不可扩展且不可重复。自动化你能自动化的内容。 |

## 红旗警告

- 项目中没有 CI 流水线
- CI 失败被忽略或静默处理
- 为使流水线通过而在 CI 中禁用测试
- 生产部署没有预发布验证
- 没有回滚机制
- 机密存储在代码或 CI 配置文件中（而非 Secrets Manager）
- CI 时间过长且没有优化努力

## 验证

设置或修改 CI 之后：

- [ ] 所有质量门禁都已到位（lint、类型、测试、构建、审计）
- [ ] 流水线在每个 PR 和推送到 main 时运行
- [ ] 失败会阻止合并（已配置分支保护）
- [ ] CI 结果反馈回开发循环
- [ ] 机密存储在 Secrets Manager 中，而非代码中
- [ ] 部署具有回滚机制
- [ ] 流水线的测试套件在 10 分钟内运行完成
