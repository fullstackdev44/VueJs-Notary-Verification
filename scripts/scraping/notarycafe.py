import argparse
import logging
import requests
import math
from datetime import datetime
from urllib.parse import urljoin

logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)

SITE_BASE_URL = "https://notarycafe.com/"


KEY_MAP = {
    "DefaultEmail": "email",
    "DefaultPhone": "phone",
    "Description": "description",
    "FullName": "full_name",
    "State": "state",
    "UrlIdentifier": "link_id",
    "Zip": "zip_code"
}

def search(zip_code):
    search_url = urljoin(SITE_BASE_URL, "api/ProfilesSearchRequest")
    headers = {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'content-length': '173',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'cookie': '_ga=GA1.2.1936482854.1671853989; _gid=GA1.2.752403360.1671853989; HasSeenVideo=True; nsProfiles=1011100111111_0_111; _gat=1',
        'origin': 'https://notarycafe.com',
        'referer': 'https://notarycafe.com/find-a-notary',
        'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
    }
    page_size = 10
    try:
        payload = {
            "SearchString": f"Zip:{str(zip_code)}",
            "Name": "",
            "Company": "",
            "Languages": 0,
            "HasMileage": "false",
            "LocationName": "",
            "Radius": 10,
            "SortBy": "",
            "PageSize": page_size,
            "CurrentPage": 1,
            "Type": 3,
            "InterpretedSearchString": "",
            "IsInitialSearch": "true"
        }
        logging.info(f"url-hit {search_url}")
        r = requests.post(search_url, data=payload, headers=headers, timeout=60)
        r.raise_for_status()
        response = r.json()
    except Exception as e:
        logging.error(str(e))
        return []

    results = response.pop('Results', [])
    request_data = response.pop('Request', [])
    if len(request_data) < 0:
        logging.error("Invalid request data")
        return []
    request_data = request_data[0]
    try:
        curr_page = request_data['CurrentPage']
        result_count = request_data['RecordCount']
        page_size = request_data['PageSize']
    except KeyError:
        logging.error("invalid initial response json")
        return []

    total_pages = math.ceil(result_count / page_size)
    try_count = 0
    while curr_page < total_pages:
        curr_page += 1
        payload.update({
            "CurrentPage": curr_page
        })
        try:
            logging.info(f"url-hit {search_url} page={curr_page}")
            r = requests.post(search_url, data=payload, headers=headers, timeout=60)
            r.raise_for_status()
            response = r.json()
            curr_page_data = response.pop('Results', [])
            results.extend(curr_page_data)
        except Exception as e:
            logging.error(str(e))
            curr_page -= 1
            if try_count >= 3:
                break
            else:
                try_count += 1
                continue
        try_count = 0

    return results


def scrape(zip_codes, mongo_collection):
    """
    Scrapes notarycafe for notary profiles
    @zip_codes: list of zip_codes to be used in searching
    @mongo_collection: mongo collection to save notary profiles
    """

    update_source = "notarycafe"
    for zcode in zip_codes:

        search_result = search(zcode)
        logging.info(f"Found {len(search_result)} notaries for {zcode}")

        for profile in search_result:
            if profile.get('DefaultEmail', False):
                uni_key = "email"
                uni_key_val = profile['DefaultEmail']
            elif profile.get('DefaultPhone', False):
                uni_key = "phone"
                uni_key_val = profile['DefaultPhone']
            else:
                continue

            notary = {}
            for k, v in KEY_MAP.items():
                try:
                    notary[v] = str(profile[k]).strip()
                except KeyError as e:
                    logging.error(str(e))
                    continue

            notary['updatedAt'] = datetime.utcnow()
            existing_doc = mongo_collection.find_one({
                uni_key: uni_key_val
            })
            if existing_doc:
                if existing_doc['source'] != update_source:
                    mongo_collection.update_one({"_id": existing_doc['_id']}, {
                        '$set': notary,
                        '$addToSet': {
                            'update_sources': update_source
                        }
                    })
                else:
                    mongo_collection.update_one({"_id": existing_doc['_id']}, {
                        '$set': notary
                    })
                logging.info(f"update-notary-profile {uni_key}={uni_key_val}")
            else:
                notary['source'] = update_source
                notary['createdAt'] = datetime.utcnow()
                notary['update_sources'] = [update_source]
                mongo_collection.insert_one(notary)
                logging.info(f"saved-notary-profile {uni_key}={uni_key_val}")

    return
