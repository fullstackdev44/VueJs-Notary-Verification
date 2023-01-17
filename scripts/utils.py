import pika
import os
import pymongo
import logging
from pymongo.errors import ConnectionFailure


mongo_client = None


def get_logger():
    LOG_FORMAT = ('%(levelname) -2s %(asctime)s %(name):%(funcName) '
              '-10s:%(lineno) -5d: %(message)s')
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)
    return logger

def get_amqp_blocking_conn():
    credentials = pika.PlainCredentials(
        os.environ.get('RMQ_USER', "guest"),
        os.environ.get('RMQ_PASS', "guest")
    )
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=os.environ.get("RMQ_HOST", "localhost"),
            credentials=credentials,
            heartbeat=10
        )
    )
    channel = connection.channel()
    return connection, channel


def get_mongo_collection(collection_name, db_name='bluenotary'):
    collection = None
    global mongo_client
    if mongo_client is not None:
        db = mongo_client[db_name]
        collection = db[collection_name]
    else:
        uri = os.environ.get('MONGO_URI', '')
        if not uri:
            uri = f"mongodb://techies/{db_name}"
        try:
            mongo_client = pymongo.MongoClient(uri)
            mongo_client.admin.command('ping')
            db = mongo_client[db_name]
            collection = db[collection_name]
        except ConnectionFailure:
            print('Mongo Connection failure')
            return None
    return collection
