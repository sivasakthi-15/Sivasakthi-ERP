const fs = require('fs');
let code = fs.readFileSync('server/src/utils/offline-mongoose.ts', 'utf8');

// Replace localDb['...'] = [ with ...: [
code = code.replace(/localDb\['([^']+)'\] = \[/g, '$1: [');

// Replace the start of the seedOfflineDatabase function with defaultSeedData initialization
code = code.replace(
  /\/\/ Seed sample data for offline mode\nexport function seedOfflineDatabase\(\) \{\n  logger\.info\('Initializing sample seed data for Mongoose offline mode\.\.\.'\);\n\n/g,
  'export const defaultSeedData: Record<string, any[]> = {\n'
);

// Replace the end of the seedOfflineDatabase function
code = code.replace(
  /  logger\.info\('Sample seed data initialized successfully!'\);\n\}\n/g,
  '};\n\n// Seed sample data for offline mode\nexport function seedOfflineDatabase() {\n  logger.info(\'Initializing sample seed data for Mongoose offline mode...\');\n  Object.assign(localDb, defaultSeedData);\n  logger.info(\'Sample seed data initialized successfully!\');\n}\n'
);

// In seedMongoDatabaseIfEmpty, change localDb references to defaultSeedData
code = code.replace(/localDb\['(BusinessDetails|Product|Customer|Supplier)'\]/g, 'defaultSeedData[\'$1\']');

fs.writeFileSync('server/src/utils/offline-mongoose.ts', code);
console.log('Refactored offline-mongoose.ts');
