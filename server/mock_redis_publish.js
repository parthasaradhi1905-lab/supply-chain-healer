import Redis from 'ioredis';

const redis = new Redis();
const payload = JSON.stringify({
    risk_score: 0.92,
    delay_days: 12,
    nodes: ['Shanghai', 'Singapore_Logistics']
});

console.log('Publishing mock risk prediction...');
redis.publish('stream:risk.predictions', payload)
    .then(() => {
        console.log('Successfully published!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to publish:', err);
        process.exit(1);
    });
