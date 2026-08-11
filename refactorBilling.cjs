const fs = require('fs');

let content = fs.readFileSync('src/components/BillingModule.tsx', 'utf8');

// Wrap filteredCustomers in useMemo
const target = `const filteredCustomers = customers.filter(c => {
    const searchLower = customerSearch.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(searchLower) ||
      (c.mobile || '').includes(searchLower) ||
      (c.city || '').toLowerCase().includes(searchLower) ||
      (c.address || '').toLowerCase().includes(searchLower)
    );
  });`;

const replacement = `const filteredCustomers = React.useMemo(() => {
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(searchLower) ||
      (c.mobile || '').includes(searchLower) ||
      (c.city || '').toLowerCase().includes(searchLower) ||
      (c.address || '').toLowerCase().includes(searchLower)
    );
  }, [customers, customerSearch]);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/BillingModule.tsx', content, 'utf8');
console.log('Optimized BillingModule.tsx');
