import Supplier from '../models/Supplier.js';
import { initDatabase } from '../db/init.js';

console.log('🧪 Testing Aegis Nexus Database - 100% Quantity Constraint\n');

// Initialize DB (will use existing if present)
initDatabase();

console.log('========================================');
console.log('TEST 1: Find alternatives for 5,000 units');
console.log('========================================');
const test1 = Supplier.findAlternatives(5000);
console.log(`✓ Found ${test1.length} suppliers with capacity >= 5,000 units`);
test1.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} - Stock: ${s.stock_capacity}, Cost: $${s.cost_per_unit}, Lead: ${s.lead_time_days}d`);
});

console.log('\n========================================');
console.log('TEST 2: Find alternatives for 25,000 units');
console.log('========================================');
const test2 = Supplier.findAlternatives(25000);
console.log(`✓ Found ${test2.length} suppliers with capacity >= 25,000 units`);
test2.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} - Stock: ${s.stock_capacity}, Cost: $${s.cost_per_unit}, Lead: ${s.lead_time_days}d`);
});

console.log('\n========================================');
console.log('TEST 3: Find alternatives for 50,000 units (edge case)');
console.log('========================================');
const test3 = Supplier.findAlternatives(50000);
console.log(`✓ Found ${test3.length} supplier(s) with capacity >= 50,000 units`);
test3.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} - Stock: ${s.stock_capacity}, Cost: $${s.cost_per_unit}, Lead: ${s.lead_time_days}d`);
});

console.log('\n========================================');
console.log('TEST 4: Find alternatives for 100,000 units (zero results expected)');
console.log('========================================');
const test4 = Supplier.findAlternatives(100000);
console.log(`✓ Found ${test4.length} suppliers with capacity >= 100,000 units`);
if (test4.length === 0) {
    console.log('  ✓ PASS: No suppliers returned (as expected)');
} else {
    console.log('  ✗ FAIL: Should have returned zero results!');
}

console.log('\n========================================');
console.log('TEST 5: Exclude specific suppliers');
console.log('========================================');
const test5 = Supplier.findAlternatives(10000, [2, 3], 3); // Exclude TechForge and Nordic Steel
console.log(`✓ Found ${test5.length} suppliers (excluding IDs 2, 3)`);
test5.forEach((s, idx) => {
    console.log(`  ${idx + 1}. ${s.name} (ID: ${s.id})`);
    if (s.id === 2 || s.id === 3) {
        console.log('  ✗ FAIL: Excluded supplier appeared in results!');
    }
});

console.log('\n========================================');
console.log('VALIDATION SUMMARY');
console.log('========================================');

// Verify ALL returned suppliers meet the constraint
let allPassed = true;

const runValidation = (quantity, results, testName) => {
    const failed = results.filter(s => s.stock_capacity < quantity);
    if (failed.length > 0) {
        console.log(`✗ ${testName} FAILED: ${failed.length} supplier(s) below required capacity`);
        failed.forEach(s => {
            console.log(`  - ${s.name}: ${s.stock_capacity} < ${quantity}`);
        });
        allPassed = false;
    } else {
        console.log(`✓ ${testName} PASSED: All suppliers meet quantity constraint`);
    }
};

runValidation(5000, test1, 'Test 1');
runValidation(25000, test2, 'Test 2');
runValidation(50000, test3, 'Test 3');

if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! 100% quantity constraint is enforced.\n');
} else {
    console.log('\n❌ SOME TESTS FAILED! Review the constraint logic.\n');
    process.exit(1);
}
