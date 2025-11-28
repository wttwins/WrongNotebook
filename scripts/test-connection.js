const dns = require('dns');

console.log("Testing network connectivity...");

// 1. Test DNS resolution
dns.lookup('generativelanguage.googleapis.com', (err, address, family) => {
    if (err) {
        console.error('❌ DNS Lookup failed:', err);
    } else {
        console.log('✅ DNS Lookup successful:', address);

        // 2. Test Fetch
        console.log('Testing fetch to Google API...');
        fetch('https://generativelanguage.googleapis.com', { method: 'HEAD' })
            .then(res => console.log(`✅ Fetch successful. Status: ${res.status}`))
            .catch(err => {
                console.error('❌ Fetch failed:', err);
                if (err.cause) console.error('Cause:', err.cause);
            });
    }
});
