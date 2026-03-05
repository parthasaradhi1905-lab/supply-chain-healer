async function checkDisruptions() {
    try {
        const res = await fetch('http://localhost:3001/api/disruptions/active');
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}
checkDisruptions();
