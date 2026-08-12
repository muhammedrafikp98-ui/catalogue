const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'products');
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const products = files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch(e) { 
      return null; 
    }
  }).filter(Boolean);
  
  fs.writeFileSync(path.join(__dirname, 'content', 'products.json'), JSON.stringify(products, null, 2));
  console.log(`Successfully compiled ${products.length} products to content/products.json`);
}
