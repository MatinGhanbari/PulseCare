import os
import json

import redis
from redis.exceptions import ConnectionError

# Initialize Redis connection
redis_client = redis.StrictRedis(
    host=os.getenv('REDIS_HOST'),
    port=os.getenv('REDIS_PORT'),
    db=os.getenv('REDIS_DB')
)


def remove_keys_with_prefix(client, prefix):
    try:
        cursor = 0
        while True:
            cursor, keys = client.scan(cursor, match=f"{prefix}*")
            if keys:
                client.delete(*keys)
            if cursor == 0:
                break
    except ConnectionError as error:
        print(f"Redis is unavailable! Message: {str(error)}")
