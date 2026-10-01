import assert from "node:assert/strict";
import { PROJECT_FUNDING, SEED_PROJECT } from "../../prisma/seed-data";

assert.equal(PROJECT_FUNDING.apicil, 2997);
assert.equal(PROJECT_FUNDING.bde, 116);
assert.equal(PROJECT_FUNDING.fablab, 70);
assert.equal(SEED_PROJECT.totalBudget, 3183);

console.log("Project funding total test passed.");
