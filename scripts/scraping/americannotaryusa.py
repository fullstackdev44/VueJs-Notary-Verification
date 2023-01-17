import argparse
import logging
import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlencode


logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)

SITE_BASE_URL = "https://americannotaryusa.com/"


def extract_details(data_div):
    if not data_div:
        return []
    content_divs = data_div.find_all('div')
    details = {}
    for d in content_divs:
        attrs = getattr(d, 'attrs')
        if not attrs or 'class' not in attrs:
            continue
        if 'full-name' in attrs['class']:
            spns = [x.get_text(strip=True) for x in d.find_all('span')]
            if len(spns) == 3:
                details['first_name'] = spns[0]
                details['last_name'] = spns[1]
                details['description'] = spns[2]
            continue
        if 'biz-local' in attrs['class']:
            spns = [x.get_text(strip=True) for x in d.find_all('span')]
            details['location'] = " ".join(spns)
            if re.search(r'^\d+$', spns[-1]):
                details['zip_code'] = spns[-1]
            continue
        if 'tel-email' in attrs['class']:
            spns = [x.get_text(strip=True) for x in d.find_all('span')]
            if len(spns) == 2:
                details['phone'] = spns[0]
                details['email'] = spns[1]
            continue

    return details


def scrape_each_zcode(zip_code, failed_zip_codes):
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Host': 'americannotaryusa.com',
        'Pragma': 'no-cache',
        'Referer': f'https://americannotaryusa.com/notary-search?search_api_views_fulltext={zip_code}',
        'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
    get_payload = {
        'search_api_views_fulltext': str(zip_code)
    }
    full_search_url = urljoin(SITE_BASE_URL, "/notary-search")+"?"+urlencode(get_payload)
    web_resp = None
    for _ in range(3):
        try:
            logging.info(f"url-hit {full_search_url}")
            web_resp = requests.get(full_search_url, headers=headers, timeout=100)
            web_resp.raise_for_status()
            break
        except requests.RequestException as e:
            logging.error(str(e))
            print("Retrying...")
            web_resp = None
            continue

    if web_resp is None:
        failed_zip_codes.append(zip_code)
        return []

    soup = BeautifulSoup(web_resp.content, 'lxml')
    content_div = soup.find('div', attrs={'id': 'block-system-main'})
    if not content_div:
        return []
    results = []
    data_divs = content_div.find_all('div', attrs={'class': 'views-row'})
    for d in data_divs:
        details = extract_details(d)
        if 'email' not in details:
            continue
        results.append(details)
    return results


def scrape(zip_codes, mongo_collection):
    """
    Search & scrape zip codes for notary profiles on americannotaryusa website
    @zip_codes: list of zip_codes to be used in searching
    @mongo_collection: mongo collection to save notary profiles
    """
    failed_zip_codes = []

    update_source = "americannotaryusa"
    for zcode in zip_codes:
        results = scrape_each_zcode(zcode, failed_zip_codes)
        logging.info(f"Found {len(results)} notaries for {zcode}")
        for notary_details in results:
            if 'zip_code' not in notary_details:
                notary_details['zip_code'] = zcode

            if notary_details['email']:
                uni_key = "email"
                uni_key_val = notary_details[uni_key]
            elif notary_details['phone']:
                uni_key = "phone"
                uni_key_val = notary_details[uni_key]
            else:
                continue

            notary_details['source'] = update_source
            existing_doc = mongo_collection.find_one({uni_key: uni_key_val})
            if existing_doc:
                notary_details['updatedAt'] = datetime.utcnow()
                if existing_doc['source'] != update_source:
                    mongo_collection.update_one({"_id": existing_doc['_id']}, {
                        '$set': notary_details,
                        '$addToSet': {
                            'update_sources': update_source
                        }
                    })
                else:
                    mongo_collection.update_one({"_id": existing_doc['_id']}, {
                        '$set': notary_details
                    })
                logging.info(f"update-notary-profile {uni_key}={uni_key_val}")
            else:
                notary_details['updatedAt'] = datetime.utcnow()
                notary_details['createdAt'] = datetime.utcnow()
                notary_details['update_sources'] = [update_source]
                mongo_collection.insert_one(notary_details)
                logging.info(f"saved-notary-profile {uni_key}={uni_key_val}")

    if failed_zip_codes:
        with open('/tmp/failed_zip_codes.json', 'w') as f:
            json.dump(failed_zip_codes, f)
        logging.info("failed-zip-codes are saved in /tmp/failed_zip_codes.json")

    return failed_zip_codes
