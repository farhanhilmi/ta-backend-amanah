import redis from 'redis-promisify';
import config from '../config/index.js';

let client;

export const redisClient = () => {
    try {
        if (client && client.connected) {
            // If the client is already connected, return the existing client
            return client;
        } else {
            // Create a new Redis client
            client = redis.createClient({
                password: '0nBprflT8j8YyqQkSK9XYCXZbVzfTWS1',
                host: 'redis-18436.c252.ap-southeast-1-1.ec2.cloud.redislabs.com',
                port: 18436,
                retry_strategy: (options) => {
                    if (
                        options.error &&
                        options.error.code === 'ECONNREFUSED'
                    ) {
                        console.log('redis refused to connect');
                    } else {
                        return Math.min(options.attempt * 100, 3000);
                    }
                },
            });

            // Event listener for Redis connection errors
            client.on('error', function (error) {
                console.error('Redis connection error:', error);
            });

            // Event listener for Redis reconnection
            client.on('ready', function () {
                console.log('Redis reconnected');
            });

            return client;
        }
    } catch (error) {
        console.log('ERROR REDIS', error);
    }
};

export const isCached = async (cacheKey) => {
    // const { error, client } = redisClient();
    // if (!error) {
    //     console.log('cacheKey', cacheKey);
    //     if (cachedItems) return await JSON.parse(cachedItems);
    // }
    const redisClientInstance = redisClient();

    // Check if the key exists
    redisClientInstance.exists(cacheKey, async function (error, response) {
        if (error) {
            console.error('Redis key availability check failed:', error);
        } else {
            if (response === 1) {
                const cachedItems = await redisClientInstance.getAsync(
                    cacheKey,
                );
                if (cachedItems) return await JSON.parse(cachedItems);
            } else {
                console.log('[redis] Key does not exist');
                return false;
            }
        }
    });

    return false;
};

// isCached('userloan:');

export const setCache = (cacheKey, data) => {
    try {
        const redisClientInstance = redisClient();

        // Perform the set operation
        redisClientInstance.set(
            cacheKey,
            JSON.stringify(data),
            'EX',
            3600,
            function (error) {
                if (error) {
                    console.error('Redis set operation failed:', error);
                    // Close the Redis connection
                    redisClientInstance.quit();
                    // Handle the error and retry the operation
                    handleRedisError(cacheKey, JSON.stringify(data));
                } else {
                    console.log('[redis] Data cached successfully');
                    // Close the Redis connection
                    redisClientInstance.quit();
                }
            },
        );
    } catch (error) {
        throw error;
    }
};

// Function to handle Redis errors and reconnect
function handleRedisError(key, data) {
    // Implement your retry logic here
    // Example: Retry after 5 seconds
    setTimeout(function () {
        console.log('Retrying Redis set operation');
        cacheData(key, data);
    }, 5000);
}

export const deleteCache = (isBatch, keyPattern) => {
    try {
        const { error, client } = redisClient();
        if (error) return;
        if (!isBatch) {
            client.del(keyPattern);
            return;
        }
        // delete matching keys with pattern
        client.keys(keyPattern, (err, key) => {
            if (key.length === 0) return;
            console.log('key', key);
            client.del(key);
        });
    } catch (error) {
        throw error;
    }
};
