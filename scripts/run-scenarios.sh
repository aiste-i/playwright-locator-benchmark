#!/usr/bin/env bash
# Use set -euo pipefail but allow errors in specific places
set -eu
set -o pipefail

# Ensure the script is executable on checkout (only if needed)
if [[ ! -x "${BASH_SOURCE[0]}" ]]; then
  chmod +x "${BASH_SOURCE[0]}" 2>/dev/null || true
fi

# Run Playwright tests once per change scenario (bash version for CI)
# Usage:
#   ./scripts/run-scenarios.sh                # baseline + mutated for default scenarios
#   ./scripts/run-scenarios.sh --skip-baseline
#   ./scripts/run-scenarios.sh --projects "getByRole locators,css locators"
#   ./scripts/run-scenarios.sh --scenario-file change-injection/scenarios/index.ts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
cd "$ROOT_DIR"

SCENARIO_FILE="change-injection/scenarios"
PROJECTS=""
SKIP_BASELINE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario-file)
      SCENARIO_FILE="$2"; shift 2;;
    --projects)
      PROJECTS="$2"; shift 2;;
    --skip-baseline)
      SKIP_BASELINE=1; shift;;
    -h|--help)
      sed -n '1,120p' "$SCRIPT_DIR/$(basename "$0")"; exit 0;;
    *)
      echo "Unknown arg: $1"; exit 2;;
  esac
done

# Extract scenario ids from all scenario files
if [[ -d "$SCENARIO_FILE" ]]; then
  # Directory: search all .ts files
  mapfile -t SCENARIOS < <(find "$SCENARIO_FILE" -name "*.ts" -not -name "index.ts" -exec sed -n "s/.*id:\s*['\"]\([^'\"]*\)['\"].*/\1/p" {} \; | sort -u)
elif [[ -f "$SCENARIO_FILE" ]]; then
  # Single file: extract from that file
  mapfile -t SCENARIOS < <(sed -n "s/.*id:\s*['\"]\([^'\"]*\)['\"].*/\1/p" "$SCENARIO_FILE" | sort -u)
else
  echo "Scenario file/directory not found: $SCENARIO_FILE" >&2
  exit 2
fi

if [[ ${#SCENARIOS[@]} -eq 0 ]]; then
  echo "No scenarios found in $SCENARIO_FILE" >&2
  exit 2
fi

echo "Found scenarios:"
for s in "${SCENARIOS[@]}"; do echo "  - $s"; done

# Build playwright project args
PLAYWRIGHT_ARGS=()
if [[ -n "$PROJECTS" ]]; then
  IFS=',' read -r -a PARR <<< "$PROJECTS"
  for p in "${PARR[@]}"; do
    ptrim="$(echo "$p" | sed 's/^\s*//;s/\s*$//')"
    PLAYWRIGHT_ARGS+=(--project "$ptrim")
  done
fi

run_playwright() {
  echo "Running: npx playwright test ${PLAYWRIGHT_ARGS[*]} $*"
  if ! npx playwright test "${PLAYWRIGHT_ARGS[@]}" "$@"; then
    return 1
  fi
  return 0
}

FAILED_SCENARIOS=()
FAILED_COUNT=0

if [[ $SKIP_BASELINE -eq 0 ]]; then
  echo ""
  echo "=== Baseline run (PHASE=baseline) ==="
  export PHASE=baseline
  unset SCENARIO_ID 2>/dev/null || true
  if ! run_playwright; then
    echo "Baseline run had failures" >&2
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
fi

echo ""
echo "=== Mutated runs (each scenario) ==="
for scenario in "${SCENARIOS[@]}"; do
  echo ""
  echo "--- Scenario: $scenario ---"
  export PHASE=mutated
  export SCENARIO_ID="$scenario"

  # Determine which test suite should run for this scenario.
  # Scenarios are named with a prefix such as "todomvc-...", "realworld-...", or "admin-...".
  get_test_path_for_scenario() {
    # Extract the prefix before the first - or _ and normalize to lower-case.
    # This avoids accidental substring matches (e.g. 'rw' matching 'todomvc' if substrings overlap).
    local prefix
    prefix="${1%%[-_]*}"
    prefix="$(echo "$prefix" | tr '[:upper:]' '[:lower:]')"

    case "$prefix" in
      todo|todomvc)
        echo "tests/TodoMVC"
        return
        ;;
      rw|realworld)
        echo "tests/RealWorld"
        return
        ;;
      *)
        # No recognized prefix — fall back to pattern matching as a last resort
        local s_lc
        s_lc="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
        if [[ "$s_lc" == *todomvc* ]]; then
          echo "tests/TodoMVC"; return
        elif [[ "$s_lc" == *realworld* || "$s_lc" == *-rw* ]]; then
          echo "tests/RealWorld"; return
        fi
        # Unknown -> empty causes fallback to full-suite
        echo ""
        ;;
    esac
  }

  TEST_PATH="$(get_test_path_for_scenario "$scenario")"
  if [[ -n "$TEST_PATH" ]]; then
    if ! run_playwright "$TEST_PATH"; then
      echo "Scenario $scenario had failures" >&2
      FAILED_SCENARIOS+=("$scenario")
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  else
    if ! run_playwright; then
      echo "Scenario $scenario had failures" >&2
      FAILED_SCENARIOS+=("$scenario")
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  fi
done

echo ""
echo "=== Summary ==="
echo "Total scenarios: ${#SCENARIOS[@]}"
if [[ $FAILED_COUNT -gt 0 ]]; then
  echo "Failed scenarios: $FAILED_COUNT"
  for failed in "${FAILED_SCENARIOS[@]}"; do
    echo "  - $failed"
  done
  echo ""
  echo "Some scenarios had failures. Check test output above for details."
else
  echo "All scenarios completed successfully"
fi
echo ""
echo "Check datasets/ for runs-*.jsonl and mutations-*.jsonl files."

# Exit with error code if any failures occurred
if [[ $FAILED_COUNT -gt 0 ]]; then
  exit 1
fi 
