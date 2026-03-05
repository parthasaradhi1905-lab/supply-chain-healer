async function testPatch() {
    try {
        console.log('Testing PATCH /orders/1/status...');
        const res = await fetch('http://localhost:3001/api/orders/1/status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'processing' })
        });

        if (!res.ok) {
            console.error('Error status:', res.status);
            const text = await res.text();
            console.error('Error body:', text);
        } else {
            const data = await res.json();
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPatch();
