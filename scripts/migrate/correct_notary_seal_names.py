import pymongo
from bson import ObjectId
from datetime import datetime
import csv
import re
from pprint import pprint
from bson import ObjectId
from pprint import pprint
import boto3
import os

AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']

bucket_name = 'bluenotarymongobackups'

session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)
s3 = session.resource('s3')
bucket = s3.Bucket('bluenotarybuckey2')

all_bucket_objects = list(bucket.objects.all())

client = pymongo.MongoClient()
db = client['bluenotary']

pv_notarydatas = db['notarydatas']

for notary_data in list(pv_notarydatas.find({
    "sealfilename": {"$regex": "^[a-zA-Z]"}
})):
    sealname = notary_data["sealfilename"]
    keys_matched = []
    print("email", notary_data["email"])
    print(sealname)
    for tempobj in all_bucket_objects:
        tempkey = tempobj.key
        if sealname in tempkey:
            if tempkey not in keys_matched:
                keys_matched.append(tempkey)
                print(len(keys_matched), tempkey)
    final_key = False
    if len(keys_matched) > 1:
        index_matched = input()
        if int(index_matched) == 0:
            continue
        final_key = keys_matched[int(index_matched) - 1]
    elif len(keys_matched) == 1:
        final_key = keys_matched[0]
    print("final_key", final_key)
    if final_key:
        pv_notarydatas.update_one({
            "_id": notary_data["_id"]
        }, {
            "$set": {
                "oldsealfilename": sealname,
                "sealfilename": final_key
            }
        })