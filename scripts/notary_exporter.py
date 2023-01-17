import utils
import xlsxwriter
from datetime import datetime
import argparse
import json
import os


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-q', type=str, help="JSON string to use in mongo query", required=True)
    parser.add_argument('-o', type=str, help="Output file path", required=True)
    parser.add_argument('-ks', type=str, help="comma seperated key to export")
    args = parser.parse_args()

    query = {}
    try:
        query = json.loads(args.q)
    except:
        print("Please provide valid query")
        exit()

    if args.ks:
        export_keys = args.ks.split(',')
    else:
        export_keys = ['name', 'email', 'phone', 'state', 'location', 'zip_code', 'source']

    output_file = args.o
    if os.path.exists(output_file):
        print("Output path already exists")
        exit()

    if not output_file.endswith('.xlsx'):
        output_file += '.xlsx'

    workbook = xlsxwriter.Workbook(output_file)
    worksheet = workbook.add_worksheet()

    row = 0

    cols = {}
    for i, k in enumerate(export_keys):
        cols[k.lower()] = i

    bn_users = utils.get_mongo_collection('users')
    row = bn_user_counts = 0
    publicnotaries = utils.get_mongo_collection('publicnotaries').find(query)
    for n in publicnotaries:

        if 'email' in n:
            email = n['email']
            if 0 != (bn_users.count_documents({'email': email})):
                print(f"{email} is already bn user")
                bn_user_counts += 1
                continue

        if 'name' not in n:
            if ('first_name' in n and 'last_name' in n):
                n['name'] = f"{n['first_name']} {n['last_name']}"
            else:
                continue

        for col, idx in cols.items():
            val = n.get(col, '-')
            if col in ('issue_date', 'expiry_date') and isinstance(val, datetime):
                val = val.strftime("%d-%b-%Y")
            worksheet.write(row, idx, val)

        row += 1

    workbook.close()

    print(f"Total bnusers are {bn_user_counts}")


if __name__ == "__main__":
    main()