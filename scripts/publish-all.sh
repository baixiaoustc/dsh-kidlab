#!/usr/bin/env bash
# 把 kidlab 系列 7 个包发布到 npm（默认 registry.npmjs.org）。
# 需要先登录：npm login   （或 ~/.npmrc 里配好 _authToken）
# 用法:  bash scripts/publish-all.sh            # 发布全部
#        bash scripts/publish-all.sh kid-coder  # 只发某一个
set -euo pipefail
cd "$(dirname "$0")/.."

who=$(npm whoami 2>/dev/null || true)
if [ -z "$who" ]; then
  echo "✗ 未登录 npm（npm whoami 失败）。先跑:  npm login" >&2
  exit 1
fi
echo "npm 身份: $who  |  registry: $(npm config get registry)"
echo

if [ "$#" -gt 0 ]; then
  slugs=("$@")
else
  slugs=(kid-coder kid-sysmon kid-network kid-storage kid-memory kid-security kid-process)
fi

for s in "${slugs[@]}"; do
  dir="plugins/$s"
  [ -f "$dir/package.json" ] || { echo "✗ 找不到 $dir"; exit 1; }
  name=$(node -e "console.log(require('./$dir/package.json').name)")
  ver=$(node -e "console.log(require('./$dir/package.json').version)")
  echo "== 发布 $name@$ver =="
  ( cd "$dir" && npm publish --access public )
  echo
done
echo "✓ 完成"
