import { getUniqueTitle } from '../lib/utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runUniqueTitleTests() {
  console.log('=== ATELIER UNIQUE NAMING ENGINE TEST SUITE ===\n');

  // Test 1: Brand new clean title remains untouched
  const t1 = getUniqueTitle('Project Alpha', ['Project Beta', 'Project Gamma']);
  assert(t1 === 'Project Alpha', 'Unused title is preserved unchanged');

  // Test 2: Duplicate title appends (2)
  const t2 = getUniqueTitle('Project Alpha', ['Project Alpha', 'Project Beta']);
  assert(t2 === 'Project Alpha (2)', 'Duplicate title appends (2)');

  // Test 3: Multiple collision increments to next available number
  const t3 = getUniqueTitle('Project Alpha', ['Project Alpha', 'Project Alpha (2)', 'Project Alpha (3)']);
  assert(t3 === 'Project Alpha (4)', 'Multiple collisions increment to (4)');

  // Test 4: Case insensitive collision check
  const t4 = getUniqueTitle('project alpha', ['PROJECT ALPHA', 'Project Beta']);
  assert(t4 === 'project alpha (2)', 'Case-insensitive collision appends (2)');

  // Test 5: Empty title defaults cleanly to Untitled
  const t5 = getUniqueTitle('', ['Other Project']);
  assert(t5 === 'Untitled', 'Empty title resolves to "Untitled"');

  const t6 = getUniqueTitle('', ['Untitled']);
  assert(t6 === 'Untitled (2)', 'Colliding empty title resolves to "Untitled (2)"');

  console.log('\nAll 6 Unique Naming Engine tests PASSED successfully!');
}

runUniqueTitleTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
