const fs = require('fs');

// Patch 1: Buffer polyfill in main.jsx
const mainPath = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/main.jsx';
let mainContent = fs.readFileSync(mainPath, 'utf8');

const polyfills = `import { Buffer } from 'buffer';\nwindow.Buffer = window.Buffer || Buffer;\nwindow.global = window.global || window;\n`;

if (!mainContent.includes('window.Buffer')) {
    mainContent = polyfills + mainContent;
    fs.writeFileSync(mainPath, mainContent, 'utf8');
    console.log('Patched main.jsx with Buffer polyfill');
}

// Patch 2: addedToCart missing state in CustomerProductsPage.jsx
const productsPath = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/customer/products/CustomerProductsPage.jsx';
let productsContent = fs.readFileSync(productsPath, 'utf8');

if (!productsContent.includes('const [addedToCart')) {
    productsContent = productsContent.replace(
        'const [checkoutProduct, setCheckoutProduct] = useState(null);',
        'const [checkoutProduct, setCheckoutProduct] = useState(null);\n  const [addedToCart, setAddedToCart] = useState(null);'
    );
    
    // Also patch addToCart to setAddedToCart
    productsContent = productsContent.replace(
        'saveCart(nextCart);',
        'saveCart(nextCart);\n      setAddedToCart(product.id);\n      setTimeout(() => setAddedToCart(null), 2000);'
    );

    fs.writeFileSync(productsPath, productsContent, 'utf8');
    console.log('Patched CustomerProductsPage.jsx with addedToCart state');
}
