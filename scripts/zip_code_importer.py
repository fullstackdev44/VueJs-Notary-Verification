from bs4 import BeautifulSoup
import requests
import sys

import utils


STATE_LINKS = {
    'arizona': 'https://naijaknowhow.net/arizona-zip-codes/',
    'maine': 'https://naijaknowhow.net/maine-zip-codes/',
    'california': 'https://naijaknowhow.net/california-zip-codes/',
    'illinois': 'https://naijaknowhow.net/illinois-zip-codes/',
    'new_york': 'https://naijaknowhow.net/new-york-zip-codes/',
    'connecticut': 'https://naijaknowhow.net/connecticut-zip-codes/',
    'idaho': 'https://naijaknowhow.net/idaho-zip-codes/',
    'arkansas': 'https://naijaknowhow.net/arkansas-zip-codes/',
    'iowa': 'https://naijaknowhow.net/iowa-zip-codes/',
    'alaska': 'https://naijaknowhow.net/alaska-zip-codes/',
    'kansas': 'https://naijaknowhow.net/kansas-zip-codes/',
    'indiana': 'https://naijaknowhow.net/indiana-zip-codes/',
    'massachusetts': 'https://naijaknowhow.net/massachusetts-zip-codes/',
    'colorado': 'https://naijaknowhow.net/colorado-zip-codes/',
    'alabama': 'https://naijaknowhow.net/alabama-zip-codes/',
    'georgia': 'https://naijaknowhow.net/georgia-zip-codes/',
    'louisiana': 'https://naijaknowhow.net/louisiana-zip-codes/',
    'kentucky': 'https://naijaknowhow.net/kentucky-zip-codes/',
    'delaware': 'https://naijaknowhow.net/delaware-zip-codes/',
    'hawaii': 'https://naijaknowhow.net/hawaii-zip-codes/',
    'michigan': 'https://naijaknowhow.net/michigan-zip-codes/',
    'florida': 'https://naijaknowhow.net/florida-zip-codes/',
    'maryland': 'https://naijaknowhow.net/maryland-zip-codes/'
}


def get_zip_codes(link):
    r = requests.get(link)
    r.raise_for_status()
    soup = BeautifulSoup(r.content, 'lxml')
    table = soup.find_all('table')[0]
    trs = table.find_all('tr')[1:]
    zip_codes = []
    for r in trs:
        try:
            tds = [x.get_text(strip=True) for x in r.find_all('td')]
            city = tds[0]
            county = tds[1]
            zcode = tds[2]
            zip_codes.append({
                'city': city,
                'county': county,
                'zip_code': zcode,
            })
        except IndexError as e:
            print(r)

    print(f"found {len(zip_codes)} for {link}")
    return zip_codes


if __name__ == "__main__":

    usa_states = utils.get_mongo_collection('usa_states')
    zip_codes = utils.get_mongo_collection('usa_zip_codes')

    if len(sys.argv) < 2:
        print("""
        [name].py <statenames> comma seperated
        """)
        exit(-1)

    state_name_arg = sys.argv[1].strip()
    if state_name_arg == "all":
        state_names = STATE_LINKS.keys()
    else:
        state_names = sys.argv[1].strip().split(',')

    failed_count = 0
    for state in state_names:
        if state not in STATE_LINKS:
            print(f"link is not availabe for {state}")
            continue

        print(f"Working on {state} state")

        link = STATE_LINKS[state]
        zcodes = get_zip_codes(link)
        if not zcodes:
            failed_count += 1
            continue

        state_doc = usa_states.find_one({'name': state})
        if state_doc is None:
            state_oid = usa_states.insert_one({'name': state}).inserted_id
        else:
            state_oid = state_doc['_id']

        for zc in zcodes:
            zc['state_oid'] = state_oid
            if zip_codes.count_documents({"zip_code": zc['zip_code']}):
                failed_count += 1
                continue

            zip_codes.insert_one(zc)

        print(f"saved {state}")
