#!/usr/bin/python
import os, sys, datetime, tarfile, os.path
from pymongo import MongoClient
from bson.json_util import dumps
import boto3
import shutil
import sys
import datetime


# The collections mentioned below will be backed up on Sundays as those are large collections
WEEKLY_BACKUP_COLLECTIONS = [
    "sessiondraftsdatas",
    "signaturesdatas",
    "useractivitylogs"
]

DAILY_ONCE_BACKUP_COLLECTIONS = [
    "pdfdroppedelementsdatas"
]


def create_folder_backup(dbname):
    dt = datetime.datetime.now()
    directory = ('backups/mongo_%s_%s-%s-%s__%s_%s' % (dbname,dt.month,dt.day,dt.year, dt.hour, dt.minute))
    if not os.path.exists(directory):
        os.makedirs(directory)
    return directory


def run_backup(mongoUri, dbname, callNumber):
    client = MongoClient(mongoUri)
    db = client[dbname]
    collections = db.list_collection_names()
    files_to_compress = []
    directory = create_folder_backup(dbname)
    current_day = datetime.datetime.today().weekday()
    for collection in collections:
        if collection in WEEKLY_BACKUP_COLLECTIONS and current_day != 0:
            continue
        if collection in DAILY_ONCE_BACKUP_COLLECTIONS and callNumber not in ["1", 1]:
            continue
        db_collection = db[collection]
        cursor = db_collection.find({})
        filename = ('%s/%s.json' %(directory,collection))
        files_to_compress.append(filename)
        with open(filename, 'w') as file:
            file.write('[')
            for document in cursor:
                file.write(dumps(document))
                file.write(',')
            file.write(']')
    tar_file = ('%s.tar.gz' % (directory)) 
    make_tarfile(tar_file,files_to_compress)


def make_tarfile(output_filename, source_dir):
    tar = tarfile.open(output_filename, "w:gz")
    for filename in source_dir:
        tar.add(filename)
    tar.close()

    AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
    AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']

    bucket_name = 'bluenotarymongobackups'

    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )
    s3 = session.resource('s3')

    print('[*] Uploading %s to Amazon S3 bucket %s' % (output_filename, bucket_name))
    s3.meta.client.upload_file(Filename=output_filename, Bucket=bucket_name, Key=output_filename)
    try:
        shutil.rmtree('backups')
        print('[*] Backup Deleted Successfully')
    except OSError as e:
        print("[-] Error: %s - %s." % (e.filename, e.strerror))


if __name__ == '__main__':
    host = "localhost"
    port = 27017
    dbname = "bluenotary"
    print('[*] Starting Backup')
    mongoUri = ('mongodb://%s:%s/%s?authSource=admin' % (host, port, dbname))
    print('[*] Mongodb Connection Established')
    try:
        callNumber = sys.argv[1]
        run_backup(mongoUri, dbname, callNumber)
        print('[*] Successfully performed backup')
    except Exception as e:
        print(e)
        print('[-] An unexpected error has occurred')
        print('[-] '+ str(e) )
        print('[-] EXIT')