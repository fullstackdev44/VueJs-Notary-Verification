import logging
import re
import requests
import bs4
from datetime import datetime


logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO)
SITE_BASE_URL = "https://www.asnnotary.org/"


def get_notary_links(zip_code):
    url = f"{SITE_BASE_URL}?param_zip%7Ecode_z_r_5={zip_code}&x=15&y=12&param_has%7Eemail_b_n_1=1&form=locator"
    try:
        logging.info(f"url-hit {url}")
        r = requests.get(url, timeout=100)
        r.raise_for_status()
    except requests.RequestException as e:
        logging.error(str(e))
        return {}
    soup = bs4.BeautifulSoup(r.content, 'lxml')
    rgx = re.compile('openwin\(\'(\?form\=locatordetails\&altdoc\=true\&lid\=\d+)\'')
    atags = soup.find_all('a', attrs={'onclick': rgx})
    links = set()
    for x in atags:
        txt = x['onclick']
        m = re.search(rgx, txt)
        if not m:
            continue
        link = f"{SITE_BASE_URL}{m.group(1)}"
        links.add(link)
    to_return = {
        'links': links,
        'location_meta': {
            'source': 'asnnotary'
        }
    }
    location_data_tbl = soup.find('table', attrs={'id': 'notary-search-location'})
    if location_data_tbl:
        tds = location_data_tbl.find_all('td')
        for i, td in enumerate(tds):
            if i % 2 != 0:
                continue
            try:
                txt = td.get_text(strip=True).strip()
                data_txt = tds[i+1].get_text(strip=True)
            except IndexError:
                continue

            if txt == "Zip Code":
                to_return['location_meta']['zip_code'] = data_txt
            elif txt == "City":
                to_return['location_meta']['city'] = data_txt
            elif txt == "County":
                to_return['location_meta']['country'] = data_txt
            elif txt == "State":
                to_return['location_meta']['state'] = data_txt
            elif txt == "Notaries":
                to_return['location_meta']['notary_count'] = data_txt

    return to_return


def extract_notary_details(soup):
    data = {}
    tbl = soup.find('table', attrs={'class': 'cart', 'style': 'width:100%;'})
    if not tbl:
        return data
    trs = tbl.find_all('tr', recursive=False)
    if len(trs) < 5:
        return data
    name_tag = trs[1].find('strong')
    if name_tag:
        name_email = name_tag.get_text(strip=True).split('•')
        if len(name_email) == 1:
            data['name'] = name_email[0].strip()
        elif len(name_email) == 2:
            data['name'] = name_email[0].strip()
            data['email'] = name_email[1].strip()
        contact_data = name_tag.next_sibling
        if isinstance(contact_data, bs4.element.NavigableString):
            contact_data = contact_data.get_text(strip=True).split('•')
            if len(contact_data) == 3:
                data['address'] = contact_data[0]
                phone_data = contact_data[1].split(':')
                if len(phone_data) == 2:
                    data['phone'] = phone_data[1].strip()
                cell_data = contact_data[2].split(':')
                if len(cell_data) == 2:
                    data['cell'] = cell_data[1].strip()

    fax_data = trs[3].get_text(strip=True).split('•')
    if len(fax_data) == 2:
        d = fax_data[0].split(':')
        if len(d) == 2:
            data['fax'] = d[1].strip()
        d = fax_data[1].split(':')
        if len(d) == 2:
            data['efax'] = d[1]

    web_data = trs[4].get_text(strip=True).split('•')
    if len(web_data) == 2:
        atag = trs[4].find('a')
        if atag:
            data['website'] = atag.get_text(strip=True)
        else:
            data['website'] = "NA"
        d = web_data[1].split(':')
        if len(d) == 2:
            data['pager'] = d[1]

    return data


def scrape_each_zcode(zip_code, mongo_collection):
    links = get_notary_links(zip_code)
    notary_links = links.pop('links', {})
    location_details = links.pop('location_meta', {})
    if not notary_links:
        logging.error(f"no-links-found zip={zip_code}")
        return

    location_details['zip_code'] = zip_code

    scraped_count = 0
    for link in notary_links:
        try:
            logging.info(f"url-hit url={link}")
            r = requests.get(link, timeout=100)
            r.raise_for_status()
        except requests.RequestException as e:
            logging.error(str(e))
            continue
        soup = bs4.BeautifulSoup(r.content, 'lxml')
        notary_details = extract_notary_details(soup)
        if 'email' not in notary_details:
            logging.error("failed-to-extract-notary-details")
            logging.error(link)
            continue
        notary_details.update(location_details)

        existing_doc = mongo_collection.find_one({"email": notary_details['email']})
        if existing_doc:
            notary_details['updatedAt'] = datetime.utcnow()
            mongo_collection.update_one({"_id": existing_doc['_id']}, {
                '$set': notary_details
            })
            logging.info(f"update-notary-profile email={notary_details['email']}")
        else:
            notary_details['updatedAt'] = datetime.utcnow()
            notary_details['createdAt'] = datetime.utcnow()
            mongo_collection.insert_one(notary_details)
            logging.info(f"saved-notary-profile email={notary_details['email']}")
        scraped_count += 1

    logging.info(f"found {scraped_count} for zipcode: {zip_code}")


def scrape(zip_codes, mongo_collection):
    """
    Search & scrape notary profiles by given zipcodes and save it into mongo_collection
    """
    for zc in zip_codes:
        scrape_each_zcode(zc, mongo_collection)